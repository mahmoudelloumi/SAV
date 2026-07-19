import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Évolution par mois ou par jour (aire dégradée). Sert au nombre d'interventions
// (unite='interventions') ou au chiffre d'affaires (unite='DT').
// `data` : { "2026-01": valeur } (mois) ou { "2026-07-16": valeur } (jour).

function libelleCle(cle, granularite, avecAnnee = false) {
  if (!cle || !cle.includes('-')) return cle;
  const parts = cle.split('-').map(Number);
  if (granularite === 'jour') {
    const [y, m, j] = parts;
    return new Date(y, m - 1, j).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }); // "16 juil."
  }
  const [y, m] = parts;
  const court = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short' });
  return avecAnnee ? `${court} ${String(y).slice(2)}` : court;
}

export default function CAAreaChart({ data = {}, granularite = 'mois', unite = 'interventions', couleur = '#ff7a00' }) {
  const chartData = Object.entries(data).map(([mois, valeur]) => ({ mois, valeur: Number(valeur) || 0 }));
  const total = chartData.reduce((s, d) => s + d.valeur, 0);
  const libellePeriode = granularite === 'jour' ? 'sur 30 jours' : 'sur la période';
  const estCA = unite === 'DT';

  const fmt = (v) => (estCA ? `${v.toLocaleString('fr-FR')} DT` : `${v} intervention${v > 1 ? 's' : ''}`);
  const gradId = estCA ? 'degradeCA' : 'degradeInterv';

  if (chartData.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">Aucune donnée sur la période.</p>;
  }

  return (
    <div>
      <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-800 dark:text-slate-100">{fmt(total)}</span> {libellePeriode}
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={couleur} stopOpacity={0.4} />
              <stop offset="95%" stopColor={couleur} stopOpacity={0} />
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
          <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" allowDecimals={false} width={estCA ? 48 : undefined} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
            labelFormatter={(m) => libelleCle(m, granularite, true)}
            formatter={(v) => [fmt(v), estCA ? "Chiffre d'affaires" : 'Créées']}
          />
          <Area
            type="monotone"
            dataKey="valeur"
            stroke={couleur}
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            dot={{ r: 2.5, fill: couleur }}
            activeDot={{ r: 5 }}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
