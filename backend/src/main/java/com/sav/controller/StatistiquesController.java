package com.sav.controller;

import com.sav.model.StatistiquesResponse;
import com.sav.service.StatistiquesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * Contrôleur REST pour le tableau de bord et les statistiques.
 */
@RestController
@RequestMapping("/statistiques")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DIRECTEUR')")
@Tag(name = "Statistiques", description = "Tableau de bord et statistiques")
public class StatistiquesController {

    private final StatistiquesService statistiquesService;

    @GetMapping
    @Operation(summary = "Obtenir les statistiques globales")
    public ResponseEntity<StatistiquesResponse> getStatistiques() {
        return ResponseEntity.ok(statistiquesService.getStatistiques());
    }

    @GetMapping("/periode")
    @Operation(summary = "Obtenir les statistiques pour une période donnée")
    public ResponseEntity<StatistiquesResponse> getStatistiquesParPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return ResponseEntity.ok(statistiquesService.getStatistiquesParPeriode(debut, fin));
    }
}
