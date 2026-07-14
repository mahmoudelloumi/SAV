import api from './client.js';

// ============================================================
// Appels liés à l'authentification (correspond à AuthController).
// ============================================================

// Inscription d'un nouveau client (multipart : champs + pièce jointe).
// POST /auth/inscription
export function inscription(formData) {
  // Content-Type à undefined : le navigateur pose lui-même la frontière multipart
  // (sinon le défaut application/json de client.js casserait l'envoi).
  return api.post('/auth/inscription', formData, { headers: { 'Content-Type': undefined } });
}

// Connexion étape 1 : email + mot de passe. POST /auth/connexion
export function connexion(email, motDePasse) {
  return api.post('/auth/connexion', { email, motDePasse });
}

// Étape 2 : génère le QR Code TOTP. POST /auth/2fa/setup?email=...
export function setupTotp(email) {
  return api.post('/auth/2fa/setup', null, { params: { email } });
}

// Étape 2 (alternative) : envoie un code de connexion par e-mail. POST /auth/2fa/email/send?email=
export function envoyerCodeEmail2fa(email) {
  return api.post('/auth/2fa/email/send', null, { params: { email } });
}

// Indique si le compte doit définir son mot de passe. GET /auth/statut-email?email=
export function statutEmail(email) {
  return api.get('/auth/statut-email', { params: { email } });
}

// Définit le mot de passe à la 1re connexion. POST /auth/definir-mot-de-passe
export function definirMotDePasse(email, code, nouveauMotDePasse) {
  return api.post('/auth/definir-mot-de-passe', { email, code, nouveauMotDePasse });
}

// Étape 3 : vérifie le code (Authenticator ou e-mail) et renvoie le token JWT. POST /auth/2fa/verify
export function verifyTotp(email, code) {
  return api.post('/auth/2fa/verify', { email, code });
}

// Mot de passe oublié — vérifie le code TOTP (étape 2). POST /auth/verifier-code
export function verifierCodeReinitialisation(email, code) {
  return api.post('/auth/verifier-code', { email, code });
}

// Mot de passe oublié : réinitialisation via le code Google Authenticator.
// POST /auth/mot-de-passe-oublie
export function reinitialiserMotDePasse(email, code, nouveauMotDePasse) {
  return api.post('/auth/mot-de-passe-oublie', { email, code, nouveauMotDePasse });
}
