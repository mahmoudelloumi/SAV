import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import EmptyState from './EmptyState.jsx';

// ============================================================
// DataTable générique : colonnes déclaratives + pagination serveur.
//
// columns: [{ key, label, render?(row) }]
// pageInfo: { number, totalPages, totalElements } (format Page Spring Data)
// ============================================================

export default function Table({ columns, data, pageInfo, onPageChange, emptyMessage, rowKey = 'id', onRowClick }) {
  if (!data?.length) {
    return <EmptyState message={emptyMessage || 'Aucune donnée pour le moment.'} />;
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-white/10">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
          <thead className="bg-slate-50/80 dark:bg-white/5">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {data.map((row, i) => (
              <motion.tr
                key={row[rowKey] ?? i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={clsx(
                  'hover:bg-brand-50/50 dark:hover:bg-white/5 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5 text-sm text-slate-700 dark:text-slate-200">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageInfo && pageInfo.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500 dark:text-slate-400">
          <span>
            Page {pageInfo.number + 1} / {pageInfo.totalPages} — {pageInfo.totalElements} résultats
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pageInfo.number - 1)}
              disabled={pageInfo.number === 0}
              className={clsx(
                'rounded-xl border border-slate-200 dark:border-white/10 p-2 transition-colors',
                pageInfo.number === 0
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:border-brand-400 hover:text-brand-600'
              )}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange(pageInfo.number + 1)}
              disabled={pageInfo.number + 1 >= pageInfo.totalPages}
              className={clsx(
                'rounded-xl border border-slate-200 dark:border-white/10 p-2 transition-colors',
                pageInfo.number + 1 >= pageInfo.totalPages
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:border-brand-400 hover:text-brand-600'
              )}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
