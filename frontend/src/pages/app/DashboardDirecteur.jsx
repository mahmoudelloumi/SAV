import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, CheckCircle2, Wallet } from 'lucide-react';
import { getStatistiques } from '../../api/statistiquesService.js';
import { getToutesInterventions, getInterventionById } from '../../api/interventionService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import InterventionDetailModal from '../../components/interventions/InterventionDetailModal.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card.jsx';
import { SkeletonCard } from '../../components/ui/Skeleton.jsx';
import { StatutBadge } from '../../components/ui/Badge.jsx';
import EtatsBarChart from '../../components/charts/EtatsBarChart.jsx';
import PrioriteDonutChart from '../../components/charts/PrioriteDonutChart.jsx';
import CAAreaChart from '../../components/charts/CAAreaChart.jsx';
import EmployePerfChart from '../../components/charts/EmployePerfChart.jsx';
import EmployeCAChart from '../../components/charts/EmployeCAChart.jsx';
import CAEvolutionChart from '../../components/charts/CAEvolutionChart.jsx';

export default function DashboardDirecteur() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activiteRecente, setActiviteRecente] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [selection, setSelection] = useState(null);
  const [vueEvolution, setVueEvolution] = useState('jour'); // 'jour' par défaut
  const [vueCA, setVueCA] = useState('jour'); // évolution du chiffre d'affaires
  const navigate = useNavigate();
  const caEmployeRef = useRef(null);

  // Début du mois courant (ex. "1 juil. 2026") pour préciser la période du CA.
  const debutMois = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  async function handleUpdated() {
    if (selection) {
      try {
        const { data } = await getInterventionById(selection.id);
        setSelection(data);
      } catch { /* on garde la sélection courante */ }
    }
  }

  useEffect(() => {
    async function charger() {
      setChargement(true);
      try {
        const [statsRes, interventionsRes] = await Promise.all([
          getStatistiques(),
          getToutesInterventions(0, 6),
        ]);
        setStats(statsRes.data);
        // Pas d'endpoint d'activité dédié côté backend : on dérive un flux
        // récent à partir des dernières interventions créées.
        setActiviteRecente(interventionsRes.data.content);
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  if (chargement || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Tableau de bord</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Vue d'ensemble de l'activité SAV.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total interventions" value={stats.totalInterventions} accent="brand"
          onClick={() => navigate('/app/interventions')} />
        <StatCard icon={Clock} label="En cours" value={stats.interventionsEnCours} accent="blue"
          onClick={() => navigate('/app/interventions?etat=EN_COURS')} />
        <StatCard icon={CheckCircle2} label="Terminées" value={stats.interventionsTerminees} accent="emerald"
          onClick={() => navigate('/app/interventions?etat=TERMINEE')} />
        <StatCard
          icon={Wallet}
          label="CA ce mois"
          value={Math.round(stats.chiffreAffairesMoisCourant || 0)}
          suffix=" DT"
          sousTexte={`Depuis le ${debutMois}`}
          accent="violet"
          onClick={() => caEmployeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Interventions par état</CardTitle></CardHeader>
          <CardContent><EtatsBarChart data={stats.interventionsParEtat} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Répartition par priorité</CardTitle></CardHeader>
          <CardContent><PrioriteDonutChart data={stats.interventionsParPriorite} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Performance des employés</CardTitle></CardHeader>
          <CardContent><EmployePerfChart data={stats.performanceEmployes} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Évolution {vueEvolution === 'jour' ? 'quotidienne' : 'mensuelle'}</CardTitle>
            <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-white/5 p-0.5">
              {['jour', 'mois'].map((v) => (
                <button
                  key={v}
                  onClick={() => setVueEvolution(v)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                    vueEvolution === v ? 'bg-white dark:bg-dark-card text-brand-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {v === 'mois' ? 'Mois' : 'Jour'}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <CAAreaChart
              data={vueEvolution === 'jour' ? stats.evolutionQuotidienne : stats.evolutionMensuelle}
              granularite={vueEvolution}
            />
          </CardContent>
        </Card>
        <div ref={caEmployeRef} className="scroll-mt-20">
          <Card>
            <CardHeader><CardTitle>Chiffre d'affaires par employé (DT)</CardTitle></CardHeader>
            <CardContent><EmployeCAChart data={stats.chiffreAffairesEmployes} /></CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Chiffre d'affaires {vueCA === 'jour' ? 'par jour' : 'par mois'} (DT)</CardTitle>
            <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-white/5 p-0.5">
              {['jour', 'mois'].map((v) => (
                <button
                  key={v}
                  onClick={() => setVueCA(v)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                    vueCA === v ? 'bg-white dark:bg-dark-card text-brand-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {v === 'mois' ? 'Mois' : 'Jour'}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <CAEvolutionChart
              data={vueCA === 'jour' ? stats.chiffreAffairesParJour : stats.chiffreAffairesParMois}
              granularite={vueCA}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Activité récente</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {activiteRecente.map((it, i) => (
              <motion.li
                key={it.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelection(it)}
                className="flex items-center gap-4 cursor-pointer -mx-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {it.code} — {it.clientNom}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(it.dateCreation)}</p>
                </div>
                <StatutBadge etat={it.etat} />
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <InterventionDetailModal
        intervention={selection}
        role={user.role}
        open={!!selection}
        onClose={() => setSelection(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
