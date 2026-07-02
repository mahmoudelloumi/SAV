package com.sav.model;

import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * Commande d'affectation d'une intervention à un employé (directeur).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AffecterInterventionRequest {

    @NotNull(message = "L'employé est obligatoire")
    private Long employeId;
}
