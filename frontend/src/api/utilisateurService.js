import api from './client.js';

// ============================================================
// Appels liés aux utilisateurs (correspond à UtilisateurController).
// Réservé au rôle DIRECTEUR côté backend.
// ============================================================

// --- Employés ---

export function creerEmploye(employe) {
  return api.post('/utilisateurs/employes', employe);
}

export function getEmployeById(id) {
  return api.get(`/utilisateurs/employes/${id}`);
}

export function getTousEmployes(page = 0, size = 20) {
  return api.get('/utilisateurs/employes', { params: { page, size } });
}

export function modifierEmploye(id, employe) {
  return api.put(`/utilisateurs/employes/${id}`, employe);
}

export function supprimerEmploye(id) {
  return api.delete(`/utilisateurs/employes/${id}`);
}

// --- Clients ---

// Créer un client par le staff (mêmes coordonnées que l'inscription). Multipart :
// champs texte + document (facultatif). POST /utilisateurs/clients
export function creerClient(formData) {
  return api.post('/utilisateurs/clients', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function getClientById(id) {
  return api.get(`/utilisateurs/clients/${id}`);
}

// Récupère la pièce justificative du matricule fiscal (image/PDF) sous forme de blob.
export function getClientDocument(id) {
  return api.get(`/utilisateurs/clients/${id}/document`, { responseType: 'blob' });
}

export function getTousClients(page = 0, size = 20) {
  return api.get('/utilisateurs/clients', { params: { page, size } });
}

// Modifier un client (rôle DIRECTEUR). PUT /utilisateurs/clients/{id}
export function modifierClient(id, client) {
  return api.put(`/utilisateurs/clients/${id}`, client);
}

// Supprimer un client inactif (rôle DIRECTEUR). DELETE /utilisateurs/clients/{id}
export function supprimerClient(id) {
  return api.delete(`/utilisateurs/clients/${id}`);
}

// --- Commun ---

export function activerDesactiverCompte(id, actif) {
  return api.put(`/utilisateurs/${id}/statut`, null, { params: { actif } });
}

// --- Photo de profil ---

// Envoie une nouvelle photo de profil pour l'utilisateur connecté (multipart).
export function uploadPhotoProfil(fichier) {
  const formData = new FormData();
  formData.append('fichier', fichier);
  return api.post('/utilisateurs/me/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// Récupère la photo de profil d'un utilisateur sous forme de blob (nécessite le JWT).
export function getPhotoProfil(userId) {
  return api.get(`/utilisateurs/${userId}/photo`, { responseType: 'blob' });
}
