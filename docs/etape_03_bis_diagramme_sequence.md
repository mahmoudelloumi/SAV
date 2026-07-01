# Diagramme de Séquence (Scénario : Cycle de vie d'une intervention)

Ce diagramme de séquence illustre le scénario principal de l'application : de la création d'une demande par le client jusqu'à sa clôture par l'employé et la notification au client.

```mermaid
sequenceDiagram
    autonumber
    actor C as Client
    participant S as Système (API REST)
    participant DB as PostgreSQL (BDD)
    actor D as Directeur
    actor E as Employé SAV

    rect rgb(240, 248, 255)
    note right of C: 1. Création de la Demande
    C->>S: POST /api/interventions (Description, Priorité)
    S->>DB: Appeler fonction generer_code_intervention()
    DB-->>S: Retourne code (ex: SAV-2026-000001)
    S->>DB: INSERT Intervention (Etat = NOUVELLE)
    DB-->>S: Succès
    S-->>C: 201 Created (Intervention créée)
    S--)D: Envoi Notification e-mail (Nouvelle demande)
    end

    rect rgb(255, 250, 240)
    note right of D: 2. Affectation de l'Intervention
    D->>S: GET /api/interventions?etat=NOUVELLE
    S->>DB: SELECT interventions
    DB-->>S: Liste des interventions
    S-->>D: 200 OK (Liste)
    D->>S: PUT /api/interventions/{id}/affecter (employeId)
    S->>DB: UPDATE Intervention (Etat = AFFECTEE, employe_id)
    S->>DB: INSERT HistoriqueIntervention
    S->>DB: INSERT JournalAudit
    DB-->>S: Succès
    S-->>D: 200 OK (Affectation réussie)
    S--)E: Envoi Notification e-mail (Nouvelle affectation)
    S--)C: Envoi Notification e-mail (Intervention prise en charge)
    end

    rect rgb(245, 255, 250)
    note right of E: 3. Traitement par l'Employé
    E->>S: GET /api/interventions/mes-affectations
    S->>DB: SELECT interventions (employe_id)
    DB-->>S: Liste de ses interventions
    S-->>E: 200 OK (Liste)
    E->>S: PUT /api/interventions/{id}/etat (Etat = EN_COURS)
    S->>DB: UPDATE Intervention (Etat = EN_COURS)
    S->>DB: INSERT HistoriqueIntervention
    S-->>E: 200 OK
    end

    rect rgb(255, 240, 245)
    note right of E: 4. Clôture de l'Intervention
    E->>S: PUT /api/interventions/{id}/cloturer (Rapport, Prix)
    S->>DB: UPDATE Intervention (Etat = TERMINEE, Rapport, Prix, DateCloture)
    S->>DB: INSERT HistoriqueIntervention
    DB-->>S: Succès
    S->>S: Génération du Rapport en PDF
    S->>DB: INSERT PieceJointe (Lien PDF)
    S-->>E: 200 OK (Intervention clôturée)
    S--)C: Envoi Notification e-mail avec lien du PDF
    end

    rect rgb(248, 248, 255)
    note right of C: 5. Consultation par le Client
    C->>S: GET /api/interventions/{id}/pdf
    S->>DB: SELECT PieceJointe (Rapport PDF)
    DB-->>S: Informations Fichier
    S-->>C: 200 OK (Téléchargement PDF)
    end
```

## Description du Scénario

1. **Création** : Le client s'authentifie et crée une nouvelle demande. L'API génère automatiquement un code métier (`SAV-YYYY-NNNNNN`), enregistre l'intervention avec l'état `NOUVELLE` et informe le directeur de l'arrivée d'une nouvelle demande.
2. **Affectation** : Le directeur visualise la liste des nouvelles requêtes. Il décide d'en affecter une à un technicien spécifique. L'état passe à `AFFECTEE`. Tout est journalisé pour l'audit et le système notifie l'employé ainsi que le client.
3. **Traitement** : L'employé SAV consulte son planning/ses affectations. Lorsqu'il commence le travail, il modifie le statut à `EN_COURS`.
4. **Clôture** : Une fois la réparation/intervention terminée, l'employé remplit le rapport technique et définit le prix final. L'API valide ces prérequis, passe l'état à `TERMINEE`, déclenche la création d'un document PDF et avertit le client.
5. **Consultation** : Le client reçoit la notification et peut se connecter pour télécharger la version PDF du rapport de son intervention achevée.
