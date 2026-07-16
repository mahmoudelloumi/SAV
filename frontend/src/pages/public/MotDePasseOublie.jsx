import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Mail, ShieldCheck, KeyRound, CheckCircle2, Smartphone, Send } from 'lucide-react';
import { reinitialiserMotDePasse, verifierCodeReinitialisation, envoyerCodeEmail2fa } from '../../api/authService.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, PasswordInput } from '../../components/ui/Input.jsx';
import ThemeToggle from '../../components/ui/ThemeToggle.jsx';
import BulleWhatsApp from '../../components/ui/BulleWhatsApp.jsx';
import logo from '../../assets/logo_idsoft.png';

// ============================================================
// Réinitialisation du mot de passe en 3 étapes :
//   1. Email  →  2. Code Google Authenticator  →  3. Nouveau mot de passe
// La vérification finale (email + code + mot de passe) se fait à l'étape 3.
// ============================================================

const ETAPES = ['EMAIL', 'CODE', 'MOTDEPASSE'];

export default function MotDePasseOublie() {
  const [etape, setEtape] = useState('EMAIL');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);
  // Méthode de vérification : 'AUTH' (Google Authenticator) ou 'EMAIL' (code par e-mail)
  const [methode, setMethode] = useState('AUTH');
  const [emailEnvoye, setEmailEnvoye] = useState(false);
  const navigate = useNavigate();

  const indexEtape = ETAPES.indexOf(etape);

  function retour() {
    setErreur('');
    if (etape === 'EMAIL') navigate('/login');
    else setEtape(ETAPES[indexEtape - 1]);
  }

  function etapeEmail(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setErreur('');
    setMethode('AUTH');
    setEmailEnvoye(false);
    setCode('');
    setEtape('CODE');
  }

  // Méthode e-mail : envoie un code à l'adresse du compte.
  async function envoyerEmail() {
    setErreur('');
    setChargement(true);
    try {
      await envoyerCodeEmail2fa(email);
      setEmailEnvoye(true);
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible d'envoyer le code par e-mail.");
    } finally {
      setChargement(false);
    }
  }

  async function etapeCode(e) {
    e.preventDefault();
    if (code.length < 6) { setErreur('Le code doit comporter 6 chiffres.'); return; }
    setErreur('');
    setChargement(true);
    try {
      // Vérifie réellement le code auprès du backend avant de continuer.
      await verifierCodeReinitialisation(email, code);
      setEtape('MOTDEPASSE');
    } catch (err) {
      setErreur(err.response?.data?.message || 'Le code est invalide ou expiré.');
    } finally {
      setChargement(false);
    }
  }

  async function etapeMotDePasse(e) {
    e.preventDefault();
    setErreur('');
    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setChargement(true);
    try {
      await reinitialiserMotDePasse(email, code, motDePasse);
      setSucces(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Réinitialisation impossible. Vérifiez le code et réessayez.');
    } finally {
      setChargement(false);
    }
  }

  const sousTitre = {
    EMAIL: 'Saisissez l’email de votre compte pour commencer.',
    CODE: 'Entrez le code à 6 chiffres de votre application Google Authenticator.',
    MOTDEPASSE: 'Choisissez votre nouveau mot de passe.',
  }[etape];

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-light-bg dark:bg-dark-bg">
      <div className="absolute top-6 right-6"><ThemeToggle /></div>
      <Link to="/" className="absolute top-6 left-6">
        <img src={logo} alt="ID SOFT" className="h-9 w-auto drop-shadow-[0_0_10px_rgba(255,122,0,0.35)]" />
      </Link>

      {succes ? (
        <Card className="w-full max-w-md p-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-500"
          >
            <CheckCircle2 size={32} />
          </motion.div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Mot de passe réinitialisé !</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Redirection vers la connexion…</p>
        </Card>
      ) : (
        <Card className="relative w-full max-w-md p-8">
          {/* Bouton retour (présent sur chaque étape) */}
          <button
            type="button"
            onClick={retour}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-500 transition-colors mb-4"
          >
            <ArrowLeft size={16} /> Retour
          </button>

          {/* Indicateur d'étapes */}
          <div className="flex items-center justify-center gap-2 mb-5">
            {ETAPES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i <= indexEtape ? 'w-6 bg-brand-500' : 'w-3 bg-slate-200 dark:bg-white/10'}`}
              />
            ))}
          </div>

          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Mot de passe oublié</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{sousTitre}</p>
          </div>

          {erreur && (
            <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
              {erreur}
            </div>
          )}

          <AnimatePresence mode="wait">
            {etape === 'EMAIL' && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={etapeEmail}
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
                <Button type="submit" icon={ArrowRight} className="w-full">Envoyer</Button>
              </motion.form>
            )}

            {etape === 'CODE' && (
              <motion.form
                key="code"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={etapeCode}
                className="space-y-4"
              >
                {/* Choix de la méthode de vérification */}
                <div className="flex gap-2">
                  <MethodeBtn active={methode === 'AUTH'} icon={Smartphone} label="Application" onClick={() => { setErreur(''); setMethode('AUTH'); }} />
                  <MethodeBtn active={methode === 'EMAIL'} icon={Mail} label="Par e-mail" onClick={() => { setErreur(''); setMethode('EMAIL'); }} />
                </div>

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

                {(methode === 'AUTH' || (methode === 'EMAIL' && emailEnvoye)) && (
                  <>
                    <div className="relative">
                      <ShieldCheck size={16} className="absolute left-3.5 top-[42px] text-slate-400" />
                      <Input
                        label={methode === 'EMAIL' ? 'Code reçu par e-mail' : 'Code Google Authenticator'}
                        className="pl-10 tracking-[0.3em]"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="123456"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        required
                        autoFocus
                      />
                    </div>
                    <Button type="submit" loading={chargement} icon={ArrowRight} className="w-full">Continuer</Button>
                  </>
                )}
              </motion.form>
            )}

            {etape === 'MOTDEPASSE' && (
              <motion.form
                key="motdepasse"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={etapeMotDePasse}
                className="space-y-4"
              >
                <PasswordInput
                  label="Nouveau mot de passe"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  hint="Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial."
                  required
                  autoFocus
                />
                <PasswordInput
                  label="Confirmer le mot de passe"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  erreur={confirmation && confirmation !== motDePasse ? 'Les mots de passe ne correspondent pas.' : ''}
                  required
                />
                <Button type="submit" loading={chargement} icon={KeyRound} className="w-full">
                  Réinitialiser le mot de passe
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Vous vous souvenez ?{' '}
            <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              Se connecter
            </Link>
          </p>
        </Card>
      )}
      <BulleWhatsApp />
    </div>
  );
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
