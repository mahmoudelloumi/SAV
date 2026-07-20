import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Évolution du chiffre d'affaires (DT), par mois ou par jour (aire verte).
// `data` : { "2026-01": montant } (mois) ou { "2026-07-16": montant } (jour).

function libelleCle(cle, granularite, avecAnnee = false) {
  if (!cle || !cle.includes('-')) return cle;
  const parts = cle.split('-').map(Number);
  if (granularite === 'jour') {
    const [y, m, j] = parts;
    return new Date(y, m - 1, j).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }
  const [y, m] = parts;
  const court = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short' });
  return avecAnnee ? `${court} ${String(y).slice(2)}` : court;
}

const fmtDT = (v) => `${Number(v || 0).toLocaleString('fr-FR')} DT`;

export default function CAEvolutionChart({ data = {}, granularite = 'mois' }) {
  const chartData = Object.entries(data).map(([mois, montant]) => ({ mois, montant: Number(montant) || 0 }));
  const total = chartData.reduce((s, d) => s + d.montant, 0);
  const libellePeriode = granularite === 'jour' ? 'sur 30 jours' : 'sur la période';

  if (chartData.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">Aucune donnée sur la période.</p>;
  }

  return (
    <div>
      <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmtDT(total)}</span> encaissés {libellePeriode}
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="degradeCA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-white/5" />
          <XAxis
            dataKey="mois"
            tick={{ fontSize: 11 }}
            stroke="currentColor"
            className="text-slate-400"
            tickFormatter={(m) => libelleCle(m, granularite)}
            interval="preserveStartEnd"
            minTickGap={granularite === 'jour' ? 24 : 12}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="currentColor"
            className="text-slate-400"
            tickFormatter={(v) => v.toLocaleString('fr-FR')}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
            labelFormatter={(m) => libelleCle(m, granularite, true)}
            formatter={(v) => [fmtDT(v), "Chiffre d'affaires"]}
          />
          <Area
            type="monotone"
            dataKey="montant"
            stroke="#16a34a"
            strokeWidth={2.5}
            fill="url(#degradeCA)"
            dot={{ r: 2.5, fill: '#16a34a' }}
            activeDot={{ r: 5 }}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
