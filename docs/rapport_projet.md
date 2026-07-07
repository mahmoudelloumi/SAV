# Rapport de projet - Application Gestion SAV

## 1. Presentation generale

Le projet **Gestion SAV** est une application web destinee a gerer les demandes
d'intervention du service apres-vente. Elle couvre le cycle complet d'une
intervention : creation par le client, affectation par le directeur, traitement
par un employe SAV, cloture, generation de rapport et consultation des
statistiques.

L'application est organisee en deux parties principales :

- un **backend Spring Boot** expose sous forme d'API REST ;
- un **frontend React/Vite** pour l'interface utilisateur.

La base de donnees cible est **PostgreSQL**. Le schema est gere actuellement par
Hibernate avec `spring.jpa.hibernate.ddl-auto=update`.

## 2. Objectifs du projet

Les objectifs principaux sont :

- centraliser les demandes d'intervention SAV ;
- permettre aux clients de creer et suivre leurs demandes ;
- permettre aux employes SAV de traiter les interventions affectees ;
- permettre au directeur de gerer les employes, clients, affectations et
  statistiques ;
- securiser l'acces a l'application avec JWT, roles et double authentification
  TOTP ;
- fournir des rapports et indicateurs de pilotage.

## 3. Acteurs du systeme

### Client

Le client peut creer un compte, se connecter, activer la double authentification,
creer une demande d'intervention, ajouter des pieces jointes, suivre l'etat de
ses demandes et consulter les rapports finaux.

### Employe SAV

L'employe SAV consulte les interventions qui lui sont affectees, accepte une
intervention, change son etat, ajoute des commentaires, renseigne le rapport
technique, ajoute les prix et cloture l'intervention.

### Directeur

Le directeur administre l'application. Il gere les employes, consulte les clients,
affecte les interventions, annule ou priorise les demandes et consulte les
statistiques globales.

## 4. Fonctionnalites principales

### Authentification et securite

- inscription client avec documents et informations fiscales ;
- connexion par email et mot de passe ;
- generation et validation de tokens JWT ;
- double authentification TOTP ;
- gestion des roles `CLIENT`, `EMPLOYE_SAV` et `DIRECTEUR` ;
- routes frontend protegees selon le role.

### Gestion des utilisateurs

- creation, consultation, modification et suppression logique des employes ;
- consultation des clients ;
- activation ou desactivation de comptes ;
- gestion de la photo de profil.

### Gestion des interventions

- creation de demandes d'intervention ;
- generation automatique d'un code SAV ;
- consultation par id, code, client, employe ou etat ;
- affectation a un employe ;
- modification de priorite ;
- changement d'etat selon un cycle controle ;
- ajout de rapport technique et prix ;
- cloture d'intervention ;
- envoi de rapport ;
- gestion des pieces jointes.

### Commentaires

Les utilisateurs autorises peuvent ajouter et consulter des commentaires lies a
une intervention, ce qui facilite le suivi technique.

### Statistiques

Le module statistiques fournit une vision de pilotage : repartition par etat,
repartition par priorite, chiffre d'affaires et indicateurs par periode.

## 5. Architecture technique

### Backend

Le backend est developpe avec :

- Java 21 ;
- Spring Boot 3.4.1 ;
- Spring Web pour l'API REST ;
- Spring Data JPA et Hibernate pour la persistance ;
- Spring Security pour la securite ;
- PostgreSQL comme base relationnelle ;
- JWT avec `jjwt` ;
- TOTP pour la double authentification ;
- iText pour la generation PDF ;
- Spring Mail pour l'envoi d'emails ;
- Lombok pour reduire le code repetitif.

L'architecture backend est organisee en couches :

- `controller` : expose les endpoints REST ;
- `service` : porte la logique metier ;
- `repository` : gere l'acces aux donnees ;
- `model` : contient les entites JPA et objets de requete/reponse ;
- `security` : gere JWT, TOTP et Spring Security ;
- `exception` : centralise les erreurs applicatives ;
- `config` : contient l'initialisation et la configuration.

### Frontend

Le frontend est developpe avec :

- React 18 ;
- Vite ;
- React Router ;
- Axios ;
- Tailwind CSS ;
- Recharts pour les graphiques ;
- Lucide React pour les icones ;
- Framer Motion pour certaines animations.

Le frontend contient :

