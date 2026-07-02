package com.sav.model;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Commande de changement d'état d'une intervention (employé).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangerEtatRequest {

    @NotBlank(message = "Le nouvel état est obligatoire")
    private String nouvelEtat;

    private String motif;
}
