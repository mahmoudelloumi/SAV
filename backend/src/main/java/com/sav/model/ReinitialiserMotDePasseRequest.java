package com.sav.model;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Réinitialisation du mot de passe via le code TOTP (Google Authenticator).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReinitialiserMotDePasseRequest {

    @NotBlank(message = "L'email est obligatoire")
    private String email;

    @NotBlank(message = "Le code Google Authenticator est obligatoire")
    private String code;

    @NotBlank(message = "Le nouveau mot de passe est obligatoire")
    private String nouveauMotDePasse;
}
