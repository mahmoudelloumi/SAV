package com.sav.model;

import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Agrégat de statistiques (aucune correspondance en base : donnée calculée).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatistiquesResponse {

    private Map<String, Long> interventionsParEtat;
    private Map<String, Long> interventionsParPriorite;
    private BigDecimal chiffreAffairesTotal;
    private BigDecimal chiffreAffairesMoisCourant;
    private long totalInterventions;
    private long interventionsEnCours;
    private long interventionsTerminees;
    private Map<String, Long> evolutionMensuelle;
    // Évolution quotidienne (30 derniers jours), pour la vue « par jour ».
    private Map<String, Long> evolutionQuotidienne;
    private Map<String, Long> performanceEmployes;
    // Chiffre d'affaires généré par employé (somme des prix finaux des interventions terminées).
    private Map<String, BigDecimal> chiffreAffairesEmployes;
    // Évolution du chiffre d'affaires (somme des prix finaux, par période de clôture).
    private Map<String, BigDecimal> chiffreAffairesParMois;
    private Map<String, BigDecimal> chiffreAffairesParJour;
}
