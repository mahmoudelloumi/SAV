import api from './client.js';

// ============================================================
// Appels liés aux statistiques (correspond à StatistiquesController).
// Réservé au rôle DIRECTEUR côté backend.
// ============================================================

export function getStatistiques() {
  return api.get('/statistiques');
}

// debut/fin : chaînes ISO (LocalDateTime), ex. "2026-01-01T00:00:00"
export function getStatistiquesParPeriode(debut, fin) {
  return api.get('/statistiques/periode', { params: { debut, fin } });
}
