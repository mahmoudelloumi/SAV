import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardCheck, Clock, CheckCircle2, ArrowRight, Check, Hand, Inbox } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useInterventions } from '../../hooks/useInterventions.js';
import { accepterIntervention, prendreEnCharge, getInterventionsParEtat } from '../../api/interventionService.js';
import StatCard from '../../components/ui/StatCard.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card.jsx';
import { SkeletonCard } from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { StatutBadge, PrioriteBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';

export default function DashboardEmploye() {
  const { user } = useAuth();
  const { content, chargement, recharger } = useInterventions(user, { size: 50 });
  const [enTraitement, setEnTraitement] = useState(null);
  const [pool, setPool] = useState([]);

  const aTraiter = content.filter((i) => ['AFFECTEE', 'ACCEPTEE', 'EN_COURS'].includes(i.etat));
  const enCours = content.filter((i) => i.etat === 'EN_COURS').length;
  const termineesCeMois = content.filter((i) => {
    if (i.etat !== 'TERMINEE' || !i.dateCloture) return false;
    const cloture = new Date(i.dateCloture);
    const maintenant = new Date();
    return cloture.getMonth() === maintenant.getMonth() && cloture.getFullYear() === maintenant.getFullYear();
  }).length;

  const chargerPool = useCallback(async () => {
    try {
      const { data } = await getInterventionsParEtat('NOUVELLE', 0, 50);
      setPool(data.content);
    } catch {
      setPool([]);
    }
  }, []);

  useEffect(() => {
    chargerPool();
  }, [chargerPool]);

  async function handleAccepter(id) {
    setEnTraitement(id);
    try {
      await accepterIntervention(id);
      recharger();
    } finally {
      setEnTraitement(null);
    }
  }

  async function handlePrendreEnCharge(id) {
    setEnTraitement(id);
    try {
      await prendreEnCharge(id);
      await chargerPool();
      recharger();
    } finally {
      setEnTraitement(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Bonjour {user.prenom} 👋
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Voici vos interventions à traiter.</p>
      </div>

      {chargement ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={ClipboardCheck} label="À traiter" value={aTraiter.length} accent="brand" />
          <StatCard icon={Clock} label="En cours" value={enCours} accent="blue" />
          <StatCard icon={CheckCircle2} label="Terminées ce mois" value={termineesCeMois} accent="emerald" />
        </div>
      )}

      {pool.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox size={18} className="text-brand-500" /> Nouvelles interventions disponibles
            </CardTitle>
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">{pool.length} en attente</span>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {pool.slice(0, 6).map((it, i) => (
                <motion.li
                  key={it.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{it.code}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {it.clientRaisonSociale} — {it.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PrioriteBadge priorite={it.priorite} />
                    <Button
                      size="sm"
                      icon={Hand}
                      loading={enTraitement === it.id}
                      onClick={() => handlePrendreEnCharge(it.id)}
                    >
                      Prendre en charge
                    </Button>
                  </div>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Interventions à traiter</CardTitle>
          <Link to="/app/interventions" className="text-sm font-medium text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline">
            Tout voir <ArrowRight size={14} />
          </Link>
        </CardHeader>
        <CardContent>
          {aTraiter.length === 0 ? (
            <EmptyState message="Aucune intervention en attente de traitement." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {aTraiter.slice(0, 6).map((it, i) => (
                <motion.li
                  key={it.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{it.code}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {it.clientRaisonSociale} — {it.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PrioriteBadge priorite={it.priorite} />
                    <StatutBadge etat={it.etat} />
                    {it.etat === 'AFFECTEE' && (
                      <Button
                        size="sm"
                        icon={Check}
                        loading={enTraitement === it.id}
                        onClick={() => handleAccepter(it.id)}
                      >
                        Accepter
                      </Button>
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
