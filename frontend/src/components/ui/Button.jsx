import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

// ============================================================
// Bouton premium : variantes, tailles, état de chargement animé.
// ============================================================

const VARIANTS = {
  primary:
    'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-glow hover:from-brand-400 hover:to-brand-500',
  secondary:
    'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200',
  outline:
    'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 bg-white/60 dark:bg-white/5 backdrop-blur',
  ghost:
    'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10',
  danger:
    'bg-red-500 text-white hover:bg-red-600 shadow-[0_8px_24px_-8px_rgba(239,68,68,0.5)]',
};

const SIZES = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
};

// Exporté pour appliquer le même style à un composant non-bouton
// (ex: <Link className={buttonClasses({variant:'primary'})}>).
export function buttonClasses({ variant = 'primary', size = 'md', className } = {}) {
  return clsx(
    'inline-flex items-center justify-center rounded-2xl font-semibold transition-colors duration-200',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    VARIANTS[variant],
    SIZES[size],
    className
  );
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className,
  children,
  ...props
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      disabled={disabled || loading}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={18} />
      ) : (
        Icon && <Icon size={18} />
      )}
      {children}
    </motion.button>
  );
}
