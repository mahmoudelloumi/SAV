import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft, Home, Smartphone, Send } from 'lucide-react';
import { connexion, setupTotp, verifyTotp, envoyerCodeEmail2fa, statutEmail, definirMotDePasse } from '../../api/authService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, PasswordInput } from '../../components/ui/Input.jsx';
import ThemeToggle from '../../components/ui/ThemeToggle.jsx';
import BulleWhatsApp from '../../components/ui/BulleWhatsApp.jsx';
import logo from '../../assets/logo_idsoft.png';

// ============================================================
// Connexion en plusieurs étapes (email-first) :
//   EMAIL        : saisir l'email → on détermine la suite
//   MOT_DE_PASSE : compte normal → saisir le mot de passe
//   DEFINIR_MDP  : client créé par le SAV → code e-mail + nouveau mot de passe
//   CODE         : double authentification (Authenticator ou code e-mail)
// ============================================================

export default function Login() {
  // Étapes : EMAIL -> (MOT_DE_PASSE | DEFINIR_MDP) -> CODE (2FA)
  const [etape, setEtape] = useState('EMAIL');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [code, setCode] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmationMdp, setConfirmationMdp] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  // 2FA : méthode choisie ('AUTH' = Google Authenticator, 'EMAIL' = code par e-mail)
  const [methode, setMethode] = useState('');
  const [twoFaActif, setTwoFaActif] = useState(false);
  const [emailEnvoye, setEmailEnvoye] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Étape 1 : email → on détermine s'il faut définir le mot de passe ou le saisir.
  async function soumettreEmail(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      const { data } = await statutEmail(email);
      if (data.existe === false) {
        setErreur("Aucun compte n'est associé à cet email. Créez un compte.");
        return;
      }
      if (data.motDePasseAInitialiser) {
        // Client créé par le SAV : on envoie un code par e-mail puis on définit le MDP.
        await envoyerCodeEmail2fa(email);
        setCode('');
        setNouveauMdp('');
        setConfirmationMdp('');
        setEtape('DEFINIR_MDP');
      } else {
        setMotDePasse('');
        setEtape('MOT_DE_PASSE');
      }
    } catch (err) {
      setErreur(messageErreur(err, 'Impossible de continuer. Réessayez.'));
    } finally {
      setChargement(false);
    }
  }

  // Étape 2a : mot de passe habituel → connexion puis 2FA.
  async function soumettreMotDePasse(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      const { data } = await connexion(email, motDePasse);

      if (data.token && !data.twoFactorRequired) {
        login(data);
        navigate('/app');
        return;
      }

      setTwoFaActif(data.twoFactorActive);
      setMethode(data.twoFactorActive ? 'AUTH' : '');
      setCode('');
      setQrCode(null);
      setEmailEnvoye(false);
      setEtape('CODE');
    } catch (err) {
      setErreur(messageErreur(err, 'Mot de passe incorrect.'));
    } finally {
      setChargement(false);
    }
  }

  // Étape 2b : définition du mot de passe (1re connexion) via le code reçu par e-mail.
  async function soumettreDefinir(e) {
    e.preventDefault();
    setErreur('');
    if (nouveauMdp !== confirmationMdp) {
      setErreur('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setChargement(true);
    try {
      const { data } = await definirMotDePasse(email, code, nouveauMdp);
      login(data);
      navigate('/app');
    } catch (err) {
      setErreur(messageErreur(err, 'Impossible de définir le mot de passe.'));
    } finally {
      setChargement(false);
    }
  }

  // Méthode « Application » : configure le QR si le 2FA n'est pas encore activé.
  async function choisirAuth() {
    setErreur('');
    setMethode('AUTH');
    if (!twoFaActif && !qrCode) {
      try {
        const setup = await setupTotp(email);
        setQrCode(setup.data.qrCodeImageUri);
      } catch (err) {
        setErreur(messageErreur(err, "Impossible de configurer l'application."));
      }
    }
  }

  // Méthode « E-mail » : envoie un code à l'adresse du compte.
  async function envoyerEmail() {
    setErreur('');
    setChargement(true);
    try {
      await envoyerCodeEmail2fa(email);
      setEmailEnvoye(true);
    } catch (err) {
      setErreur(messageErreur(err, "Impossible d'envoyer le code par e-mail."));
    } finally {
      setChargement(false);
    }
  }

  async function soumettreCode(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      const { data } = await verifyTotp(email, code);
      login(data);
      navigate('/app');
    } catch (err) {
      setErreur(messageErreur(err, 'Code invalide. Réessayez.'));
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-light-bg dark:bg-dark-bg px-4">
      <FondAbstrait />

      <div className="absolute top-6 right-6 flex items-center gap-3">
        <ThemeToggle />
      </div>

      <Link to="/" className="absolute top-6 left-6">
        <img src={logo} alt="ID SOFT" className="h-9 w-auto drop-shadow-[0_0_10px_rgba(255,122,0,0.35)]" />
      </Link>

      <Card className="relative w-full max-w-md p-8">
        <Link
          to="/"
          aria-label="Retour à l'accueil"
          title="Accueil"
          className="absolute top-4 left-4 grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <Home size={18} />
        </Link>
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {etape === 'DEFINIR_MDP' ? 'Définir votre mot de passe'
              : etape === 'CODE' ? 'Double authentification'
              : 'Bon retour parmi nous'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {etape === 'EMAIL' ? 'Connectez-vous à votre espace ID SOFT'
              : etape === 'MOT_DE_PASSE' ? email
              : etape === 'DEFINIR_MDP' ? 'Première connexion — un code vous a été envoyé par e-mail'
              : 'Confirmez votre identité pour continuer'}
          </p>
        </div>

        <AnimatePresence>
          {erreur && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400"
            >
              {erreur}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {etape === 'EMAIL' && (
            <motion.form
              key="email"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              onSubmit={soumettreEmail}
              className="space-y-4"
            >
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-[42px] text-slate-400" />
                <Input
                  label="Email"
                  type="email"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" loading={chargement} className="w-full" icon={ArrowRight}>
                Continuer
              </Button>
            </motion.form>
          )}

          {etape === 'MOT_DE_PASSE' && (
            <motion.form
              key="motdepasse"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              onSubmit={soumettreMotDePasse}
              className="space-y-4"
            >
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-[42px] text-slate-400 z-10" />
                <PasswordInput
                  label="Mot de passe"
                  className="pl-10"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="text-right -mt-1">
                <Link to="/mot-de-passe-oublie" className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <Button type="submit" loading={chargement} className="w-full" icon={ArrowRight}>
                Se connecter
              </Button>
              <button type="button" onClick={() => { setEtape('EMAIL'); setErreur(''); }}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-brand-500 mx-auto">
                <ArrowLeft size={14} /> Retour
              </button>
            </motion.form>
          )}

          {etape === 'DEFINIR_MDP' && (
            <motion.form
              key="definir"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              onSubmit={soumettreDefinir}
              className="space-y-4"
            >
              <p className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400">
                Un code a été envoyé à {email}. Consultez votre boîte mail (et les spams).
              </p>
              <div className="relative">
                <ShieldCheck size={16} className="absolute left-3.5 top-[42px] text-slate-400" />
                <Input
                  label="Code reçu par e-mail"
                  inputMode="numeric"
                  maxLength={6}
                  className="pl-10 tracking-[0.3em] text-center font-semibold"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
              </div>
              <PasswordInput
                label="Nouveau mot de passe"
                value={nouveauMdp}
                onChange={(e) => setNouveauMdp(e.target.value)}
                hint="Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial."
                required
              />
              <PasswordInput
                label="Confirmer le mot de passe"
                value={confirmationMdp}
                onChange={(e) => setConfirmationMdp(e.target.value)}
                erreur={confirmationMdp && confirmationMdp !== nouveauMdp ? 'Les mots de passe ne correspondent pas.' : ''}
                required
              />
              <Button type="submit" loading={chargement} className="w-full" icon={ArrowRight}>
                Définir et se connecter
              </Button>
              <button type="button" onClick={() => { setEtape('EMAIL'); setErreur(''); }}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-brand-500 mx-auto">
                <ArrowLeft size={14} /> Retour
              </button>
            </motion.form>
          )}

          {etape === 'CODE' && (
            <motion.form
              key="code"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              onSubmit={soumettreCode}
              className="space-y-4"
            >
              {/* Choix de la méthode de vérification */}
              <div className="flex gap-2">
                <MethodeBtn active={methode === 'AUTH'} icon={Smartphone} label="Application" onClick={choisirAuth} />
                <MethodeBtn active={methode === 'EMAIL'} icon={Mail} label="Par e-mail" onClick={() => { setErreur(''); setMethode('EMAIL'); }} />
              </div>

              {methode === '' && (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Choisissez comment recevoir votre code de vérification.
                </p>
              )}

              {/* Méthode application : QR (si 1re fois) */}
              {methode === 'AUTH' && qrCode && (
                <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 dark:bg-white/5 p-4">
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                    Scannez ce QR Code avec Google Authenticator
                  </p>
                  <img src={qrCode} alt="QR Code 2FA" className="h-40 w-40 rounded-xl shadow-soft" />
                </div>
              )}

              {/* Méthode e-mail : envoi du code */}
              {methode === 'EMAIL' && !emailEnvoye && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Un code à 6 chiffres sera envoyé à <strong>{email}</strong>.
                  </p>
                  <Button type="button" onClick={envoyerEmail} loading={chargement} icon={Send} className="w-full">
                    Envoyer le code par e-mail
                  </Button>
                </div>
              )}
              {methode === 'EMAIL' && emailEnvoye && (
                <p className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400">
                  Code envoyé à {email}. Consultez votre boîte mail (et les spams).
                </p>
              )}

              {/* Saisie du code (application, ou e-mail une fois envoyé) */}
              {(methode === 'AUTH' || (methode === 'EMAIL' && emailEnvoye)) && (
                <>
                  <div className="relative">
                    <ShieldCheck size={16} className="absolute left-3.5 top-[42px] text-slate-400" />
                    <Input
                      label="Code à 6 chiffres"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className="pl-10 tracking-[0.3em] text-center font-semibold"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" loading={chargement} className="w-full" icon={ArrowRight}>
                    Valider le code
                  </Button>
                </>
              )}

              <button
                type="button"
                onClick={() => setEtape('EMAIL')}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-brand-500 mx-auto"
              >
                <ArrowLeft size={14} /> Retour
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
            Créer un compte
          </Link>
        </p>
      </Card>
      <BulleWhatsApp />
    </div>
  );
}

function messageErreur(err, parDefaut) {
  return err.response?.data?.message || err.response?.data?.error || parDefaut;
}

function MethodeBtn({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-brand-500 bg-brand-500 text-white shadow-glow'
          : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-brand-400 hover:text-brand-500'
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

// Fond abstrait technologique orange (lignes/points en dégradé, pur CSS/SVG).
function FondAbstrait() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-login" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-login)" />
      </svg>
    </div>
  );
}
