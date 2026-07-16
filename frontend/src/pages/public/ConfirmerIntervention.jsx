import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { confirmerIntervention } from '../../api/interventionService.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import ThemeToggle from '../../components/ui/ThemeToggle.jsx';
import BulleWhatsApp from '../../components/ui/BulleWhatsApp.jsx';
import logo from '../../assets/logo_idsoft.png';

// ============================================================
// Page publique : le client confirme une intervention créée pour lui
// par le SAV, avec le code d'intervention + le code de confirmation
// reçus par e-mail.
// ============================================================

export default function ConfirmerIntervention() {
  const [params] = useSearchParams();
  const [codeIntervention, setCodeIntervention] = useState(params.get('code') || '');
  const [codeConfirmation, setCodeConfirmation] = useState('');
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      await confirmerIntervention(codeIntervention.trim(), codeConfirmation.trim());
      setSucces(true);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Confirmation impossible. Vérifiez vos codes.');
    } finally {
      setChargement(false);
    }
  }

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
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Intervention confirmée !</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Merci. Votre intervention est désormais prise en compte par notre service SAV.
          </p>
        </Card>
      ) : (
        <Card className="w-full max-w-md p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/15 text-brand-500">
              <ClipboardCheck size={24} />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Confirmer l’intervention</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Saisissez les codes reçus par e-mail pour accepter l’intervention.
            </p>
          </div>

          {erreur && (
            <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
              {erreur}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Code de l’intervention"
              placeholder="SAV-2026-000123"
              value={codeIntervention}
              onChange={(e) => setCodeIntervention(e.target.value)}
              required
            />
            <div className="relative">
              <ShieldCheck size={16} className="absolute left-3.5 top-[42px] text-slate-400" />
              <Input
                label="Code de confirmation"
                className="pl-10 tracking-[0.3em]"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={codeConfirmation}
                onChange={(e) => setCodeConfirmation(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
            <Button type="submit" loading={chargement} icon={CheckCircle2} className="w-full">
              Confirmer l’intervention
            </Button>
          </form>
        </Card>
      )}
      <BulleWhatsApp />
    </div>
  );
}
