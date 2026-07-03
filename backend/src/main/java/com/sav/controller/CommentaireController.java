package com.sav.controller;

import com.sav.model.Commentaire;
import com.sav.service.CommentaireService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur REST pour la messagerie liée à une intervention.
 * L'autorisation fine (client propriétaire / employé affecté / directeur)
 * est gérée dans CommentaireServiceImpl.verifierAcces().
 */
@RestController
@RequestMapping("/interventions/{interventionId}/commentaires")
@RequiredArgsConstructor
@Tag(name = "Commentaires", description = "Messagerie liée à une intervention SAV")
public class CommentaireController {

    private final CommentaireService commentaireService;

    @PostMapping
    @Operation(summary = "Envoyer un message sur une intervention")
    public ResponseEntity<Commentaire> ajouterCommentaire(
            @PathVariable Long interventionId,
            @RequestBody String contenu,
            @RequestAttribute("userId") Long auteurId) {
        Commentaire commentaire = commentaireService.ajouterCommentaire(interventionId, contenu, auteurId);
        return ResponseEntity.status(HttpStatus.CREATED).body(commentaire);
    }

    @GetMapping
    @Operation(summary = "Lister les messages d'une intervention (paginé, ordre chronologique)")
    public ResponseEntity<Page<Commentaire>> getCommentaires(
            @PathVariable Long interventionId,
            @PageableDefault(size = 50, sort = "dateCreation") Pageable pageable,
            @RequestAttribute("userId") Long demandeurId) {
        return ResponseEntity.ok(commentaireService.getCommentairesParIntervention(interventionId, demandeurId, pageable));
    }
}
