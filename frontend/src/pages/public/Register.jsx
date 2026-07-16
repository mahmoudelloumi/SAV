import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, UserPlus, Upload, FileCheck2, Home } from 'lucide-react';
import { inscription } from '../../api/authService.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, PasswordInput } from '../../components/ui/Input.jsx';
import ThemeToggle from '../../components/ui/ThemeToggle.jsx';
import BulleWhatsApp from '../../components/ui/BulleWhatsApp.jsx';
import logo from '../../assets/logo_idsoft.png';

// ============================================================
// Page d'inscription d'un nouveau client. Logique métier identique
// à la version précédente (mêmes champs, même payload).
// ============================================================

const CHAMPS_INITIAUX = {
  nom: '', prenom: '', email: '', motDePasse: '', telephone: '',
  adresse: '', matriculeFiscal: '', rne: '', raisonSociale: '',
};

export default function Register() {
  const [form, setForm] = useState(CHAMPS_INITIAUX);
  const [confirmation, setConfirmation] = useState('');
  const [conditions, setConditions] = useState(false);
  const [document, setDocument] = useState(null);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    if (form.motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (!document) {
      setErreur('Veuillez joindre une photo ou un PDF de votre matricule fiscal.');
      return;
    }
    if (!conditions) {
      setErreur("Vous devez accepter les conditions d'utilisation.");
      return;
    }
    setChargement(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([cle, valeur]) => formData.append(cle, valeur));
      formData.append('document', document);
      await inscription(formData);
      setSucces(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.message ||
        (data?.details && Object.values(data.details).join(' — ')) ||
        "Échec de l'inscription. Vérifiez vos informations.";
      setErreur(msg);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 bg-light-bg dark:bg-dark-bg">
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
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Inscription réussie !</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Redirection vers la connexion…</p>
        </Card>
      ) : (
        <Card className="relative w-full max-w-2xl p-8">
          <Link
            to="/"
            aria-label="Retour à l'accueil"
            title="Accueil"
            className="absolute top-4 left-4 grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <Home size={18} />
          </Link>
          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Créer un compte client</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Rejoignez la plateforme ID SOFT pour suivre vos interventions SAV
            </p>
          </div>

          {erreur && (
            <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
              {erreur}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-500">Identité</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Nom *" name="nom" value={form.nom} onChange={handleChange} required />
                <Input label="Prénom *" name="prenom" value={form.prenom} onChange={handleChange} required />
                <Input label="Email *" type="email" name="email" value={form.email} onChange={handleChange} required />
                <Input label="Téléphone *" name="telephone" value={form.telephone} onChange={handleChange} placeholder="ex : 20 123 456" required />
              </div>
            </section>

            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-500">Sécurité</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <PasswordInput
                  label="Mot de passe *"
                  name="motDePasse"
                  value={form.motDePasse}
                  onChange={handleChange}
                  hint="Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial."
                  required
                />
                <PasswordInput
                  label="Confirmation du mot de passe *"
                  name="confirmation"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  erreur={confirmation && confirmation !== form.motDePasse ? 'Les mots de passe ne correspondent pas.' : ''}
                  required
                />
              </div>
            </section>

            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-500">Entreprise</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Raison sociale *" name="raisonSociale" value={form.raisonSociale} onChange={handleChange} required />
                <Input label="Adresse" name="adresse" value={form.adresse} onChange={handleChange} />
                <Input label="Matricule fiscal *" name="matriculeFiscal" value={form.matriculeFiscal} onChange={handleChange} placeholder="ex : 1234567/A/M/000" required />
                <Input label="RNE" name="rne" value={form.rne} onChange={handleChange} placeholder="ex : 0001234567" hint="Optionnel" />
              </div>
            </section>

            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-500">Justificatif</p>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                Photo ou PDF du matricule fiscal *
              </label>
              <label
                className={`flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 cursor-pointer transition-colors ${
                  document
                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                    : 'border-slate-300 dark:border-white/15 hover:border-brand-400'
                }`}
              >
                {document ? (
                  <FileCheck2 size={20} className="text-emerald-500 shrink-0" />
                ) : (
                  <Upload size={20} className="text-slate-400 shrink-0" />
                )}
                <span className="text-sm text-slate-600 dark:text-slate-300 truncate">
                  {document ? document.name : 'Cliquez pour joindre votre carte d\'identification fiscale'}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => setDocument(e.target.files[0] || null)}
                />
              </label>
              <p className="mt-1 text-xs text-slate-400">Formats acceptés : JPG, PNG, PDF — max 10 Mo.</p>
            </section>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={conditions}
                onChange={(e) => setConditions(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 dark:border-white/20 text-brand-500 focus:ring-brand-500/30"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                J'accepte les{' '}
                <a href="#" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  conditions d'utilisation
                </a>{' '}
                et la politique de confidentialité. *
              </span>
            </label>

            <Button type="submit" loading={chargement} icon={UserPlus} className="w-full" disabled={!conditions}>
              Créer mon compte
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Déjà un compte ?{' '}
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
