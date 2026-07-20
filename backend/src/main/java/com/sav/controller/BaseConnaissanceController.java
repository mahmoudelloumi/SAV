package com.sav.controller;

import com.sav.model.BaseConnaissance;
import com.sav.service.BaseConnaissanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Gestion de la base de connaissances du chatbot (réservé au directeur).
 */
@RestController
@RequestMapping("/base-connaissance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DIRECTEUR')")
@Tag(name = "Base de connaissances", description = "FAQ / infos entreprise pour le chatbot")
public class BaseConnaissanceController {

    private final BaseConnaissanceService service;

    @GetMapping
    @Operation(summary = "Lister toutes les entrées de connaissance")
    public ResponseEntity<List<BaseConnaissance>> getToutes() {
        return ResponseEntity.ok(service.getToutes());
    }

    @PostMapping
    @Operation(summary = "Créer une entrée de connaissance")
    public ResponseEntity<BaseConnaissance> creer(@Valid @RequestBody BaseConnaissance entree) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.creer(entree));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier une entrée de connaissance")
    public ResponseEntity<BaseConnaissance> modifier(@PathVariable Long id, @Valid @RequestBody BaseConnaissance entree) {
        return ResponseEntity.ok(service.modifier(id, entree));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une entrée de connaissance")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        service.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
