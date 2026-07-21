import { Navigate, Link } from 'react-router-dom';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  ArrowRight, ShieldCheck, Wrench, BarChart3, Users, Zap, Clock, ImageIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import PublicNavbar from '../../components/layout/PublicNavbar.jsx';
import Footer from '../../components/layout/Footer.jsx';
import Card from '../../components/ui/Card.jsx';
import Button, { buttonClasses } from '../../components/ui/Button.jsx';
import ChatbotPublicWidget from '../../components/chatbot/ChatbotPublicWidget.jsx';

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <PublicNavbar />
      <Hero />
      <FeaturesSection />
      <Footer />
      <ChatbotPublicWidget />
    </div>
  );
}

function Hero() {
  return (
    <section id="accueil" className="relative overflow-hidden pt-10 pb-20 px-4 md:px-8">
      <FondAbstrait />

      <div className="relative mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400"
          >
            <Zap size={14} /> Plateforme SAV nouvelle génération
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] text-slate-900 dark:text-white"
          >
            Le service après-vente,{' '}
            <span className="bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent">
              enfin maîtrisé.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-lg text-slate-500 dark:text-slate-400 max-w-lg"
          >
            ID SOFT centralise vos interventions SAV, connecte clients, techniciens et
            direction en temps réel, et sécurise vos accès avec une authentification à deux facteurs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6 flex flex-wrap gap-4"
          >
            <Link to="/register" className={buttonClasses({ variant: 'primary', size: 'lg' })}>
              Créer un compte <ArrowRight size={18} className="ml-1" />
            </Link>
            <Link to="/login" className={buttonClasses({ variant: 'outline', size: 'lg' })}>
              Se connecter
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid grid-cols-3 gap-6 max-w-md"
          >
            <StatAnime valeur={500} suffix="+" label="Interventions traitées" />
            <StatAnime valeur={98} suffix="%" label="Satisfaction client" />
            <StatAnime valeur={24} suffix="/7" label="Suivi en continu" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative hidden lg:block"
        >
          <ImageApp
            src="/images/hero-app.png"
            alt="Aperçu de l'application ID SOFT"
            className="rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-2xl shadow-brand-500/10"
            ratio="h-[480px]"
          />
          {/* Cartes animées superposées pour l'effet premium */}
          <CartesFlottantes />
        </motion.div>
      </div>
    </section>
  );
}

function StatAnime({ valeur, suffix, label }) {
  const spring = useSpring(0, { stiffness: 60, damping: 18 });
  const affichee = useTransform(spring, (v) => Math.round(v));

  useEffect(() => { spring.set(valeur); }, [valeur, spring]);

  return (
    <div>
      <p className="font-display text-3xl font-bold text-slate-900 dark:text-white">
        <motion.span>{affichee}</motion.span>{suffix}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function CartesFlottantes() {
  return (
    <>
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-40 left-4 w-64"
      >
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 dark:bg-emerald-500/15 p-2.5 text-emerald-500"><ShieldCheck size={20} /></div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Intervention clôturée</p>
              <p className="text-xs text-slate-400">SAV-2026-000042</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        animate={{ y: [0, 14, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute top-20 right-5 w-72"
      >
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Interventions ce mois</p>
            <BarChart3 size={16} className="text-brand-500" />
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {[40, 65, 50, 80, 60, 95, 70].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-brand-500 to-brand-300" style={{ height: `${h}%` }} />
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-2 left-16 w-60"
      >
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-100 dark:bg-brand-500/15 p-2.5 text-brand-500"><Users size={20} /></div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">+12 nouveaux clients</p>
              <p className="text-xs text-slate-400">Cette semaine</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </>
  );
}

// Image d'application avec fallback "placeholder" tant que le fichier n'existe pas.
function ImageApp({ src, alt, className = '', ratio = 'aspect-video' }) {
  const [erreur, setErreur] = useState(false);

  if (erreur) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 w-full ${ratio} bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 ${className}`}>
        <ImageIcon size={40} strokeWidth={1.5} />
        <span className="text-xs font-medium">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErreur(true)}
      className={`w-full ${ratio} object-cover ${className}`}
    />
  );
}

function FondAbstrait() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-brand-500/15 blur-3xl" />
      <div className="absolute top-1/2 -left-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-landing" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-landing)" />
      </svg>
    </div>
  );
}

const FONCTIONNALITES = [
  { icon: Wrench, titre: 'Suivi en temps réel', texte: 'Chaque intervention est tracée de la création à la clôture, avec un historique complet.' },
  { icon: ShieldCheck, titre: 'Sécurité renforcée', texte: 'Authentification JWT et double facteur (TOTP) pour protéger les comptes clients.' },
  { icon: Users, titre: 'Gestion multi-rôles', texte: 'Client, employé SAV et directeur disposent chacun d\'un espace adapté à leurs besoins.' },
  { icon: BarChart3, titre: 'Statistiques avancées', texte: 'Chiffre d\'affaires, performance des équipes et évolution mensuelle en un coup d\'œil.' },
  { icon: Clock, titre: 'Réactivité maximale', texte: 'Priorisation des interventions urgentes et notifications instantanées.' },
  { icon: Zap, titre: 'Interface premium', texte: 'Une expérience fluide, moderne et responsive sur tous vos appareils.' },
];

function FeaturesSection() {
  return (
    <section id="services" className="py-24 px-4 md:px-8 bg-slate-50/60 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            Tout ce dont votre équipe SAV a besoin
          </h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400">
            Une plateforme unique pour piloter l'ensemble du cycle de vie de vos interventions.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FONCTIONNALITES.map((f, i) => (
            <Card key={f.titre} hover className="p-6" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-3 w-fit text-white shadow-glow mb-4">
                <f.icon size={22} />
              </div>
              <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white mb-2">{f.titre}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{f.texte}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
