import api from './client.js';

// ============================================================
// Appels liés au chatbot SAV (correspond à ChatbotController).
// ============================================================

// Envoyer un message au chatbot. POST /chatbot/message
// historique : [{ role: 'user' | 'assistant', content: '...' }]
export function envoyerMessageChatbot(message, historique = []) {
  return api.post('/chatbot/message', { message, historique });
}

// Assistant public (visiteurs non connectés). POST /chatbot/public
export function envoyerMessageChatbotPublic(message, historique = []) {
  return api.post('/chatbot/public', { message, historique });
}

// Assistant de données du directeur (stats, CA/employés, coordonnées). POST /chatbot/admin
export function envoyerMessageChatbotAdmin(message, historique = []) {
  return api.post('/chatbot/admin', { message, historique });
}

// Reformuler une description de problème avec l'IA. POST /chatbot/ameliorer-description
export function ameliorerDescription(texte) {
  return api.post('/chatbot/ameliorer-description', { texte });
}

// Générer un rapport technique final avec l'IA (staff). POST /chatbot/rapport
// description : problème signalé ; notes : notes du technicien (facultatives).
export function genererRapport(description, notes = '') {
  return api.post('/chatbot/rapport', { description, notes });
}

// Classer automatiquement un problème : priorité + catégorie. POST /chatbot/classifier
// Renvoie { priorite, categorie }.
export function classifierProbleme(texte) {
  return api.post('/chatbot/classifier', { texte });
}
