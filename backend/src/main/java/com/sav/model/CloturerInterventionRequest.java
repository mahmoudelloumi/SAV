package com.sav.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * Commande de clôture d'une intervention (employé).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CloturerInterventionRequest {

    @NotBlank(message = "Le rapport technique est obligatoire")
    private String rapportTechnique;

    @NotNull(message = "Le prix final est obligatoire")
    private BigDecimal prixFinal;
}
