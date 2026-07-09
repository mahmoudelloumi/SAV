import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Wrench, Users, UserCog, BarChart3,
  Bell, MessageSquare, Settings, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { MENU_PAR_ROLE } from '../../constants/sav.js';
import logo from '../../assets/logo_idsoft.png';

const ICONES = { LayoutDashboard, Wrench, Users, UserCog, BarChart3, Bell, MessageSquare, Settings };

// Sidebar en overlay plein écran pour mobile/tablette (< md).
export default function MobileSidebar({ onClose }) {
  const { user } = useAuth();
  const items = MENU_PAR_ROLE[user.role] || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 md:hidden"
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        exit={{ x: -280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative h-full w-72 bg-white dark:bg-dark-card flex flex-col"
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 dark:border-white/10">
          <img src={logo} alt="ID SOFT" className="h-8 w-auto drop-shadow-[0_0_10px_rgba(255,122,0,0.35)]" />
          <button onClick={onClose} className="text-slate-400"><X size={20} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map((item) => {
            const Icon = ICONES[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/app'}
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); onClose(); }}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-brand-600 bg-brand-50 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </motion.div>
    </motion.div>
  );
}
