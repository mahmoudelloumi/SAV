import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import logo from '../../assets/logo_idsoft.png';

export default function Footer() {
  const annee = new Date().getFullYear();

  return (
    <footer id="contact" className="relative border-t border-slate-200/60 dark:border-white/10 bg-white dark:bg-dark-bg">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Marque */}
        <div className="sm:col-span-2 lg:col-span-1">
          <img src={logo} alt="ID SOFT" className="h-20 w-auto mb-4" />
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-w-xs">
            Plateforme de gestion des interventions SAV : suivi en temps réel, sécurité renforcée et statistiques avancées.
          </p>
          <div className="mt-5 flex gap-3">
            <SocialLink href="https://idsoft.tn/" label="Site web" icon={Globe} />
            <SocialLink href="https://www.facebook.com/ID2S.Software.Solutions" label="Facebook"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/></SocialLink>
            <SocialLink href="https://www.instagram.com/id2softwaresolutions/" label="Instagram"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.12 1.38C1.35 2.68.94 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.12.66.66 1.33 1.07 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.12-1.38.66-.66 1.07-1.33 1.38-2.12.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.31-.79-.72-1.46-1.38-2.12C21.32 1.35 20.65.94 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/></SocialLink>
          </div>
        </div>

        {/* Produit */}
        <div>
          <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-4">Produit</h4>
          <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
            <li><a href="#interventions" className="hover:text-brand-500 transition-colors">Interventions</a></li>
            <li><a href="#services" className="hover:text-brand-500 transition-colors">Services</a></li>
            <li><a href="#clients" className="hover:text-brand-500 transition-colors">Clients</a></li>
          </ul>
        </div>

        {/* Entreprise */}
        <div>
          <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-4">Entreprise</h4>
          <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
            <li><a href="#apropos" className="hover:text-brand-500 transition-colors">À propos</a></li>
            <li><a href="#contact" className="hover:text-brand-500 transition-colors">Contact</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <li className="flex items-center gap-2.5">
              <IconePastille icon={Mail} />
              <a href="mailto:id2softwaresolutions@gmail.com" className="hover:text-brand-500 transition-colors break-all">id2softwaresolutions@gmail.com</a>
            </li>
            <li className="flex items-start gap-2.5">
              <IconePastille icon={Phone} />
              <span className="flex flex-col gap-0.5">
                <a href="tel:+21652316703" className="hover:text-brand-500 transition-colors">+ (216) 52.316.703</a>
                <a href="tel:+21652316709" className="hover:text-brand-500 transition-colors">+ (216) 52.316.709</a>
                <a href="tel:+21652316807" className="hover:text-brand-500 transition-colors">+ (216) 52.316.807</a>
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <IconePastille icon={MapPin} />
              <a
                href="https://maps.app.goo.gl/rw7YZV3Qc5drncUr6"
                target="_blank"
                rel="noopener noreferrer"
                title="Voir sur Google Maps"
                className="leading-relaxed hover:text-brand-500 transition-colors"
              >
                <span className="whitespace-nowrap">Ariana Palace Immeuble, Bloc A, étage 5</span><br />
                Ave El-Bousten, Sfax, Tunisie
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-white/10 py-6 px-4 md:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {annee} ID Software Solutions — Gestion SAV. Tous droits réservés.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-brand-500 transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-brand-500 transition-colors">Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Petite pastille d'icône pour les lignes de contact.
function IconePastille({ icon: Icon }) {
  return (
    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-500">
      <Icon size={14} />
    </span>
  );
}

function SocialLink({ href, label, icon: Icon, children }) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      target="_blank"
      rel="noopener noreferrer"
      className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
    >
      {Icon ? (
        <Icon size={16} />
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          {children}
        </svg>
      )}
    </a>
  );
}
