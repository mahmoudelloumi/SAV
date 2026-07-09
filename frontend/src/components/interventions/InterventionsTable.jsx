import Table from '../ui/Table.jsx';
import { StatutBadge, PrioriteBadge } from '../ui/Badge.jsx';

// Table d'interventions avec colonnes adaptées au rôle de l'utilisateur.
// (Un clic sur la ligne ouvre le détail — pas de colonne d'action dédiée.)
export default function InterventionsTable({ data, pageInfo, onPageChange, role, onVoir }) {
  const colonnes = [
    { key: 'code', label: 'Code', render: (r) => <span className="font-semibold text-slate-800 dark:text-slate-100">{r.code}</span> },
    role !== 'CLIENT' && { key: 'client', label: 'Client', render: (r) => r.clientRaisonSociale || r.clientNom },
    { key: 'description', label: 'Description', render: (r) => <span className="line-clamp-1 max-w-xs block">{r.description}</span> },
    role !== 'EMPLOYE_SAV' && { key: 'employe', label: 'Employé', render: (r) => r.employeAffecteNom || '—' },
    { key: 'priorite', label: 'Priorité', render: (r) => <PrioriteBadge priorite={r.priorite} /> },
    { key: 'etat', label: 'État', render: (r) => (
      <div className="flex flex-wrap items-center gap-1.5">
        <StatutBadge etat={r.etat} />
        {r.confirmee === false && (
          <span className="rounded-full bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            À confirmer
          </span>
        )}
      </div>
    ) },
    { key: 'date', label: 'Créée le', render: (r) => formatDate(r.dateCreation) },
  ].filter(Boolean);

  return (
    <Table
      columns={colonnes}
      data={data}
      pageInfo={pageInfo}
      onPageChange={onPageChange}
      onRowClick={onVoir}
      emptyMessage="Aucune intervention ne correspond à ces critères."
    />
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
