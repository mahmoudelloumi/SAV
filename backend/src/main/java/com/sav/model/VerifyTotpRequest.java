package com.sav.model;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Vérification du code TOTP (Google Authenticator).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyTotpRequest {

    @NotBlank(message = "L'email est obligatoire")
    private String email;

    @NotBlank(message = "Le code TOTP est obligatoire")
    private String code;
}
