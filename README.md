# Gestion SAV

Application de gestion des interventions SAV (service après-vente) : suivi des
demandes d'intervention, affectation aux techniciens, cycle de vie complet
(création → affectation → acceptation → traitement → clôture), authentification
sécurisée (JWT + double authentification TOTP) et tableau de bord statistiques.

## Structure du projet

```
SAV/
├── backend/     Spring Boot 3 (Java 21) — API REST
├── frontend/    React (Vite) — interface web
├── database/    Notes sur le schéma (géré par Hibernate, pas de scripts SQL)
└── docs/        Diagrammes et documents de conception
```

## Démarrage rapide

### Backend

```bash
cd backend
mvn spring-boot:run
```

API disponible sur `http://localhost:8080/api`, documentation Swagger sur
`http://localhost:8080/api/swagger-ui.html`.

Configuration dans `backend/src/main/resources/application.yml` (variables
d'environnement avec valeurs par défaut pour le développement local — voir le
fichier pour la liste complète : `DATABASE_URL`, `DATABASE_USERNAME`,
`DATABASE_PASSWORD`, `JWT_SECRET`, etc.).

Un compte Directeur par défaut est créé automatiquement au premier démarrage
si la base est vide : `admin@sav.com` / `Admin@123`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Interface disponible sur `http://localhost:5173`.

## Rôles utilisateurs

- **Client** : crée des demandes d'intervention, suit leur avancement.
- **Employé SAV** : traite les interventions qui lui sont affectées.
- **Directeur** : gère les employés, affecte les interventions, consulte les statistiques.
