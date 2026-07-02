import clsx from 'clsx';
import {
  LIBELLES_ETAT,
  COULEURS_ETAT,
  LIBELLES_PRIORITE,
  COULEURS_PRIORITE,
} from '../../constants/sav.js';

// ============================================================
// Badges pastille : générique + variantes métier (état/priorité).
// ============================================================

export default function Badge({ className, children, color = 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        color,
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatutBadge({ etat }) {
  return <Badge color={COULEURS_ETAT[etat]}>{LIBELLES_ETAT[etat] || etat}</Badge>;
}

export function PrioriteBadge({ priorite }) {
  return <Badge color={COULEURS_PRIORITE[priorite]}>{LIBELLES_PRIORITE[priorite] || priorite}</Badge>;
}
