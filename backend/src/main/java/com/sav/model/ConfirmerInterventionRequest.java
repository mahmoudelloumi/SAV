package com.sav.model;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Confirmation d'une intervention par le client (via le code reçu par e-mail).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfirmerInterventionRequest {

    @NotBlank(message = "Le code de l'intervention est obligatoire")
    private String codeIntervention;

    @NotBlank(message = "Le code de confirmation est obligatoire")
    private String codeConfirmation;
}
