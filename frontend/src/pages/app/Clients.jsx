import { useEffect, useState } from 'react';
import { Search, FileText, Trash2, Plus } from 'lucide-react';
import { getTousClients, activerDesactiverCompte, getClientDocument, modifierClient, supprimerClient } from '../../api/utilisateurService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SkeletonTable } from '../../components/ui/Skeleton.jsx';
import Button from '../../components/ui/Button.jsx';
import CreerClientModal from '../../components/clients/CreerClientModal.jsx';

export default function Clients() {
  const { user } = useAuth();
  // Seul le directeur peut activer/désactiver et modifier ; l'employé consulte en lecture seule.
  const peutGerer = user.role === 'DIRECTEUR';
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], number: 0, totalPages: 0, totalElements: 0 });
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [selection, setSelection] = useState(null);
  const [confirmSuppression, setConfirmSuppression] = useState(null);
  const [modalCreation, setModalCreation] = useState(false);

  async function charger() {
    setChargement(true);
    try {
      const res = await getTousClients(page, 10);
      setData(res.data);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); }, [page]);

  async function toggleActif(client) {
    await activerDesactiverCompte(client.id, !client.actif);
    charger();
  }

  async function handleSuppression() {
    await supprimerClient(confirmSuppression.id);
    setConfirmSuppression(null);
    charger();
  }

  async function voirDocument(client) {
    try {
      const res = await getClientDocument(client.id);
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      alert("Impossible d'ouvrir le document de ce client.");
    }
  }

  const filtres = data.content.filter((c) => {
    const q = recherche.toLowerCase();
    return (
      !recherche ||
      c.raisonSociale?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      `${c.prenom || ''} ${c.nom || ''}`.toLowerCase().includes(q)
    );
  });

  const colonnes = [
    { key: 'raisonSociale', label: 'Société', render: (r) => <span className="font-semibold text-slate-800 dark:text-slate-100">{r.raisonSociale}</span> },
    { key: 'contact', label: 'Contact', render: (r) => `${r.prenom} ${r.nom}` },
    { key: 'email', label: 'Email' },
    { key: 'telephone', label: 'Téléphone', render: (r) => r.telephone || '—' },
    { key: 'actif', label: 'Statut', render: (r) => (
      <Badge color={r.actif ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400'}>
        {r.actif ? 'Actif' : 'Inactif'}
      </Badge>
    ) },
    { key: 'actions', label: '', render: (r) => (
      <div className="flex items-center justify-end gap-2">
        {r.documentMatriculeNom && (
          <Button size="sm" variant="ghost" icon={FileText} onClick={(e) => { e.stopPropagation(); voirDocument(r); }}>
            Document
          </Button>
        )}
        {peutGerer && (
          <Button size="sm" variant={r.actif ? 'outline' : 'primary'} onClick={(e) => { e.stopPropagation(); toggleActif(r); }}>
            {r.actif ? 'Désactiver' : 'Activer'}
          </Button>
        )}
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Clients</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{data.totalElements} client(s) enregistré(s)</p>
        </div>
        {/* Directeur et employé peuvent ajouter un client. */}
        <Button icon={Plus} onClick={() => setModalCreation(true)}>Nouveau client</Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par société, contact ou email…"
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
          onRowClick={setSelection}
          emptyMessage="Aucun client ne correspond à cette recherche."
        />
      )}

      {selection && (
        <ClientDetailModal
          client={selection}
          canEdit={peutGerer}
          onClose={() => setSelection(null)}
          onSaved={() => { setSelection(null); charger(); }}
          onVoirDocument={voirDocument}
          onSupprimer={(c) => { setSelection(null); setConfirmSuppression(c); }}
        />
      )}

      <CreerClientModal
        open={modalCreation}
        onClose={() => setModalCreation(false)}
        onCree={() => { setPage(0); charger(); }}
      />

      <Modal open={!!confirmSuppression} onClose={() => setConfirmSuppression(null)} title="Confirmer la suppression">
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Supprimer définitivement le client <strong>{confirmSuppression?.raisonSociale}</strong> ?
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

// Détail d'un client (mêmes champs que l'inscription). Modifiable par le directeur,
// en lecture seule pour l'employé.
function ClientDetailModal({ client, canEdit, onClose, onSaved, onVoirDocument, onSupprimer }) {
  const [form, setForm] = useState(client);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [edition, setEdition] = useState(false);

  const lecture = !canEdit || !edition;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      await modifierClient(client.id, form);
      onSaved();
    } catch (err) {
      const data = err.response?.data;
      setErreur(data?.message || (data?.details && Object.values(data.details).join(' — ')) || "Échec de l'enregistrement.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={client.raisonSociale || 'Client'} maxWidth="max-w-2xl">
      {erreur && (
        <div className="mb-3 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          {erreur}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-500">Identité</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom" name="nom" value={form.nom || ''} onChange={handleChange} disabled={lecture} />
            <Input label="Prénom" name="prenom" value={form.prenom || ''} onChange={handleChange} disabled={lecture} />
            <Input label="Email" name="email" value={form.email || ''} disabled />
            <Input label="Téléphone" name="telephone" value={form.telephone || ''} onChange={handleChange} disabled={lecture} />
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-500">Entreprise</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Raison sociale" name="raisonSociale" value={form.raisonSociale || ''} onChange={handleChange} disabled={lecture} />
            <Input label="Adresse" name="adresse" value={form.adresse || ''} onChange={handleChange} disabled={lecture} />
            <Input label="Matricule fiscal" name="matriculeFiscal" value={form.matriculeFiscal || ''} disabled />
            <Input label="RNE" name="rne" value={form.rne || ''} onChange={handleChange} disabled={lecture} />
          </div>
        </section>

        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-white/10">
          {client.documentMatriculeNom && (
            <Button type="button" size="sm" variant="ghost" icon={FileText} onClick={() => onVoirDocument(client)}>
              Voir le document
            </Button>
          )}
          {/* Suppression réservée au directeur, uniquement pour un client inactif. */}
          {canEdit && !client.actif && (
            <button
              type="button"
              onClick={() => onSupprimer(client)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={15} /> Supprimer
            </button>
          )}
          <div className="ml-auto flex gap-2">
            {canEdit && !edition && (
              <button
                type="button"
                onClick={() => setEdition(true)}
                className="inline-flex items-center rounded-xl border border-brand-500 bg-white dark:bg-transparent px-4 py-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
              >
                Modifier
              </button>
            )}
            {canEdit && edition && (
              <>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setForm(client); setEdition(false); setErreur(''); }}>
                  Annuler
                </Button>
                <Button type="submit" size="sm" loading={chargement}>Enregistrer</Button>
              </>
            )}
          </div>
        </div>

        {!canEdit && (
          <p className="text-xs text-slate-400">Consultation seule — seul le directeur peut modifier un client.</p>
        )}
      </form>
    </Modal>
  );
}
