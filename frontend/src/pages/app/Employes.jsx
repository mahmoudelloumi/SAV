import { useEffect, useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import {
  getTousEmployes, creerEmploye, modifierEmploye, supprimerEmploye, activerDesactiverCompte,
} from '../../api/utilisateurService.js';
import Table from '../../components/ui/Table.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Input, Select } from '../../components/ui/Input.jsx';
import { SkeletonTable } from '../../components/ui/Skeleton.jsx';

const CHAMPS_VIDES = {
  nom: '', prenom: '', email: '', motDePasse: '', telephone: '',
  adresse: '', codeEmploye: '', specialite: '', role: 'EMPLOYE_SAV',
};

export default function Employes() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], number: 0, totalPages: 0, totalElements: 0 });
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', employe }
  const [confirmSuppression, setConfirmSuppression] = useState(null);

  async function charger() {
    setChargement(true);
    try {
      const res = await getTousEmployes(page, 10);
      setData(res.data);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); }, [page]);

  async function toggleActif(employe) {
    await activerDesactiverCompte(employe.id, !employe.actif);
    charger();
  }

  async function handleSuppression() {
    await supprimerEmploye(confirmSuppression.id);
    setConfirmSuppression(null);
    charger();
  }

  const filtres = data.content.filter((e) =>
    !recherche ||
    `${e.nom} ${e.prenom}`.toLowerCase().includes(recherche.toLowerCase()) ||
    e.codeEmploye?.toLowerCase().includes(recherche.toLowerCase())
  );

  const colonnes = [
    { key: 'code', label: 'Code', render: (r) => <span className="font-semibold text-slate-800 dark:text-slate-100">{r.codeEmploye}</span> },
    { key: 'nom', label: 'Nom', render: (r) => `${r.prenom} ${r.nom}` },
    { key: 'email', label: 'Email' },
    { key: 'specialite', label: 'Spécialité', render: (r) => r.specialite || '—' },
    { key: 'role', label: 'Rôle', render: (r) => <Badge>{r.role === 'DIRECTEUR' ? 'Directeur' : 'Employé SAV'}</Badge> },
    { key: 'actif', label: 'Statut', render: (r) => (
      <Badge color={r.actif ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400'}>
        {r.actif ? 'Actif' : 'Inactif'}
      </Badge>
    ) },
    { key: 'actions', label: '', render: (r) => (
      <div className="flex items-center justify-end gap-1.5">
        <Button size="sm" variant={r.actif ? 'outline' : 'primary'} className="min-w-[104px] justify-center" onClick={(e) => { e.stopPropagation(); toggleActif(r); }}>
          {r.actif ? 'Désactiver' : 'Activer'}
        </Button>
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
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Employés</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{data.totalElements} employé(s)</p>
        </div>
        <Button icon={Plus} onClick={() => setModal({ mode: 'create', employe: CHAMPS_VIDES })}>
          Nouvel employé
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un employé…"
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      {chargement ? (
        <SkeletonTable rows={6} />
      ) : (
        <Table
          columns={colonnes}
          data={filtres}
          pageInfo={data}
          onPageChange={setPage}
          onRowClick={(r) => setModal({ mode: 'edit', employe: r })}
          emptyMessage="Aucun employé ne correspond à cette recherche."
        />
      )}

      {modal && (
        <EmployeFormModal
          mode={modal.mode}
          employeInitial={modal.employe}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); charger(); }}
          onSupprimer={(emp) => { setModal(null); setConfirmSuppression(emp); }}
        />
      )}

      <Modal open={!!confirmSuppression} onClose={() => setConfirmSuppression(null)} title="Confirmer la suppression">
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Supprimer définitivement l'employé <strong>{confirmSuppression?.prenom} {confirmSuppression?.nom}</strong> ?
          Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmSuppression(null)}>Annuler</Button>
          <Button variant="danger" onClick={handleSuppression}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}

function EmployeFormModal({ mode, employeInitial, onClose, onSaved, onSupprimer }) {
  const [form, setForm] = useState(employeInitial);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const estEdition = mode === 'edit';
  // En création : édition immédiate. En consultation : lecture seule jusqu'à "Modifier".
  const [edition, setEdition] = useState(!estEdition);
  const lecture = estEdition && !edition;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      if (estEdition) {
        await modifierEmploye(employeInitial.id, form);
      } else {
        await creerEmploye(form);
      }
      onSaved();
    } catch (err) {
      const data = err.response?.data;
      setErreur(data?.message || (data?.details && Object.values(data.details).join(' — ')) || 'Échec de l\'enregistrement.');
    } finally {
      setChargement(false);
    }
  }

  const titre = estEdition ? (edition ? "Modifier l'employé" : "Détails de l'employé") : 'Nouvel employé';

  return (
    <Modal open onClose={onClose} title={titre} maxWidth="max-w-2xl">
      {erreur && (
        <div className="mb-3 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          {erreur}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nom *" name="nom" value={form.nom} onChange={handleChange} required disabled={lecture} />
          <Input label="Prénom *" name="prenom" value={form.prenom} onChange={handleChange} required disabled={lecture} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Email *" type="email" name="email" value={form.email} onChange={handleChange} required disabled={estEdition} />
          {estEdition ? (
            edition && (
              <Input
                label="Nouveau mot de passe"
                type="password"
                name="motDePasse"
                value={form.motDePasse}
                onChange={handleChange}
                hint="Laissez vide pour ne pas le changer."
              />
            )
          ) : (
            <Input
              label="Mot de passe *"
              type="password"
              name="motDePasse"
              value={form.motDePasse}
              onChange={handleChange}
              required
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Téléphone" name="telephone" value={form.telephone} onChange={handleChange} disabled={lecture} />
          {estEdition ? (
            <Input label="Code employé" name="codeEmploye" value={form.codeEmploye} disabled />
          ) : (
            <Input label="Code employé" value="Généré automatiquement" disabled hint="Attribué à la création (EMP-AAAA-NNN)." />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Spécialité" name="specialite" value={form.specialite} onChange={handleChange} disabled={lecture} />
          <Select label="Rôle *" name="role" value={form.role} onChange={handleChange} disabled={estEdition}>
            <option value="EMPLOYE_SAV">Employé SAV</option>
            <option value="DIRECTEUR">Directeur</option>
          </Select>
        </div>
        <Input label="Adresse" name="adresse" value={form.adresse} onChange={handleChange} disabled={lecture} />

        {!estEdition ? (
          <Button type="submit" loading={chargement} className="w-full">Créer l'employé</Button>
        ) : (
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => onSupprimer(employeInitial)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={15} /> Supprimer
            </button>
            <div className="flex gap-2">
              {!edition ? (
                <button
                  type="button"
                  onClick={() => setEdition(true)}
                  className="inline-flex items-center rounded-xl border border-brand-500 bg-white dark:bg-transparent px-4 py-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                >
                  Modifier
                </button>
              ) : (
                <>
                  <Button type="button" variant="ghost" onClick={() => { setForm(employeInitial); setEdition(false); setErreur(''); }}>
                    Annuler
                  </Button>
                  <Button type="submit" loading={chargement}>Enregistrer</Button>
                </>
              )}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
