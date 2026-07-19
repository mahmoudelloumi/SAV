package com.sav.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Requête envoyée au chatbot SAV : le nouveau message de l'utilisateur
 * accompagné de l'historique de la conversation (pour garder le contexte).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatbotRequest {

    @NotBlank(message = "Le message est obligatoire")
    @Size(max = 2000, message = "Le message ne doit pas dépasser 2000 caractères")
    private String message;

    /** Historique de la conversation (du plus ancien au plus récent). */
    @Builder.Default
    private List<MessageChat> historique = new ArrayList<>();

    /** Un message de la conversation : role = "user" ou "assistant". */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageChat {
        private String role;
        private String content;
    }
}
