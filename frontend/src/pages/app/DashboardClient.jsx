import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, CheckCircle2, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useInterventions } from '../../hooks/useInterventions.js';
import StatCard from '../../components/ui/StatCard.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { SkeletonCard } from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { StatutBadge, PrioriteBadge } from '../../components/ui/Badge.jsx';
import CreerInterventionModal from '../../components/interventions/CreerInterventionModal.jsx';
import InterventionDetailModal from '../../components/interventions/InterventionDetailModal.jsx';
import { getInterventionById } from '../../api/interventionService.js';

export default function DashboardClient() {
  const { user } = useAuth();
  const { content, chargement, recharger } = useInterventions(user, { size: 50 });
  const [modalOuverte, setModalOuverte] = useState(false);
  const [selection, setSelection] = useState(null);

  async function handleUpdated() {
    recharger();
    if (selection) {
      try {
        const { data } = await getInterventionById(selection.id);
        setSelection(data);
      } catch { /* on garde la sélection courante */ }
    }
  }

  const enCours = content.filter((i) => ['ACCEPTEE', 'EN_COURS', 'AFFECTEE'].includes(i.etat)).length;
  const terminees = content.filter((i) => i.etat === 'TERMINEE').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Bonjour {user.prenom} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Voici le suivi de vos interventions.</p>
        </div>
        <Button icon={Plus} onClick={() => setModalOuverte(true)}>Nouvelle demande</Button>
      </div>

      {chargement ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={ClipboardList} label="Total demandes" value={content.length} accent="brand" />
          <StatCard icon={Clock} label="En cours" value={enCours} accent="blue" />
          <StatCard icon={CheckCircle2} label="Terminées" value={terminees} accent="emerald" />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Interventions récentes</CardTitle>
          <Link to="/app/interventions" className="text-sm font-medium text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline">
            Tout voir <ArrowRight size={14} />
          </Link>
        </CardHeader>
        <CardContent>
          {content.length === 0 ? (
            <EmptyState message="Aucune intervention pour le moment. Créez votre première demande." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {content.slice(0, 5).map((it, i) => (
                <motion.li
                  key={it.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelection(it)}
                  className="flex items-center justify-between gap-4 py-3 cursor-pointer -mx-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{it.code}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">{it.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PrioriteBadge priorite={it.priorite} />
                    <StatutBadge etat={it.etat} />
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <CreerInterventionModal
        open={modalOuverte}
        onClose={() => setModalOuverte(false)}
        onCree={recharger}
      />

      <InterventionDetailModal
        intervention={selection}
        role={user.role}
        open={!!selection}
        onClose={() => setSelection(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
