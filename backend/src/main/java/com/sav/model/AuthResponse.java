package com.sav.model;

import lombok.*;

/**
 * Réponse d'authentification (contient le token JWT après connexion complète).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String type = "Bearer";
    private Long userId;
    private String email;
    private String nom;
    private String prenom;
    private String role;
    private boolean twoFactorRequired;
    private boolean twoFactorActive;
}
