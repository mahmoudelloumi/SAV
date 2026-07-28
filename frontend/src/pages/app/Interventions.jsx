import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useInterventions } from '../../hooks/useInterventions.js';
import { getInterventionsParEtat, getInterventionById } from '../../api/interventionService.js';
import Button from '../../components/ui/Button.jsx';
import { SkeletonTable } from '../../components/ui/Skeleton.jsx';
import InterventionFilters from '../../components/interventions/InterventionFilters.jsx';
import InterventionsTable from '../../components/interventions/InterventionsTable.jsx';
import InterventionDetailModal from '../../components/interventions/InterventionDetailModal.jsx';
import CreerInterventionModal from '../../components/interventions/CreerInterventionModal.jsx';
import CreerInterventionStaffModal from '../../components/interventions/CreerInterventionStaffModal.jsx';

// Correspondance entre l'option de tri (UI) et le paramètre `sort` de Spring Data,
// pour trier côté serveur sur l'ENSEMBLE des interventions (toutes les pages).
const TRI_VERS_SORT = {
  DATE_DESC: 'dateCreation,desc',
  DATE_ASC: 'dateCreation,asc',
};

export default function Interventions() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [tri, setTri] = useState('DATE_DESC');
  const sortParam = TRI_VERS_SORT[tri] || 'dateCreation,desc';

  const [recherche, setRecherche] = useState(searchParams.get('q') || '');
  const [filtreEtat, setFiltreEtat] = useState('');
  const [filtrePriorite, setFiltrePriorite] = useState('');
  const [selection, setSelection] = useState(null);
  const [modalCreation, setModalCreation] = useState(false);
  const [modalStaff, setModalStaff] = useState(false);
  const estStaff = user.role === 'EMPLOYE_SAV' || user.role === 'DIRECTEUR';

  // Recherche/filtres = filtrage côté client : on charge alors TOUTES les interventions
  // (grande page) pour que la recherche porte sur l'ensemble, pas seulement la page 10.
  const filtresActifs = !!(recherche || filtreEtat || filtrePriorite);
  const size = filtresActifs ? 1000 : 50;

  const { content, chargement, erreur, number, totalPages, totalElements, recharger } =
    useInterventions(user, { page, size, sort: sortParam });

  // Synchronise la recherche avec l'URL (barre de recherche du Topbar), même si on
  // est déjà sur la page Interventions.
  useEffect(() => {
    setRecherche(searchParams.get('q') || '');
    setFiltreEtat(searchParams.get('etat') || '');
  }, [searchParams]);

  // Revient à la 1re page dès qu'un filtre/recherche change (évite de rester sur une
  // page vide).
  useEffect(() => {
    setPage(0);
  }, [recherche, filtreEtat, filtrePriorite]);

  // Change le tri et revient à la première page (le nouvel ordre concerne tout).
  function changerTri(nouveauTri) {
    setTri(nouveauTri);
    setPage(0);
  }

  // Pour un employé : le "pool" des nouvelles interventions non encore prises
  // (auto-affectation). On le fusionne avec ses propres interventions.
  const [pool, setPool] = useState([]);
  const estEmploye = user.role === 'EMPLOYE_SAV';

  const chargerPool = useMemo(
    () => async () => {
      if (!estEmploye) return;
      try {
        const { data } = await getInterventionsParEtat('NOUVELLE', 0, 50, sortParam);
        setPool(data.content);
      } catch {
        setPool([]);
      }
    },
    [estEmploye, sortParam]
  );

  useEffect(() => {
    chargerPool();
  }, [chargerPool]);

  // Fusion own + pool (dédup par id), le pool en premier.
  const toutes = useMemo(() => {
    if (!estEmploye) return content;
    const ids = new Set(content.map((i) => i.id));
    return [...pool.filter((p) => !ids.has(p.id)), ...content];
  }, [estEmploye, content, pool]);

  const donneesFiltrees = useMemo(() => {
    const filtrees = toutes.filter((it) => {
      const q = recherche.toLowerCase();
      const matchRecherche =
        !recherche ||
        it.code.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        (it.clientRaisonSociale || '').toLowerCase().includes(q) ||
        (it.clientNom || '').toLowerCase().includes(q);
      const matchEtat = !filtreEtat || it.etat === filtreEtat;
      const matchPriorite = !filtrePriorite || it.priorite === filtrePriorite;
      return matchRecherche && matchEtat && matchPriorite;
    });

    // Le serveur trie déjà par date sur toutes les pages ; on réapplique le même
    // tri ici pour garder un ordre cohérent après la fusion own + pool (employé).
    const parDate = (a, b) => new Date(a.dateCreation) - new Date(b.dateCreation);
    return [...filtrees].sort((a, b) => (tri === 'DATE_ASC' ? parDate(a, b) : parDate(b, a)));
  }, [toutes, recherche, filtreEtat, filtrePriorite, tri]);

  async function handleUpdated() {
    recharger();
    chargerPool();
    // Recharge l'intervention sélectionnée depuis le serveur pour refléter
    // immédiatement son nouvel état/prix dans la modale ouverte.
    if (selection) {
      try {
        const { data } = await getInterventionById(selection.id);
        setSelection(data);
      } catch {
        // silencieux : on garde l'ancienne sélection si le rechargement échoue
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Interventions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{totalElements} intervention(s) au total</p>
        </div>
        {user.role === 'CLIENT' && (
          <Button icon={Plus} onClick={() => setModalCreation(true)}>Nouvelle demande</Button>
        )}
        {estStaff && (
          <Button icon={Plus} onClick={() => setModalStaff(true)}>Nouvelle intervention</Button>
        )}
      </div>

      <InterventionFilters
        recherche={recherche}
        onRechercheChange={setRecherche}
        etat={filtreEtat}
        onEtatChange={setFiltreEtat}
        priorite={filtrePriorite}
        onPrioriteChange={setFiltrePriorite}
        tri={tri}
        onTriChange={changerTri}
      />

      {erreur && (
        <div className="rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          {erreur}
        </div>
      )}

      {chargement ? (
        <SkeletonTable rows={6} />
      ) : (
        <InterventionsTable
          data={donneesFiltrees}
          pageInfo={{ number, totalPages, totalElements }}
          onPageChange={setPage}
          role={user.role}
          onVoir={setSelection}
        />
      )}

      <InterventionDetailModal
        intervention={selection}
        role={user.role}
        open={!!selection}
        onClose={() => setSelection(null)}
        onUpdated={handleUpdated}
      />

      <CreerInterventionModal
        open={modalCreation}
        onClose={() => setModalCreation(false)}
        onCree={recharger}
      />

      <CreerInterventionStaffModal
        open={modalStaff}
        onClose={() => setModalStaff(false)}
        onCree={recharger}
      />
    </div>
  );
}
