import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, Cell } from 'recharts';

// Palette de mise en avant : podium (or / argent / bronze) puis orange marque.
const COULEURS = ['#f59e0b', '#94a3b8', '#b45309'];
const COULEUR_DEFAUT = '#ff7a00';

// Performance des employés (interventions terminées par employé), barres horizontales
// classées et étiquetées. `data` : { "Nom Prénom": count, ... } — performanceEmployes.
export default function EmployePerfChart({ data = {} }) {
  const chartData = Object.entries(data)
    .map(([nom, count]) => ({ nom, count: Number(count) || 0 }))
    .sort((a, b) => b.count - a.count);

  if (chartData.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">Aucune donnée employé disponible.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 46)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 32, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-white/5" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" allowDecimals={false} />
        <YAxis type="category" dataKey="nom" tick={{ fontSize: 11 }} width={140} stroke="currentColor" className="text-slate-400" />
        <Tooltip
          cursor={{ fill: 'rgba(148,163,184,0.08)' }}
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
          formatter={(v) => [`${v} intervention${v > 1 ? 's' : ''} terminée${v > 1 ? 's' : ''}`, 'Performance']}
        />
        <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={20} isAnimationActive>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COULEURS[i] || COULEUR_DEFAUT} />
          ))}
          <LabelList dataKey="count" position="right" className="fill-slate-500 dark:fill-slate-300" fontSize={11} fontWeight={600} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
