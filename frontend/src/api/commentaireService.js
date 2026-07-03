import api from './client.js';

// ============================================================
// Appels liés à la messagerie d'une intervention (correspond à
// CommentaireController). Une conversation = une intervention.
// ============================================================

// Lister les messages d'une intervention (paginé, ordre chronologique).
// GET /interventions/{interventionId}/commentaires
export function getCommentaires(interventionId, page = 0, size = 50) {
  return api.get(`/interventions/${interventionId}/commentaires`, {
    params: { page, size, sort: 'dateCreation,asc' },
  });
}

// Envoyer un message sur une intervention. POST (texte brut).
// POST /interventions/{interventionId}/commentaires
export function ajouterCommentaire(interventionId, contenu) {
  return api.post(`/interventions/${interventionId}/commentaires`, contenu, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
