import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Menu, X } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { buttonClasses } from '../ui/Button.jsx';
import logo from '../../assets/logo_idsoft.png';

const LIENS = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'Interventions', href: '#interventions' },
  { label: 'Services', href: '#services' },
  { label: 'Clients', href: '#clients' },
  { label: 'Contact', href: '#contact' },
  { label: 'À propos', href: '#apropos' },
];

export default function PublicNavbar() {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-dark-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 md:px-8">
        <Link to="/" className="flex items-center shrink-0">
          <img src={logo} alt="ID SOFT" className="h-10 w-auto drop-shadow-[0_0_10px_rgba(255,122,0,0.35)]" />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {LIENS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-brand-500 transition-colors">{l.label}</a>
          ))}
        </nav>

        <div className="hidden md:flex items-center flex-1 max-w-xs ml-auto">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Rechercher…"
              className="w-full rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto md:ml-0">
          <ThemeToggle />
          <Link to="/login" className={buttonClasses({ variant: 'primary', size: 'sm', className: 'hidden sm:inline-flex' })}>
            Connexion
          </Link>
          <button className="lg:hidden text-slate-500" onClick={() => setMenuOuvert((v) => !v)}>
            {menuOuvert ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOuvert && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden border-t border-slate-100 dark:border-white/10"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {LIENS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMenuOuvert(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5">
                  {l.label}
                </a>
              ))}
              <Link to="/login" className={buttonClasses({ variant: 'primary', size: 'sm', className: 'mt-2 sm:hidden' })}>
                Connexion
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
