import { motion } from 'framer-motion';
import clsx from 'clsx';

// ============================================================
// Carte premium : glassmorphism léger, coins arrondis 16px, ombre douce.
// ============================================================

export default function Card({ className, hover = false, children, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={hover ? { y: -4 } : undefined}
      className={clsx(
        'rounded-2xl border border-slate-200/70 dark:border-white/10',
        'bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl',
        'shadow-soft dark:shadow-soft-dark transition-shadow duration-300',
        hover && 'hover:shadow-glow',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={clsx('flex items-center justify-between px-6 pt-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={clsx('font-display text-lg font-semibold text-slate-900 dark:text-white', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={clsx('p-6', className)} {...props}>
      {children}
    </div>
  );
}
