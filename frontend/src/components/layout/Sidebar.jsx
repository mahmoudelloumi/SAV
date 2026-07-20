import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Wrench, Users, UserCog, BarChart3,
  Bell, MessageSquare, Settings, ChevronsLeft, ChevronsRight, BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { MENU_PAR_ROLE } from '../../constants/sav.js';
import logo from '../../assets/logo_idsoft.png';

// Mapping nom (chaîne, défini dans constants/sav.js) -> composant icône Lucide.
const ICONES = { LayoutDashboard, Wrench, Users, UserCog, BarChart3, Bell, MessageSquare, Settings, BookOpen };

// ============================================================
// Sidebar applicative : collapsible, items filtrés par rôle,
// mise en avant animée de la section active.
// ============================================================

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const items = MENU_PAR_ROLE[user.role] || [];

  return (
    <motion.aside
      animate={{ width: collapsed ? 84 : 260 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-dark-card/70 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 px-5 h-16 shrink-0">
        <img src={logo} alt="ID SOFT" className="h-9 w-auto shrink-0 drop-shadow-[0_0_10px_rgba(255,122,0,0.35)]" />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="font-display text-sm font-bold text-slate-900 dark:text-white truncate">
              ID Software Solutions
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Gestion de SAV</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => {
          const Icon = ICONES[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/app'}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-brand-50 dark:bg-brand-500/10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon size={19} className="relative shrink-0" />
                  {!collapsed && <span className="relative truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={onToggle}
        className="flex items-center gap-2 mx-3 mb-4 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
      >
        {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        {!collapsed && <span>Réduire</span>}
      </button>
    </motion.aside>
  );
}
