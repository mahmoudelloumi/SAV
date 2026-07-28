import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import MobileSidebar from './MobileSidebar.jsx';
import ChatbotWidget from '../chatbot/ChatbotWidget.jsx';
import AssistantAdminWidget from '../chatbot/AssistantAdminWidget.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

// ============================================================
// Coquille applicative (post-connexion) : Sidebar + Topbar + contenu.
// Gère l'état "réduit" de la sidebar (persisté) et le menu mobile.
// ============================================================

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');
  const [mobileOuvert, setMobileOuvert] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();
  // Un assistant flottant (bulle en bas à droite) est affiché pour le client et le directeur :
  // on réserve de l'espace en bas du contenu pour qu'il ne recouvre pas les boutons
  // (ex. pagination des tableaux) situés en bas de page.
  const aAssistantFlottant = user?.role === 'CLIENT' || user?.role === 'DIRECTEUR';

  // Remonte en haut de page à chaque changement d'onglet/route.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem('sidebar-collapsed', String(!c));
      return !c;
    });
  }

  return (
    <div className="flex min-h-screen bg-light-bg dark:bg-dark-bg">
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />

      <AnimatePresence>
        {mobileOuvert && (
          <MobileSidebar onClose={() => setMobileOuvert(false)} />
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0">
        <Topbar onOpenMobileMenu={() => setMobileOuvert(true)} />
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`px-4 pt-4 md:px-6 md:pt-6 max-w-[1600px] mx-auto ${aAssistantFlottant ? 'pb-32' : 'pb-4 md:pb-6'}`}
        >
          <Outlet />
        </motion.main>
      </div>

      {/* Assistant SAV (IA) : réservé aux clients */}
      {user?.role === 'CLIENT' && <ChatbotWidget />}

      {/* Assistant de données (IA) : réservé au directeur */}
      {user?.role === 'DIRECTEUR' && <AssistantAdminWidget />}
    </div>
  );
}
