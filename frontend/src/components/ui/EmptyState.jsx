import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

// État vide illustré, remplace les messages "Aucune donnée" bruts.
export default function EmptyState({ icon: Icon = Inbox, message = 'Rien à afficher ici pour le moment.', action }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 py-16 text-center"
    >
      <div className="rounded-full bg-slate-100 dark:bg-white/5 p-4 text-slate-400">
        <Icon size={28} />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{message}</p>
      {action}
    </motion.div>
  );
}
