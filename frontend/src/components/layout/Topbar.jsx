import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Bell, MessageSquare, LogOut, Menu, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import Avatar from '../ui/Avatar.jsx';
import { LIBELLES_ROLE } from '../../constants/sav.js';
import { NOTIFICATIONS_DEMO } from '../../data/notificationsDemo.js';

// ============================================================
// Barre supérieure de l'application : recherche, notifications,
// messages, thème, menu profil.
// ============================================================

export default function Topbar({ onOpenMobileMenu }) {
  const { user, logout, photoUrl } = useAuth();
  const navigate = useNavigate();
  const [rechercheQuery, setRechercheQuery] = useState('');
  const [menuProfilOuvert, setMenuProfilOuvert] = useState(false);
  const [notifsOuvertes, setNotifsOuvertes] = useState(false);

  const nonLues = NOTIFICATIONS_DEMO.filter((n) => !n.lue).length;

  function handleRecherche(e) {
    e.preventDefault();
    if (rechercheQuery.trim()) {
      navigate(`/app/interventions?q=${encodeURIComponent(rechercheQuery.trim())}`);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-dark-bg/70 backdrop-blur-xl px-4 md:px-6">
      <button onClick={onOpenMobileMenu} className="md:hidden text-slate-500">
        <Menu size={22} />
      </button>

      <form onSubmit={handleRecherche} className="hidden sm:flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={rechercheQuery}
            onChange={(e) => setRechercheQuery(e.target.value)}
            placeholder="Rechercher une intervention…"
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setNotifsOuvertes((v) => !v)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <Bell size={19} />
            {nonLues > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500" />
            )}
          </button>
          <AnimatePresence>
            {notifsOuvertes && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-dark-card shadow-2xl p-2"
              >
                {NOTIFICATIONS_DEMO.slice(0, 4).map((n) => (
                  <div key={n.id} className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5">
                    <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.lue ? 'bg-slate-300' : 'bg-brand-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{n.titre}</p>
                      <p className="text-xs text-slate-400">{n.temps}</p>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => { setNotifsOuvertes(false); navigate('/app/notifications'); }}
                  className="w-full text-center text-xs font-semibold text-brand-600 dark:text-brand-400 py-2 hover:underline"
                >
                  Voir toutes les notifications
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => navigate('/app/messagerie')}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <MessageSquare size={19} />
        </button>

        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => setMenuProfilOuvert((v) => !v)}
            className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <Avatar nom={user.nom} prenom={user.prenom} size="sm" src={photoUrl} />
            <span className="hidden lg:block text-sm font-medium text-slate-700 dark:text-slate-200">
              {user.prenom}
            </span>
            <ChevronDown size={14} className="hidden lg:block text-slate-400" />
          </button>
          <AnimatePresence>
            {menuProfilOuvert && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-dark-card shadow-2xl p-2"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10 mb-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {user.prenom} {user.nom}
                  </p>
                  <p className="text-xs text-slate-400">{LIBELLES_ROLE[user.role]}</p>
                </div>
                <button
                  onClick={() => { setMenuProfilOuvert(false); navigate('/app/parametres'); }}
                  className="w-full text-left rounded-xl px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  Paramètres
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut size={15} /> Déconnexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