- des pages publiques : accueil, connexion, inscription ;
- un espace applicatif protege sous `/app` ;
- des tableaux de bord selon le role ;
- des pages pour interventions, clients, employes, statistiques, notifications,
  messagerie et parametres ;
- un client API centralise avec ajout automatique du token JWT.

## 6. Modele de donnees

Les principales entites sont :

- `Utilisateur` : classe mere des utilisateurs ;
- `Client` : informations client, matricule fiscal, RNE ;
- `Employe` : informations employe et specialite ;
- `Intervention` : coeur metier de l'application ;
- `Commentaire` : echanges autour d'une intervention ;
- `PieceJointe` : fichiers associes aux interventions ;
- `HistoriqueIntervention` : suivi des modifications ;
- `HistoriqueConnexion` : historique des connexions ;
- `JournalAudit` : tracabilite des actions.

La relation principale est la suivante : un client cree des interventions, un
employe peut etre affecte a plusieurs interventions, et chaque intervention peut
avoir plusieurs commentaires, pieces jointes et historiques.

## 7. Cycle de vie d'une intervention

Le cycle de vie actuel inclut les etats suivants :

- `NOUVELLE` ;
- `AFFECTEE` ;
- `ACCEPTEE` ;
- `EN_ATTENTE` ;
- `EN_COURS` ;
- `TERMINEE` ;
- `ANNULEE`.

Les transitions sont controlees cote backend et reprises cote frontend afin de
ne proposer a l'utilisateur que les actions autorisees.

## 8. Configuration et demarrage

### Backend

Commande :

```bash
cd backend
mvn spring-boot:run
```

API :

- `http://localhost:8080/api`
- Swagger : `http://localhost:8080/api/swagger-ui.html`

Variables importantes :

- `DATABASE_URL`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `JWT_SECRET`
- `MAIL_HOST`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `UPLOAD_DIR`

### Frontend

Commandes :

```bash
cd frontend
npm install
npm run dev
```

Interface :

- `http://localhost:5173`

## 9. Etat de verification

### Frontend

La commande `npm.cmd run build` a reussi. Le build Vite genere le dossier
`dist`. Une alerte signale toutefois que le bundle JavaScript principal depasse
500 kB apres minification, ce qui peut etre ameliore avec du code splitting.

### Backend

La commande `mvn test` ne va pas jusqu'au bout dans l'environnement actuel. La
compilation principale est a jour, mais l'execution des tests echoue car Maven
utilise une version de Java trop ancienne pour executer une classe compilee avec
Java 21. Le message indique :

`class file version 65.0`, alors que le runtime utilise reconnait seulement
jusqu'a `52.0`.

Il faut donc lancer Maven avec le JDK 21 fourni dans le projet ou configurer
correctement `JAVA_HOME`.

## 10. Points forts

- architecture claire separee entre backend et frontend ;
- gestion des roles et des routes protegees ;
- couverture fonctionnelle large autour du cycle SAV ;
- documentation deja presente dans `docs` ;
- modele metier coherent avec les besoins ;
- generation de PDF et envoi email prevus ;
- interface riche avec tableaux de bord et graphiques.

## 11. Points a ameliorer

- corriger l'encodage de certains fichiers Markdown existants, car plusieurs
  accents apparaissent mal ;
- eviter de conserver des mots de passe ou secrets reels dans
  `application.yml` ;
- harmoniser la documentation avec le code actuel : la documentation mentionne
  parfois `entity`, `dto` ou `mapper`, alors que le code utilise principalement
  `model` ;
- ajouter des tests unitaires et d'integration plus complets ;
- configurer un JDK 21 stable pour Maven ;
- envisager Flyway ou Liquibase pour gerer les migrations SQL en production ;
- reduire la taille du bundle frontend avec des imports dynamiques.

## 12. Conclusion

Le projet **Gestion SAV** est une application web complete pour la gestion des
interventions apres-vente. Il combine une API Spring Boot securisee, une base
PostgreSQL et une interface React moderne. Le coeur fonctionnel est bien defini :
gestion des comptes, interventions, affectations, etats, pieces jointes,
statistiques et rapports.

Le projet est dans un etat avance et exploitable pour une demonstration. Les
principales actions restantes concernent la stabilisation technique, la securite
de configuration, l'ajout de tests et l'amelioration de la documentation.
