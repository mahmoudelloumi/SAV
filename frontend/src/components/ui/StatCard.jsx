import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import Card from './Card.jsx';

// ============================================================
// Carte KPI animée : icône, libellé, valeur qui s'anime en comptant,
// variation optionnelle (ex: "+12% ce mois").
// ============================================================

function CompteurAnime({ valeur }) {
  const spring = useSpring(0, { stiffness: 90, damping: 20 });
  const affichee = useTransform(spring, (v) => Math.round(v).toLocaleString('fr-FR'));

  useEffect(() => {
    spring.set(Number(valeur) || 0);
  }, [valeur, spring]);

  return <motion.span>{affichee}</motion.span>;
}

export default function StatCard({ icon: Icon, label, value, suffix = '', delta, sousTexte, accent = 'brand', onClick }) {
  const accents = {
    brand: 'from-brand-500 to-brand-600',
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    violet: 'from-violet-500 to-violet-600',
  };

  return (
    <Card hover onClick={onClick} className={`relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="p-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">
            <CompteurAnime valeur={value} />
            {suffix}
          </p>
          {delta && (
            <p className="mt-1 text-xs font-medium text-emerald-500">{delta}</p>
          )}
          {sousTexte && (
            <p className="mt-1 text-xs font-normal text-slate-400">{sousTexte}</p>
          )}
        </div>
        {Icon && (
          <div className={`rounded-2xl bg-gradient-to-br ${accents[accent]} p-3 text-white shadow-glow`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </Card>
  );
}
