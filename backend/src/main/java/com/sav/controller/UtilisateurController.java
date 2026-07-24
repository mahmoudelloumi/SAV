package com.sav.controller;

import com.sav.model.Client;
import com.sav.model.Employe;
import com.sav.model.Utilisateur;
import com.sav.service.UtilisateurService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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

/**
 * Contrôleur REST pour la gestion des utilisateurs (employés et clients).
 */
@RestController
@RequestMapping("/utilisateurs")
@RequiredArgsConstructor
@Tag(name = "Utilisateurs", description = "Gestion des employés et des clients")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    // ========== EMPLOYÉS ==========

    @PostMapping("/employes")
    @PreAuthorize("hasRole('DIRECTEUR')")
    @Operation(summary = "Créer un nouvel employé")
    public ResponseEntity<Employe> creerEmploye(@RequestBody Employe employe) {
        // Pas de @Valid : le rôle est vérifié explicitement côté service
        // (Hibernate valide le reste des champs automatiquement au save()).
        return ResponseEntity.status(HttpStatus.CREATED).body(utilisateurService.creerEmploye(employe));
    }

    @GetMapping("/employes/{id}")
    @PreAuthorize("hasRole('DIRECTEUR')")
    @Operation(summary = "Consulter un employé par ID")
    public ResponseEntity<Employe> getEmployeById(@PathVariable Long id) {
        return ResponseEntity.ok(utilisateurService.getEmployeById(id));
    }

    @GetMapping("/employes")
    @PreAuthorize("hasRole('DIRECTEUR')")
    @Operation(summary = "Lister tous les employés")
    public ResponseEntity<Page<Employe>> getTousEmployes(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(utilisateurService.getTousEmployes(pageable));
    }

    @PutMapping("/employes/{id}")
    @PreAuthorize("hasRole('DIRECTEUR')")
    @Operation(summary = "Modifier un employé")
    public ResponseEntity<Employe> modifierEmploye(
            @PathVariable Long id,
            @RequestBody Employe employe) {
        return ResponseEntity.ok(utilisateurService.modifierEmploye(id, employe));
    }

    @DeleteMapping("/employes/{id}")
    @PreAuthorize("hasRole('DIRECTEUR')")
    @Operation(summary = "Supprimer un employé")
    public ResponseEntity<Void> supprimerEmploye(@PathVariable Long id) {
        utilisateurService.supprimerEmploye(id);
        return ResponseEntity.noContent().build();
    }

    // ========== CLIENTS ==========

    @PostMapping(value = "/clients", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('EMPLOYE_SAV')")
    @Operation(summary = "Créer un client (staff) avec les coordonnées du formulaire d'inscription")
    public ResponseEntity<Client> creerClient(
            @ModelAttribute Client client,
            @RequestParam(value = "document", required = false) MultipartFile document) {
        // Le mot de passe est initialisé par le client à sa première connexion (code e-mail).
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(utilisateurService.creerClientParStaff(client, document));
    }

    @GetMapping("/clients/{id}")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('EMPLOYE_SAV')")
    @Operation(summary = "Consulter un client par ID")
    public ResponseEntity<Client> getClientById(@PathVariable Long id) {
        return ResponseEntity.ok(utilisateurService.getClientById(id));
    }

    @GetMapping("/clients")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('EMPLOYE_SAV')")
    @Operation(summary = "Lister tous les clients")
    public ResponseEntity<Page<Client>> getTousClients(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(utilisateurService.getTousClients(pageable));
    }

    @PutMapping("/clients/{id}")
    @PreAuthorize("hasRole('DIRECTEUR')")
    @Operation(summary = "Modifier un client (Directeur)")
    public ResponseEntity<Client> modifierClient(@PathVariable Long id, @RequestBody Client client) {
        return ResponseEntity.ok(utilisateurService.modifierClient(id, client));
    }

    @DeleteMapping("/clients/{id}")
    @PreAuthorize("hasRole('DIRECTEUR')")
    @Operation(summary = "Supprimer un client inactif (Directeur)")
    public ResponseEntity<Void> supprimerClient(@PathVariable Long id) {
        utilisateurService.supprimerClient(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/clients/{id}/document")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('EMPLOYE_SAV')")
    @Operation(summary = "Consulter la pièce justificative du matricule fiscal d'un client")
    public ResponseEntity<Resource> getDocumentMatricule(@PathVariable Long id) {
        Client client = utilisateurService.getClientById(id);
        Resource document = utilisateurService.getDocumentMatricule(id);
        String type = client.getDocumentMatriculeType() != null
                ? client.getDocumentMatriculeType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        String nom = client.getDocumentMatriculeNom() != null
                ? client.getDocumentMatriculeNom() : "document";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(type))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + nom + "\"")
                .body(document);
    }

    // ========== ACTIVATION / DÉSACTIVATION ==========

    @PutMapping("/{id}/statut")
    @PreAuthorize("hasRole('DIRECTEUR')")
    @Operation(summary = "Activer ou désactiver un compte")
    public ResponseEntity<Void> activerDesactiverCompte(
            @PathVariable Long id,
            @RequestParam boolean actif) {
        utilisateurService.activerDesactiverCompte(id, actif);
        return ResponseEntity.ok().build();
    }

    // ========== PHOTO DE PROFIL ==========

    @PostMapping(value = "/me/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Mettre à jour sa propre photo de profil")
    public ResponseEntity<Utilisateur> mettreAJourPhotoProfil(
            @RequestAttribute("userId") Long userId,
            @RequestParam("fichier") MultipartFile fichier) {
        return ResponseEntity.ok(utilisateurService.mettreAJourPhotoProfil(userId, fichier));
    }

    @GetMapping("/{id}/photo")
    @Operation(summary = "Récupérer la photo de profil d'un utilisateur")
    public ResponseEntity<Resource> getPhotoProfil(@PathVariable Long id) {
        Utilisateur utilisateur = utilisateurService.getUtilisateurById(id);
        Resource photo = utilisateurService.getPhotoProfil(id);
        String type = utilisateur.getPhotoProfilType() != null
                ? utilisateur.getPhotoProfilType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(type))
                .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                .body(photo);
    }
}
