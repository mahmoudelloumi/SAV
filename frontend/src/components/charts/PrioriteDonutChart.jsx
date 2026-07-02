import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LIBELLES_PRIORITE } from '../../constants/sav.js';

const HEX_PAR_PRIORITE = {
  TRES_URGENT: '#ef4444', URGENT: '#ff7a00', NORMAL: '#3b82f6', FACULTATIF: '#94a3b8',
};

// Répartition des interventions par priorité (camembert).
// `data` : { [priorite]: count } — objet interventionsParPriorite de /statistiques.
export default function PrioriteDonutChart({ data = {} }) {
  const chartData = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([priorite, count]) => ({ name: LIBELLES_PRIORITE[priorite] || priorite, value: count, key: priorite }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={3}
          isAnimationActive
        >
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={HEX_PAR_PRIORITE[entry.key] || '#94a3b8'} stroke="none" />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
