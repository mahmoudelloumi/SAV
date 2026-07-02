import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, MailOpen } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { NOTIFICATIONS_DEMO } from '../../data/notificationsDemo.js';

// Page de démonstration : aucune API backend de notifications n'existe
// actuellement (voir data/notificationsDemo.js). L'état lu/non-lu n'est
// géré qu'en mémoire locale, non persisté.

const ICONES_TYPE = { succes: CheckCircle2, info: Info, alerte: AlertTriangle };
const COULEURS_TYPE = {
  succes: 'bg-emerald-100 text-emerald-500 dark:bg-emerald-500/15',
  info: 'bg-blue-100 text-blue-500 dark:bg-blue-500/15',
  alerte: 'bg-amber-100 text-amber-500 dark:bg-amber-500/15',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS_DEMO);

  function marquerCommeLue(id) {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, lue: true } : n)));
  }

  function toutMarquerLu() {
    setNotifications((list) => list.map((n) => ({ ...n, lue: true })));
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Restez informé de l'activité de vos interventions.</p>
        </div>
        <Button variant="outline" size="sm" icon={MailOpen} onClick={toutMarquerLu}>Tout marquer lu</Button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState message="Aucune notification pour le moment." />
      ) : (
        <Card>
          <CardContent className="p-2">
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {notifications.map((n, i) => {
                const Icon = ICONES_TYPE[n.type];
                return (
                  <motion.li
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => marquerCommeLue(n.id)}
                    className={`flex gap-3 rounded-xl px-3 py-3.5 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${!n.lue && 'bg-brand-50/40 dark:bg-brand-500/5'}`}
                  >
                    <div className={`rounded-full p-2 h-fit ${COULEURS_TYPE[n.type]}`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{n.titre}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{n.description}</p>
                      <p className="text-xs text-slate-400 mt-1">{n.temps}</p>
                    </div>
                    {!n.lue && <span className="h-2 w-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />}
                  </motion.li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
