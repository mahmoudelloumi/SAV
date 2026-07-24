// ============================================================
// Source unique de vérité pour les valeurs métier SAV : elles doivent
// correspondre EXACTEMENT aux enums Java du backend (voir
// backend/src/main/java/com/sav/model/enums/{Priorite,EtatIntervention}.java).
// ============================================================

export const PRIORITES = ['TRES_URGENT', 'URGENT', 'NORMAL', 'FACULTATIF'];

export const LIBELLES_PRIORITE = {
  TRES_URGENT: 'Très urgent',
  URGENT: 'Urgent',
  NORMAL: 'Normal',
  FACULTATIF: 'Facultatif',
};

// Classes Tailwind par priorité (fond/texte, variantes clair+sombre).
export const COULEURS_PRIORITE = {
  TRES_URGENT: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  URGENT: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  NORMAL: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  FACULTATIF: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400',
};

// Catégories techniques (miroir de enums/CategorieIntervention.java).
export const CATEGORIES = ['LOGICIEL', 'MATERIEL', 'RESEAU', 'INSTALLATION', 'MAINTENANCE', 'AUTRE'];

export const LIBELLES_CATEGORIE = {
  LOGICIEL: 'Logiciel',
  MATERIEL: 'Matériel',
  RESEAU: 'Réseau',
  INSTALLATION: 'Installation',
  MAINTENANCE: 'Maintenance',
  AUTRE: 'Autre',
};

export const COULEURS_CATEGORIE = {
  LOGICIEL: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  MATERIEL: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  RESEAU: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
  INSTALLATION: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
  MAINTENANCE: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  AUTRE: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400',
};

export const ETATS = [
  'NOUVELLE',
  'AFFECTEE',
  'ACCEPTEE',
  'EN_ATTENTE',
  'EN_COURS',
  'TERMINEE',
  'ANNULEE',
];

export const LIBELLES_ETAT = {
  NOUVELLE: 'Nouvelle',
  AFFECTEE: 'Affectée',
  ACCEPTEE: 'Acceptée',
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

export const COULEURS_ETAT = {
  NOUVELLE: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  AFFECTEE: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  ACCEPTEE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
  EN_ATTENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  EN_COURS: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  TERMINEE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  ANNULEE: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

// Transitions d'état autorisées (miroir de InterventionServiceImpl.TRANSITIONS_AUTORISEES)
// — utilisé pour ne proposer côté UI que les changements d'état valides.
export const TRANSITIONS_AUTORISEES = {
  NOUVELLE: ['AFFECTEE', 'ANNULEE'],
  AFFECTEE: ['ACCEPTEE', 'ANNULEE'],
  ACCEPTEE: ['EN_COURS', 'EN_ATTENTE', 'ANNULEE'],
  EN_ATTENTE: ['EN_COURS', 'ANNULEE'],
  EN_COURS: ['TERMINEE', 'EN_ATTENTE'],
  TERMINEE: [],
  ANNULEE: [],
};

// Menu latéral affiché selon le rôle de l'utilisateur connecté.
// `icon` référence une clé du mapping défini dans components/layout/Sidebar.jsx.
export const MENU_PAR_ROLE = {
  CLIENT: [
    { label: 'Tableau de bord', icon: 'LayoutDashboard', path: '/app' },
    { label: 'Mes interventions', icon: 'Wrench', path: '/app/interventions' },
    { label: 'Notifications', icon: 'Bell', path: '/app/notifications' },
    { label: 'Messagerie', icon: 'MessageSquare', path: '/app/messagerie' },
    { label: 'Paramètres', icon: 'Settings', path: '/app/parametres' },
  ],
  EMPLOYE_SAV: [
    { label: 'Tableau de bord', icon: 'LayoutDashboard', path: '/app' },
    { label: 'Interventions', icon: 'Wrench', path: '/app/interventions' },
    { label: 'Clients', icon: 'Users', path: '/app/clients' },
    { label: 'Notifications', icon: 'Bell', path: '/app/notifications' },
    { label: 'Messagerie', icon: 'MessageSquare', path: '/app/messagerie' },
    { label: 'Paramètres', icon: 'Settings', path: '/app/parametres' },
  ],
  DIRECTEUR: [
    { label: 'Tableau de bord', icon: 'LayoutDashboard', path: '/app' },
    { label: 'Interventions', icon: 'Wrench', path: '/app/interventions' },
    { label: 'Clients', icon: 'Users', path: '/app/clients' },
    { label: 'Employés', icon: 'UserCog', path: '/app/employes' },
    { label: 'Base de connaissances', icon: 'BookOpen', path: '/app/base-connaissances' },
    { label: 'Statistiques', icon: 'BarChart3', path: '/app/statistiques' },
    { label: 'Notifications', icon: 'Bell', path: '/app/notifications' },
    { label: 'Messagerie', icon: 'MessageSquare', path: '/app/messagerie' },
    { label: 'Paramètres', icon: 'Settings', path: '/app/parametres' },
  ],
};

export const LIBELLES_ROLE = {
  CLIENT: 'Client',
  EMPLOYE_SAV: 'Employé SAV',
  DIRECTEUR: 'Directeur',
};
