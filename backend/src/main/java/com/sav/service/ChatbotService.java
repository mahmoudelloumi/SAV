package com.sav.service;

import com.sav.model.ChatbotRequest;
import com.sav.model.ChatbotResponse;

/**
 * Service du chatbot d'assistance SAV (IA locale via Ollama).
 */
public interface ChatbotService {

    /**
     * Traite un message de l'utilisateur et retourne la réponse du chatbot,
     * avec éventuellement une proposition de création d'intervention.
     */
    ChatbotResponse repondre(ChatbotRequest request);

    /**
     * Assistant public (visiteurs non connectés) : création de compte, connexion,
     * coordonnées, adresse et disponibilité.
     */
    ChatbotResponse repondrePublic(ChatbotRequest request);

    /**
     * Assistant de données réservé au directeur : répond en langage naturel aux
     * questions sur les statistiques (CA total et par employé, nombre d'interventions
     * par employé…) et les coordonnées des clients et employés.
     */
    ChatbotResponse repondreAdmin(ChatbotRequest request);

    /**
     * Reformule la description d'un problème rédigée par le client de façon
     * claire et professionnelle (sans inventer d'information).
     */
    String ameliorerDescription(String texte);

    /**
     * Génère un rapport technique final professionnel à partir du problème signalé
     * ({@code description}) et des notes éventuelles du technicien ({@code notes}).
     */
    String genererRapportTechnique(String description, String notes);

    /**
     * Suggère, parmi une liste de techniciens candidats (déjà classés par pertinence),
     * le meilleur pour traiter une intervention, avec une courte justification.
     */
    SuggestionAffectation suggererTechnicien(String description, String priorite, java.util.List<TechnicienCandidat> candidats);

    /** Technicien candidat avec sa charge actuelle et son expérience. */
    record TechnicienCandidat(Long id, String nom, String specialite, long chargeActive, long interventionsTerminees) {}

    /** Résultat de la suggestion : identifiant du technicien retenu + justification. */
    record SuggestionAffectation(Long employeId, String raison) {}

    /**
     * Classe automatiquement un problème décrit par le client : détermine la
     * priorité et la catégorie technique les plus adaptées.
     */
    Classification classer(String description);

    /** Résultat de la classification automatique (valeurs des enums en String). */
    record Classification(String priorite, String categorie) {}
}
