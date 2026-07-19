package com.sav.model;

import lombok.*;

/**
 * Réponse du chatbot SAV.
 * Si le chatbot estime qu'une intervention est nécessaire,
 * {@code creerIntervention} vaut true et {@code suggestionDescription} /
 * {@code suggestionPriorite} contiennent la proposition pré-remplie.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatbotResponse {

    /** Texte de la réponse affiché à l'utilisateur. */
    private String reponse;

    /** true si le chatbot propose de créer une demande d'intervention. */
    private boolean creerIntervention;

    /** Description pré-remplie de l'intervention proposée. */
    private String suggestionDescription;

    /** Priorité proposée : TRES_URGENT / URGENT / NORMAL / FACULTATIF. */
    private String suggestionPriorite;
}
