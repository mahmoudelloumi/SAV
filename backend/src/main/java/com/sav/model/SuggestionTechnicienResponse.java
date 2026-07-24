package com.sav.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Réponse de l'affectation intelligente : le technicien suggéré par l'IA
 * (selon charge et historique) + la liste des candidats évalués.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuggestionTechnicienResponse {

    /** Identifiant du technicien recommandé (null si aucun disponible). */
    private Long employeId;

    /** Nom complet du technicien recommandé. */
    private String employeNom;

    /** Justification courte du choix. */
    private String raison;

    /** Tous les techniciens évalués, avec leurs statistiques. */
    private List<Candidat> candidats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Candidat {
        private Long id;
        private String nom;
        private String specialite;
        private long chargeActive;
        private long interventionsTerminees;
        private boolean recommande;
    }
}
