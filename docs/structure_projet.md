# Structure du projet — Gestion SAV

Application Spring Boot 3.4.1 / Java 21 de gestion des interventions SAV.
Architecture **en couches** (layered) : chaque dossier a un rôle précis.
Le flux d'une requête suit toujours le même chemin :

```
Client HTTP
   │
   ▼
[Controller]  ──►  [Service]  ──►  [Repository]  ──►  Base de données (PostgreSQL)
   │                  │                 │
   │            règles métier      accès données
   ▼
[DTO]  ◄── converti par ──►  [Mapper]  ◄──►  [Entity]
```

---

## 1. Racine du projet

| Fichier / dossier | Rôle |
|---|---|
| `pom.xml` | Configuration Maven : dépendances, plugins, version Java. |
| `src/main/java` | Code source de l'application. |
| `src/main/resources` | Fichiers de configuration (`.yml`). |
| `src/test/java` | Tests automatisés. |
| `docs/` | Documentation (UML, cas d'utilisation, ce fichier…). |
| `jdk21/` | JDK 21 embarqué pour compiler/exécuter. |
| `target/` | Fichiers générés par Maven (compilation). **Ne pas modifier.** |

---

## 2. Code source — `src/main/java/com/sav/gestion`

Package racine. Ordre de lecture recommandé : de haut (entrée HTTP) vers bas (base de données).

### 2.1. `GestionSavApplication.java`
Point d'entrée de l'application (méthode `main`). Démarre Spring Boot.

### 2.2. `controller/` — Couche présentation (API REST)
Reçoit les requêtes HTTP, délègue au service, renvoie une réponse.

| Fichier | Responsabilité |
|---|---|
| `AuthController.java` | Authentification : inscription, connexion, 2FA (TOTP). |
| `InterventionController.java` | Gestion des interventions SAV (CRUD, changement d'état, affectation). |
| `UtilisateurController.java` | Gestion des utilisateurs / employés. |
| `StatistiquesController.java` | Statistiques et rapports (PDF). |

### 2.3. `dto/` — Objets de transfert de données
Structures échangées avec le client HTTP (jamais les entités directement).

- **`dto/request/`** — Données reçues du client (entrée) :
  `InscriptionClientRequest`, `ConnexionRequest`, `VerifyTotpRequest`,
  `CreerEmployeRequest`, `CreerInterventionRequest`, `AffecterInterventionRequest`,
  `ChangerEtatRequest`, `CloturerInterventionRequest`.
- **`dto/response/`** — Données renvoyées au client (sortie) :
  `AuthResponse`, `TotpResponse`, `ClientResponse`, `EmployeResponse`,
  `UtilisateurResponse`, `InterventionResponse`, `StatistiquesResponse`.

### 2.4. `entity/` — Couche modèle (tables de la base)
Classes JPA correspondant aux tables PostgreSQL.

| Fichier | Table / concept |
|---|---|
| `Utilisateur.java` | Compte de base (classe parente). |
| `Client.java` | Client (hérite d'Utilisateur). |
| `Employe.java` | Employé / technicien. |
| `Intervention.java` | Intervention SAV (cœur métier). |
| `Commentaire.java` | Commentaires sur une intervention. |
| `PieceJointe.java` | Fichiers attachés. |
| `HistoriqueIntervention.java` | Historique des changements d'état. |
| `HistoriqueConnexion.java` | Historique des connexions. |
| `JournalAudit.java` | Journal d'audit (traçabilité). |
| **`entity/enums/`** | Valeurs fixes : `Role`, `Priorite`, `EtatIntervention`. |

### 2.5. `repository/` — Couche accès aux données
Interfaces Spring Data JPA : requêtes vers la base sans SQL manuel.
Un repository par entité principale : `ClientRepository`, `EmployeRepository`,
`UtilisateurRepository`, `InterventionRepository`, `CommentaireRepository`,
`PieceJointeRepository`, `HistoriqueInterventionRepository`,
`HistoriqueConnexionRepository`, `JournalAuditRepository`.

### 2.6. `service/` — Couche métier (règles de gestion)
Contient la logique applicative. Séparation interface / implémentation :

- **Interfaces** (le contrat) : `AuthService`, `InterventionService`,
  `UtilisateurService`, `StatistiquesService`.
- **`service/impl/`** (le code réel) : `AuthServiceImpl`, `InterventionServiceImpl`,
  `UtilisateurServiceImpl`, `StatistiquesServiceImpl`.

> Cette séparation permet de changer l'implémentation sans toucher aux controllers.

### 2.7. `mapper/` — Conversion Entity ⇄ DTO
`EntityMapper.java` (MapStruct). Génère automatiquement le code de conversion
entre entités et DTO. L'implémentation `EntityMapperImpl` est générée dans `target/`.

### 2.8. `security/` — Sécurité
| Fichier | Rôle |
|---|---|
| `SecurityConfig.java` | Configuration Spring Security (filtres, routes protégées). |
| `JwtService.java` | Création / validation des tokens JWT. |
| `JwtAuthenticationFilter.java` | Filtre qui vérifie le JWT à chaque requête. |
| `TotpService.java` | Double authentification (Google Authenticator). |
| `UserDetailsImpl.java` | Adaptation de l'utilisateur pour Spring Security. |
| `UserDetailsServiceImpl.java` | Chargement de l'utilisateur depuis la base. |

### 2.9. `exception/` — Gestion des erreurs
| Fichier | Rôle |
|---|---|
| `GlobalExceptionHandler.java` | Capture centralisée des erreurs → réponses HTTP propres. |
| `BusinessException.java` | Erreur de règle métier. |
| `ResourceNotFoundException.java` | Ressource introuvable (404). |
| `DuplicateResourceException.java` | Doublon (ex. email déjà utilisé). |
| `InvalidStateTransitionException.java` | Transition d'état interdite. |

### 2.10. `util/` — Utilitaires
- `CodeInterventionGenerator.java` — Génère les codes d'intervention.
- `DataInitializer.java` — Insère les données initiales au démarrage.

---

## 3. Configuration — `src/main/resources`

| Fichier | Rôle |
|---|---|
| `application.yml` | Configuration commune (profil actif, etc.). |
| `application-dev.yml` | Profil développement (base locale). |
| `application-prod.yml` | Profil production. |

---

## 4. Tests — `src/test/java`

`GestionSavApplicationTests.java` — Test de démarrage du contexte Spring.

---

## Résumé : où mettre un nouveau fichier ?

| Je veux ajouter… | Dossier |
|---|---|
| Un nouvel endpoint HTTP | `controller/` |
| Une règle métier | `service/` + `service/impl/` |
| Une nouvelle table | `entity/` (+ `repository/`) |
| Un objet reçu/renvoyé par l'API | `dto/request/` ou `dto/response/` |
| Une nouvelle erreur gérée | `exception/` |
| Un outil réutilisable | `util/` |
