import { Search, ArrowUpDown } from 'lucide-react';
import clsx from 'clsx';
import { ETATS, LIBELLES_ETAT, PRIORITES, LIBELLES_PRIORITE } from '../../constants/sav.js';

// Options de tri proposées à l'utilisateur (valeur => libellé).
// Tri appliqué côté serveur → il concerne TOUTES les pages, pas seulement l'affichée.
export const OPTIONS_TRI = {
  DATE_DESC: 'Plus récentes d’abord',
  DATE_ASC: 'Plus anciennes d’abord',
};

// Filtres client-side (recherche texte + chips état/priorité) appliqués
// sur la page d'interventions couramment chargée.
export default function InterventionFilters({ recherche, onRechercheChange, etat, onEtatChange, priorite, onPrioriteChange, tri, onTriChange }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={recherche}
            onChange={(e) => onRechercheChange(e.target.value)}
            placeholder="Rechercher par code, description ou client…"
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
          />
        </div>

        <div className="relative">
          <ArrowUpDown size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={tri}
            onChange={(e) => onTriChange(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 py-2 pl-9 pr-8 text-sm text-slate-600 dark:text-slate-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors cursor-pointer"
          >
            {Object.entries(OPTIONS_TRI).map(([valeur, libelle]) => (
              <option key={valeur} value={valeur}>{libelle}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip active={etat === ''} onClick={() => onEtatChange('')}>Tous les états</Chip>
        {ETATS.map((e) => (
          <Chip key={e} active={etat === e} onClick={() => onEtatChange(e)}>{LIBELLES_ETAT[e]}</Chip>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip active={priorite === ''} onClick={() => onPrioriteChange('')}>Toutes priorités</Chip>
        {PRIORITES.map((p) => (
          <Chip key={p} active={priorite === p} onClick={() => onPrioriteChange(p)}>{LIBELLES_PRIORITE[p]}</Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-brand-500 bg-brand-500 text-white shadow-glow'
          : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-brand-400 hover:text-brand-500'
      )}
    >
      {children}
    </button>
  );
}
