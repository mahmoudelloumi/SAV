package com.sav.model;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Demande de reformulation d'un texte (description d'intervention) par l'IA.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AmeliorerTexteRequest {

    @NotBlank(message = "Le texte est obligatoire")
    private String texte;
}
