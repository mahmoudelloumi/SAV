package com.sav.controller;

import com.sav.model.*;
import com.sav.service.InterventionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

/**
 * Contrôleur REST pour la gestion des interventions SAV.
 */
@RestController
@RequestMapping("/interventions")
@RequiredArgsConstructor
@Tag(name = "Interventions", description = "Gestion des interventions SAV")
public class InterventionController {

    private final InterventionService interventionService;

    // ========== CRÉATION (Client) ==========

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Créer une nouvelle demande d'intervention")
    public ResponseEntity<Intervention> creerIntervention(
            @Valid @RequestBody Intervention intervention,
            @RequestAttribute("userId") Long clientId) {
        Intervention response = interventionService.creerIntervention(intervention, clientId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/staff")
    @PreAuthorize("hasRole('EMPLOYE_SAV') or hasRole('DIRECTEUR')")
    @Operation(summary = "Créer une intervention pour un client (employé/directeur)")
    public ResponseEntity<Intervention> creerInterventionParStaff(
            @Valid @RequestBody CreerInterventionStaffRequest request,
            @RequestAttribute("userId") Long userId) {
        Intervention response = interventionService.creerInterventionParStaff(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/confirmer")
    @Operation(summary = "Confirmer une intervention via le code reçu par e-mail (public)")
    public ResponseEntity<Void> confirmerIntervention(@Valid @RequestBody ConfirmerInterventionRequest request) {
        interventionService.confirmerIntervention(request.getCodeIntervention(), request.getCodeConfirmation());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/renvoyer-code")
    @Operation(summary = "Renvoyer par e-mail le code de confirmation d'une intervention")
    public ResponseEntity<Void> renvoyerCodeConfirmation(@PathVariable Long id) {
        interventionService.renvoyerCodeConfirmation(id);
        return ResponseEntity.ok().build();
    }

    // ========== CONSULTATION ==========

    @GetMapping("/{id}")
    @Operation(summary = "Consulter une intervention par ID")
    public ResponseEntity<Intervention> getInterventionById(@PathVariable Long id) {
        return ResponseEntity.ok(interventionService.getInterventionById(id));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Consulter une intervention par code SAV")
    public ResponseEntity<Intervention> getInterventionByCode(@PathVariable String code) {
        return ResponseEntity.ok(interventionService.getInterventionByCode(code));
    }

    @GetMapping
    @PreAuthorize("hasRole('DIRECTEUR')")
    @Operation(summary = "Consulter toutes les interventions (Directeur)")
    public ResponseEntity<Page<Intervention>> getToutesInterventions(
            @PageableDefault(size = 20, sort = "dateCreation") Pageable pageable) {
        return ResponseEntity.ok(interventionService.getToutesInterventions(pageable));
    }

    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('DIRECTEUR')")
    @Operation(summary = "Consulter les interventions d'un client")
    public ResponseEntity<Page<Intervention>> getInterventionsParClient(
            @PathVariable Long clientId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(interventionService.getInterventionsParClient(clientId, pageable));
    }

    @GetMapping("/employe/{employeId}")
    @PreAuthorize("hasRole('EMPLOYE_SAV') or hasRole('DIRECTEUR')")
    @Operation(summary = "Consulter les interventions affectées à un employé")
    public ResponseEntity<Page<Intervention>> getInterventionsParEmploye(
            @PathVariable Long employeId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(interventionService.getInterventionsParEmploye(employeId, pageable));
    }

    @GetMapping("/etat/{etat}")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('EMPLOYE_SAV')")
    @Operation(summary = "Filtrer les interventions par état")
    public ResponseEntity<Page<Intervention>> getInterventionsParEtat(
            @PathVariable String etat,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(interventionService.getInterventionsParEtat(etat, pageable));
    }

    // ========== ACTIONS DIRECTEUR ==========

    @PutMapping("/{id}/affecter")
    @PreAuthorize("hasRole('DIRECTEUR')")
    @Operation(summary = "Affecter une intervention à un employé")
    public ResponseEntity<Intervention> affecterIntervention(
            @PathVariable Long id,
            @Valid @RequestBody AffecterInterventionRequest request,
            @RequestAttribute("userId") Long directeurId) {
        return ResponseEntity.ok(interventionService.affecterIntervention(id, request, directeurId));
    }

    @GetMapping("/{id}/suggestion-technicien")
    @PreAuthorize("hasRole('DIRECTEUR')")
    @Operation(summary = "Affectation intelligente : l'IA suggère le meilleur technicien (charge + historique)")
    public ResponseEntity<SuggestionTechnicienResponse> suggererTechnicien(@PathVariable Long id) {
        return ResponseEntity.ok(interventionService.suggererTechnicien(id));
    }

    @PutMapping("/{id}/priorite")
    @PreAuthorize("hasRole('DIRECTEUR')")
    @Operation(summary = "Modifier la priorité d'une intervention")
    public ResponseEntity<Intervention> modifierPriorite(
            @PathVariable Long id,
            @RequestParam String nouvellePriorite,
            @RequestAttribute("userId") Long directeurId) {
        return ResponseEntity.ok(interventionService.modifierPriorite(id, nouvellePriorite, directeurId));
    }

    @PutMapping("/{id}/annuler")
    @PreAuthorize("hasRole('DIRECTEUR')")
    @Operation(summary = "Annuler une intervention")
    public ResponseEntity<Intervention> annulerIntervention(
            @PathVariable Long id,
            @RequestParam String motif,
            @RequestAttribute("userId") Long directeurId) {
        return ResponseEntity.ok(interventionService.annulerIntervention(id, motif, directeurId));
    }

    // ========== ACTIONS EMPLOYÉ ==========

    @PutMapping("/{id}/prendre-en-charge")
    @PreAuthorize("hasRole('EMPLOYE_SAV')")
    @Operation(summary = "Prendre en charge une nouvelle intervention (auto-affectation)")
    public ResponseEntity<Intervention> prendreEnCharge(
            @PathVariable Long id,
            @RequestAttribute("userId") Long employeId) {
        return ResponseEntity.ok(interventionService.prendreEnCharge(id, employeId));
    }

    @PutMapping("/{id}/accepter")
    @PreAuthorize("hasRole('EMPLOYE_SAV')")
    @Operation(summary = "Accepter une intervention affectée")
    public ResponseEntity<Intervention> accepterIntervention(
            @PathVariable Long id,
            @RequestAttribute("userId") Long employeId) {
        return ResponseEntity.ok(interventionService.accepterIntervention(id, employeId));
    }

    @PutMapping("/{id}/etat")
    @PreAuthorize("hasRole('EMPLOYE_SAV') or hasRole('DIRECTEUR')")
    @Operation(summary = "Changer l'état d'une intervention")
    public ResponseEntity<Intervention> changerEtat(
            @PathVariable Long id,
            @Valid @RequestBody ChangerEtatRequest request,
            @RequestAttribute("userId") Long employeId) {
        return ResponseEntity.ok(interventionService.changerEtat(id, request, employeId));
    }

    @PutMapping("/{id}/rapport")
    @PreAuthorize("hasRole('EMPLOYE_SAV')")
    @Operation(summary = "Ajouter un rapport technique")
    public ResponseEntity<Intervention> ajouterRapport(
            @PathVariable Long id,
            @RequestBody String rapport,
            @RequestAttribute("userId") Long employeId) {
        return ResponseEntity.ok(interventionService.ajouterRapport(id, rapport, employeId));
    }

    @PutMapping("/{id}/prix")
    @PreAuthorize("hasRole('EMPLOYE_SAV') or hasRole('DIRECTEUR')")
    @Operation(summary = "Modifier le prix d'une intervention")
    public ResponseEntity<Intervention> modifierPrix(
            @PathVariable Long id,
            @RequestParam(required = false) BigDecimal prixEstime,
            @RequestParam(required = false) BigDecimal prixFinal,
            @RequestAttribute("userId") Long employeId) {
        return ResponseEntity.ok(interventionService.modifierPrix(id, prixEstime, prixFinal, employeId));
    }

    @PutMapping("/{id}/cloturer")
    @PreAuthorize("hasRole('EMPLOYE_SAV') or hasRole('DIRECTEUR')")
    @Operation(summary = "Clôturer une intervention (employé affecté ou directeur)")
    public ResponseEntity<Intervention> cloturerIntervention(
            @PathVariable Long id,
            @Valid @RequestBody CloturerInterventionRequest request,
            @RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(interventionService.cloturerIntervention(id, request, userId));
    }

    @PostMapping("/{id}/envoyer-rapport")
    @PreAuthorize("hasRole('EMPLOYE_SAV') or hasRole('DIRECTEUR')")
    @Operation(summary = "Envoyer le rapport de clôture (PDF) par e-mail au client")
    public ResponseEntity<Void> envoyerRapport(@PathVariable Long id) {
        interventionService.envoyerRapportParEmail(id);
        return ResponseEntity.ok().build();
    }

    // ========== PIÈCES JOINTES ==========

    @PostMapping(value = "/{id}/pieces-jointes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Joindre des fichiers (photos) à une intervention")
    public ResponseEntity<List<PieceJointe>> ajouterPiecesJointes(
            @PathVariable Long id,
            @RequestParam("fichiers") MultipartFile[] fichiers,
            @RequestAttribute("userId") Long userId) {
        List<PieceJointe> ajoutees = interventionService.ajouterPiecesJointes(id, fichiers, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ajoutees);
    }

    @GetMapping("/{id}/pieces-jointes")
    @Operation(summary = "Lister les pièces jointes d'une intervention")
    public ResponseEntity<List<PieceJointe>> getPiecesJointes(@PathVariable Long id) {
        return ResponseEntity.ok(interventionService.getPiecesJointes(id));
    }

    @GetMapping("/pieces-jointes/{pieceId}/contenu")
    @Operation(summary = "Télécharger le contenu d'une pièce jointe")
    public ResponseEntity<Resource> getContenuPieceJointe(@PathVariable Long pieceId) {
        PieceJointe piece = interventionService.getPieceJointe(pieceId);
        Resource contenu = interventionService.getContenuPieceJointe(pieceId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(piece.getTypeFichier()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + piece.getNomFichier() + "\"")
                .body(contenu);
    }
}
