import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

// Formatte un montant en dinars tunisiens (DT), sans décimales pour l'axe/étiquette.
const fmtCourt = (v) => `${Number(v || 0).toLocaleString('fr-FR')} DT`;
const fmtLong = (v) =>
  `${Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT`;

// Chiffre d'affaires généré par employé (somme des prix finaux des interventions
// terminées), barres horizontales classées et étiquetées en DT.
// `data` : { "Nom Prénom": montant, ... } — chiffreAffairesEmployes de /statistiques.
export default function EmployeCAChart({ data = {} }) {
  const chartData = Object.entries(data)
    .map(([nom, ca]) => ({ nom, ca: Number(ca) || 0 }))
    .sort((a, b) => b.ca - a.ca);

  if (chartData.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">Aucun chiffre d'affaires enregistré.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 46)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 56, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-white/5" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          stroke="currentColor"
          className="text-slate-400"
          tickFormatter={(v) => v.toLocaleString('fr-FR')}
        />
        <YAxis type="category" dataKey="nom" tick={{ fontSize: 11 }} width={140} stroke="currentColor" className="text-slate-400" />
        <Tooltip
          cursor={{ fill: 'rgba(148,163,184,0.08)' }}
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
          formatter={(v) => [fmtLong(v), 'Chiffre d’affaires']}
        />
        <Bar dataKey="ca" fill="#16a34a" radius={[0, 8, 8, 0]} barSize={20} isAnimationActive>
          <LabelList dataKey="ca" position="right" formatter={fmtCourt} className="fill-emerald-600 dark:fill-emerald-400" fontSize={11} fontWeight={600} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
