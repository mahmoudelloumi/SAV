import { useEffect, useState } from 'react';
import { getStatistiques, getStatistiquesParPeriode } from '../../api/statistiquesService.js';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { SkeletonCard } from '../../components/ui/Skeleton.jsx';
import EtatsBarChart from '../../components/charts/EtatsBarChart.jsx';
import PrioriteDonutChart from '../../components/charts/PrioriteDonutChart.jsx';
import CAAreaChart from '../../components/charts/CAAreaChart.jsx';
import EmployePerfChart from '../../components/charts/EmployePerfChart.jsx';
import EmployeCAChart from '../../components/charts/EmployeCAChart.jsx';
import CAEvolutionChart from '../../components/charts/CAEvolutionChart.jsx';

export default function Statistiques() {
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');
  const [vueEvolution, setVueEvolution] = useState('mois');
  const [vueCA, setVueCA] = useState('mois');

  async function chargerDefaut() {
    setChargement(true);
    try {
      const res = await getStatistiques();
      setStats(res.data);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { chargerDefaut(); }, []);

  async function chargerPeriode(e) {
    e.preventDefault();
    if (!debut || !fin) return;
    setChargement(true);
    try {
      const res = await getStatistiquesParPeriode(`${debut}T00:00:00`, `${fin}T23:59:59`);
      setStats(res.data);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Statistiques</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Analyse détaillée de l'activité SAV.</p>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={chargerPeriode} className="flex flex-wrap items-end gap-4">
            <Input label="Du" type="date" value={debut} onChange={(e) => setDebut(e.target.value)} />
            <Input label="Au" type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
            <Button type="submit" size="sm">Filtrer</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setDebut(''); setFin(''); chargerDefaut(); }}>
              Réinitialiser (12 derniers mois)
            </Button>
          </form>
        </CardContent>
      </Card>

      {chargement || !stats ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
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
          <Card>
            <CardHeader><CardTitle>Chiffre d'affaires par employé (DT)</CardTitle></CardHeader>
            <CardContent><EmployeCAChart data={stats.chiffreAffairesEmployes} /></CardContent>
          </Card>
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
      )}
    </div>
  );
}
