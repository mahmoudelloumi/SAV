import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

// ============================================================
// Champs de formulaire premium : label + message d'erreur intégrés.
// ============================================================

const CHAMP_CLASSES =
  'w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 ' +
  'px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 ' +
  'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors';

function Champ({ label, erreur, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
      )}
      {children}
      {hint && !erreur && <span className="text-xs text-slate-400">{hint}</span>}
      {erreur && <span className="text-xs text-red-500">{erreur}</span>}
    </div>
  );
}

export function Input({ label, erreur, hint, className, ...props }) {
  return (
    <Champ label={label} erreur={erreur} hint={hint}>
      <input className={clsx(CHAMP_CLASSES, erreur && 'border-red-400', className)} {...props} />
    </Champ>
  );
}

// Champ mot de passe avec bouton œil pour afficher/masquer la saisie.
export function PasswordInput({ label, erreur, hint, className, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <Champ label={label} erreur={erreur} hint={hint}>
      <div className="relative">
        <input
          {...props}
          type={visible ? 'text' : 'password'}
          className={clsx(CHAMP_CLASSES, 'pr-11', erreur && 'border-red-400', className)}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-500 transition-colors"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </Champ>
  );
}

export function Textarea({ label, erreur, hint, className, ...props }) {
  return (
    <Champ label={label} erreur={erreur} hint={hint}>
      <textarea className={clsx(CHAMP_CLASSES, erreur && 'border-red-400', className)} {...props} />
    </Champ>
  );
}

export function Select({ label, erreur, hint, className, children, ...props }) {
  return (
    <Champ label={label} erreur={erreur} hint={hint}>
      <select className={clsx(CHAMP_CLASSES, erreur && 'border-red-400', className)} {...props}>
        {children}
      </select>
    </Champ>
  );
}
