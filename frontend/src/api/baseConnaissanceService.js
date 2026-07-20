import api from './client.js';

// ============================================================
// Base de connaissances du chatbot (réservé au directeur).
// Correspond à BaseConnaissanceController (/base-connaissance).
// ============================================================

export function getToutesConnaissances() {
  return api.get('/base-connaissance');
}

export function creerConnaissance(entree) {
  return api.post('/base-connaissance', entree);
}

export function modifierConnaissance(id, entree) {
  return api.put(`/base-connaissance/${id}`, entree);
}

export function supprimerConnaissance(id) {
  return api.delete(`/base-connaissance/${id}`);
}
