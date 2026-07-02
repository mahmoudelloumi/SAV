# Frontend React — Gestion SAV

Interface web (React + Vite) connectée à l'API Spring Boot du projet.

## Prérequis

- Node.js 18+ (testé avec Node 24)
- Le **backend Spring Boot doit tourner** sur `http://localhost:8080/api`

## Démarrer en développement

```bash
cd frontend
npm install      # une seule fois
npm run dev      # démarre sur http://localhost:5173
```

Ouvrez ensuite http://localhost:5173 dans le navigateur.

> Le port `5173` est déjà autorisé par la configuration CORS du backend
> (voir `SecurityConfig.java`).

## Construire pour la production

```bash
npm run build    # génère le dossier dist/
npm run preview  # prévisualise le build
```

## Structure

```
src/
├── main.jsx              Point d'entrée React
├── App.jsx               Routage + barre de navigation
├── styles.css            Styles globaux
├── api/
│   ├── client.js             Axios + injection auto du token JWT
│   ├── authService.js        Appels /auth (connexion, 2FA, inscription)
│   └── interventionService.js Appels /interventions
├── context/
│   └── AuthContext.jsx   État de connexion (user + token)
├── components/
│   └── ProtectedRoute.jsx Protège les pages privées
└── pages/
    ├── Login.jsx         Connexion + double authentification (TOTP)
    ├── Register.jsx      Inscription client
    └── Dashboard.jsx     Liste des interventions (selon le rôle)
```

## Fonctionnement de la connexion (2FA)

1. **Identifiants** : email + mot de passe → `POST /auth/connexion`
2. **QR Code** (première fois) : affiché pour être scanné avec Google Authenticator
3. **Code** : code à 6 chiffres → `POST /auth/2fa/verify` → renvoie le token JWT

Le token est stocké dans `localStorage` et envoyé automatiquement dans
l'en-tête `Authorization: Bearer …` de chaque requête.

## Configuration

L'URL de l'API se règle dans le fichier `.env` :

```
VITE_API_URL=http://localhost:8080/api
```
