import { useState } from 'react';
import { UserPlus, Upload, FileCheck2 } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { creerClient } from '../../api/utilisateurService.js';

// ============================================================
// Création d'un client par le staff (directeur/employé) avec les mêmes
// coordonnées que le formulaire d'inscription. Le mot de passe n'est PAS
// saisi ici : le client le définira à sa première connexion (code e-mail).
// ============================================================

const CHAMPS_INITIAUX = {
  nom: '', prenom: '', email: '', telephone: '',
  raisonSociale: '', adresse: '', matriculeFiscal: '', rne: '',
};

export default function CreerClientModal({ open, onClose, onCree }) {
  const [form, setForm] = useState(CHAMPS_INITIAUX);
  const [document, setDocument] = useState(null);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function reset() {
    setForm(CHAMPS_INITIAUX);
    setDocument(null);
    setErreur('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    if (!form.raisonSociale.trim() || !form.email.trim()) {
      setErreur('La société et l\'email sont obligatoires.');
      return;
    }
    setChargement(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([cle, valeur]) => formData.append(cle, valeur));
      if (document) formData.append('document', document);
      await creerClient(formData);
      reset();
      onCree();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setErreur(
        data?.message
        || (data?.details && Object.values(data.details).join(' — '))
        || 'Création impossible. Vérifiez les informations.'
      );
    } finally {
      setChargement(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouveau client" maxWidth="max-w-2xl">
      {erreur && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          {erreur}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-500">Identité</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nom" name="nom" value={form.nom} onChange={handleChange} />
            <Input label="Prénom" name="prenom" value={form.prenom} onChange={handleChange} />
            <Input label="Email *" type="email" name="email" value={form.email} onChange={handleChange} required />
            <Input label="Téléphone" name="telephone" value={form.telephone} onChange={handleChange} placeholder="ex : 20 123 456" />
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-500">Entreprise</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Raison sociale *" name="raisonSociale" value={form.raisonSociale} onChange={handleChange} required />
            <Input label="Adresse" name="adresse" value={form.adresse} onChange={handleChange} />
            <Input label="Matricule fiscal" name="matriculeFiscal" value={form.matriculeFiscal} onChange={handleChange} placeholder="ex : 1234567/A/M/000" />
            <Input label="RNE" name="rne" value={form.rne} onChange={handleChange} placeholder="ex : 0001234567" hint="Optionnel" />
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-500">Justificatif (facultatif)</p>
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
              {document ? document.name : 'Joindre une photo ou un PDF du matricule fiscal'}
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

        <p className="rounded-xl bg-brand-50 dark:bg-brand-500/10 px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300">
          Le client définira son mot de passe à sa première connexion : il saisit son email,
          reçoit un code par e-mail, puis choisit son mot de passe.
        </p>

        <Button type="submit" loading={chargement} icon={UserPlus} className="w-full">
          Créer le client
        </Button>
      </form>
    </Modal>
  );
}
