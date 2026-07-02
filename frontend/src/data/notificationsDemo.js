// ============================================================
// Données de démonstration — aucune API backend de notifications
// n'existe actuellement. Isolées ici pour un branchement futur trivial
// (remplacer l'import par un appel à un futur notificationService.js).
// ============================================================

export const NOTIFICATIONS_DEMO = [
  {
    id: 1,
    type: 'succes',
    titre: 'Intervention SAV-2026-000004 clôturée',
    description: "Le rapport technique et le prix final ont été enregistrés.",
    temps: 'Il y a 12 min',
    lue: false,
  },
  {
    id: 2,
    type: 'info',
    titre: 'Nouvelle intervention affectée',
    description: 'Une intervention urgente vous a été affectée par le directeur.',
    temps: 'Il y a 1 h',
    lue: false,
  },
  {
    id: 3,
    type: 'alerte',
    titre: 'Intervention en attente depuis 3 jours',
    description: "SAV-2026-000002 nécessite une pièce détachée avant de continuer.",
    temps: 'Il y a 3 h',
    lue: true,
  },
  {
    id: 4,
    type: 'info',
    titre: 'Nouveau client inscrit',
    description: 'Société Delta Industries a créé un compte.',
    temps: 'Hier',
    lue: true,
  },
  {
    id: 5,
    type: 'succes',
    titre: 'Objectif mensuel atteint',
    description: "L'équipe SAV a clôturé 42 interventions ce mois-ci.",
    temps: 'Il y a 2 jours',
    lue: true,
  },
];
