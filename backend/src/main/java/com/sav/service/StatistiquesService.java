package com.sav.service;

import com.sav.model.StatistiquesResponse;

import java.time.LocalDateTime;

/**
 * Interface du service de statistiques pour le tableau de bord.
 */
public interface StatistiquesService {

    StatistiquesResponse getStatistiques();

    StatistiquesResponse getStatistiquesParPeriode(LocalDateTime debut, LocalDateTime fin);
}
