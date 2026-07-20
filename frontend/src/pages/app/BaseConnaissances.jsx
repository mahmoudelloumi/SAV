import { useEffect, useState } from 'react';
import { Plus, Trash2, Search, BookOpen } from 'lucide-react';
import {
  getToutesConnaissances, creerConnaissance, modifierConnaissance, supprimerConnaissance,
} from '../../api/baseConnaissanceService.js';
import Table from '../../components/ui/Table.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Input, Textarea, Select } from '../../components/ui/Input.jsx';
import { SkeletonTable } from '../../components/ui/Skeleton.jsx';

const CATEGORIES = {
  ENTREPRISE: 'Infos entreprise',
  PROBLEME: 'Problème / solution',
  PRODUIT: 'Produit / service',
};

const COULEURS_CAT = {
  ENTREPRISE: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  PROBLEME: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  PRODUIT: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
};

const CHAMPS_VIDES = { categorie: 'PROBLEME', titre: '', contenu: '', motsCles: '', actif: true };

export default function BaseConnaissances() {
  const [data, setData] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [modal, setModal] = useState(null); // { mode, entree }
  const [confirmSuppression, setConfirmSuppression] = useState(null);

  async function charger() {
    setChargement(true);
    try {
      const res = await getToutesConnaissances();
      setData(res.data);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); }, []);

  async function handleSuppression() {
    await supprimerConnaissance(confirmSuppression.id);
    setConfirmSuppression(null);
    charger();
  }

  const filtres = data.filter((e) =>
    !recherche ||
    e.titre?.toLowerCase().includes(recherche.toLowerCase()) ||
    e.contenu?.toLowerCase().includes(recherche.toLowerCase()) ||
    e.motsCles?.toLowerCase().includes(recherche.toLowerCase())
  );

  const colonnes = [
    { key: 'categorie', label: 'Catégorie', render: (r) => (
      <Badge color={COULEURS_CAT[r.categorie]}>{CATEGORIES[r.categorie] || r.categorie}</Badge>
    ) },
    { key: 'titre', label: 'Titre', render: (r) => <span className="font-semibold text-slate-800 dark:text-slate-100">{r.titre}</span> },
    { key: 'contenu', label: 'Contenu', render: (r) => <span className="line-clamp-1 max-w-md block text-slate-500 dark:text-slate-400">{r.contenu}</span> },
    { key: 'actif', label: 'Statut', render: (r) => (
      <Badge color={r.actif ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400'}>
        {r.actif ? 'Actif' : 'Inactif'}
      </Badge>
    ) },
    { key: 'actions', label: '', render: (r) => (
      <div className="flex items-center justify-end gap-1.5">
        <button onClick={(e) => { e.stopPropagation(); setConfirmSuppression(r); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-white/10">
          <Trash2 size={15} />
        </button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen size={22} className="text-brand-500" /> Base de connaissances
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Le chatbot utilise ces informations pour répondre correctement aux clients.
          </p>
        </div>
        <Button icon={Plus} onClick={() => setModal({ mode: 'create', entree: CHAMPS_VIDES })}>
          Nouvelle entrée
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher…"
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      {chargement ? (
        <SkeletonTable rows={6} />
      ) : (
        <Table
          columns={colonnes}
          data={filtres}
          onRowClick={(r) => setModal({ mode: 'edit', entree: r })}
          emptyMessage="Aucune entrée. Ajoutez des infos entreprise, des problèmes connus et des produits."
        />
      )}

      {modal && (
        <ConnaissanceFormModal
          mode={modal.mode}
          initial={modal.entree}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); charger(); }}
          onSupprimer={(e) => { setModal(null); setConfirmSuppression(e); }}
        />
      )}

      <Modal open={!!confirmSuppression} onClose={() => setConfirmSuppression(null)} title="Confirmer la suppression">
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Supprimer définitivement l'entrée <strong>{confirmSuppression?.titre}</strong> ?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmSuppression(null)}>Annuler</Button>
          <Button variant="danger" onClick={handleSuppression}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}

function ConnaissanceFormModal({ mode, initial, onClose, onSaved, onSupprimer }) {
  const [form, setForm] = useState(initial);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const estEdition = mode === 'edit';

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      if (estEdition) await modifierConnaissance(initial.id, form);
      else await creerConnaissance(form);
      onSaved();
    } catch (err) {
      const d = err.response?.data;
      setErreur(d?.message || (d?.details && Object.values(d.details).join(' — ')) || "Échec de l'enregistrement.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={estEdition ? "Modifier l'entrée" : 'Nouvelle entrée'} maxWidth="max-w-2xl">
      {erreur && (
        <div className="mb-3 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          {erreur}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Catégorie *" name="categorie" value={form.categorie} onChange={handleChange}>
            {Object.entries(CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" name="actif" checked={form.actif} onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 dark:border-white/20 text-brand-500 focus:ring-brand-500/30" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Actif (utilisé par le chatbot)</span>
            </label>
          </div>
        </div>
        <Input label="Titre *" name="titre" value={form.titre} onChange={handleChange}
          placeholder="ex : L'imprimante ne s'allume pas" required />
        <Textarea label="Contenu *" name="contenu" value={form.contenu} onChange={handleChange} rows={6}
          placeholder="Réponse / solution détaillée que le chatbot doit donner…" required />
        <Input label="Mots-clés (facultatif)" name="motsCles" value={form.motsCles || ''} onChange={handleChange}
          placeholder="ex : imprimante, allumage, alimentation" hint="Séparés par des virgules" />

        {!estEdition ? (
          <Button type="submit" loading={chargement} className="w-full">Créer l'entrée</Button>
        ) : (
          <div className="flex items-center justify-between gap-2 pt-1">
            <button type="button" onClick={() => onSupprimer(initial)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors">
              <Trash2 size={15} /> Supprimer
            </button>
            <Button type="submit" loading={chargement}>Enregistrer</Button>
          </div>
        )}
      </form>
    </Modal>
  );
}
