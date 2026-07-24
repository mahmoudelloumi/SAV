import api from './client.js';

// ============================================================
// Appels liés aux interventions (correspond à InterventionController).
// ============================================================

// Créer une intervention (rôle CLIENT). POST /interventions
export function creerIntervention(data) {
  return api.post('/interventions', data);
}

// Créer une intervention pour un client (employé/directeur). POST /interventions/staff
// data : { clientId?, raisonSociale?, prenom?, nom?, email?, telephone?, description, priorite }
export function creerInterventionStaff(data) {
  return api.post('/interventions/staff', data);
}

// Confirmer une intervention via le code reçu par email (public). POST /interventions/confirmer
export function confirmerIntervention(codeIntervention, codeConfirmation) {
  return api.post('/interventions/confirmer', { codeIntervention, codeConfirmation });
}

// Renvoyer par email le code de confirmation. POST /interventions/{id}/renvoyer-code
export function renvoyerCodeConfirmation(id) {
  return api.post(`/interventions/${id}/renvoyer-code`);
}

// Consulter une intervention par ID. GET /interventions/{id}
export function getInterventionById(id) {
  return api.get(`/interventions/${id}`);
}

// Envoyer le rapport de clôture (PDF) par e-mail au client. POST /interventions/{id}/envoyer-rapport
export function envoyerRapport(id) {
  return api.post(`/interventions/${id}/envoyer-rapport`);
}

// --- Pièces jointes (photos) ---

// Joindre une ou plusieurs photos à une intervention (multipart).
export function ajouterPiecesJointes(interventionId, fichiers) {
  const formData = new FormData();
  fichiers.forEach((f) => formData.append('fichiers', f));
  return api.post(`/interventions/${interventionId}/pieces-jointes`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// Lister les pièces jointes d'une intervention.
export function getPiecesJointes(interventionId) {
  return api.get(`/interventions/${interventionId}/pieces-jointes`);
}

// Récupérer le contenu d'une pièce jointe sous forme de blob (nécessite le JWT).
export function getContenuPieceJointe(pieceId) {
  return api.get(`/interventions/pieces-jointes/${pieceId}/contenu`, { responseType: 'blob' });
}

// Consulter une intervention par code SAV. GET /interventions/code/{code}
export function getInterventionByCode(code) {
  return api.get(`/interventions/code/${code}`);
}

// Interventions d'un client (paginé). GET /interventions/client/{clientId}
export function getInterventionsParClient(clientId, page = 0, size = 20, sort = 'dateCreation,desc') {
  return api.get(`/interventions/client/${clientId}`, { params: { page, size, sort } });
}

// Toutes les interventions (rôle DIRECTEUR, paginé). GET /interventions
export function getToutesInterventions(page = 0, size = 20, sort = 'dateCreation,desc') {
  return api.get('/interventions', { params: { page, size, sort } });
}

// Interventions affectées à un employé. GET /interventions/employe/{employeId}
export function getInterventionsParEmploye(employeId, page = 0, size = 20, sort = 'dateCreation,desc') {
  return api.get(`/interventions/employe/${employeId}`, { params: { page, size, sort } });
}

// Interventions filtrées par état (DIRECTEUR/EMPLOYE_SAV). GET /interventions/etat/{etat}
export function getInterventionsParEtat(etat, page = 0, size = 20, sort = 'dateCreation,desc') {
  return api.get(`/interventions/etat/${etat}`, { params: { page, size, sort } });
}

// --- Actions Directeur ---

// Affecter une intervention à un employé. PUT /interventions/{id}/affecter
export function affecterIntervention(id, employeId) {
  return api.put(`/interventions/${id}/affecter`, { employeId });
}

// Affectation intelligente : l'IA suggère le meilleur technicien (charge + historique).
// GET /interventions/{id}/suggestion-technicien
export function suggererTechnicien(id) {
  return api.get(`/interventions/${id}/suggestion-technicien`);
}

// Modifier la priorité. PUT /interventions/{id}/priorite?nouvellePriorite=
export function modifierPriorite(id, nouvellePriorite) {
  return api.put(`/interventions/${id}/priorite`, null, { params: { nouvellePriorite } });
}

// Annuler une intervention. PUT /interventions/{id}/annuler?motif=
export function annulerIntervention(id, motif) {
  return api.put(`/interventions/${id}/annuler`, null, { params: { motif } });
}

// --- Actions Employé ---

// Prendre en charge une nouvelle intervention (auto-affectation).
// PUT /interventions/{id}/prendre-en-charge
export function prendreEnCharge(id) {
  return api.put(`/interventions/${id}/prendre-en-charge`);
}

// Accepter une intervention affectée. PUT /interventions/{id}/accepter
export function accepterIntervention(id) {
  return api.put(`/interventions/${id}/accepter`);
}

// Changer l'état. PUT /interventions/{id}/etat, body { nouvelEtat, motif }
export function changerEtat(id, nouvelEtat, motif) {
  return api.put(`/interventions/${id}/etat`, { nouvelEtat, motif });
}

// Ajouter/mettre à jour le rapport technique. PUT /interventions/{id}/rapport (texte brut)
export function ajouterRapport(id, rapport) {
  return api.put(`/interventions/${id}/rapport`, rapport, {
    headers: { 'Content-Type': 'text/plain' },
  });
}

// Modifier le prix estimé/final. PUT /interventions/{id}/prix?prixEstime=&prixFinal=
export function modifierPrix(id, prixEstime, prixFinal) {
  return api.put(`/interventions/${id}/prix`, null, { params: { prixEstime, prixFinal } });
}

// Clôturer une intervention. PUT /interventions/{id}/cloturer, body { rapportTechnique, prixFinal }
export function cloturerIntervention(id, rapportTechnique, prixFinal) {
  return api.put(`/interventions/${id}/cloturer`, { rapportTechnique, prixFinal });
}
