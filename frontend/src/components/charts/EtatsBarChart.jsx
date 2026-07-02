import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { LIBELLES_ETAT, COULEURS_ETAT } from '../../constants/sav.js';

// Interventions par état — barres colorées selon la palette métier.
// `data` : { [etat]: count } — objet renvoyé par /statistiques (interventionsParEtat).
const HEX_PAR_ETAT = {
  NOUVELLE: '#0ea5e9', AFFECTEE: '#8b5cf6', ACCEPTEE: '#6366f1',
  EN_ATTENTE: '#f59e0b', EN_COURS: '#ff7a00', TERMINEE: '#10b981', ANNULEE: '#ef4444',
};

export default function EtatsBarChart({ data = {} }) {
  const chartData = Object.entries(data).map(([etat, count]) => ({
    etat: LIBELLES_ETAT[etat] || etat,
    count,
    key: etat,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-white/5" />
        <XAxis dataKey="etat" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" />
        <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
        />
        <Bar dataKey="count" radius={[8, 8, 0, 0]} isAnimationActive>
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={HEX_PAR_ETAT[entry.key] || '#94a3b8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
