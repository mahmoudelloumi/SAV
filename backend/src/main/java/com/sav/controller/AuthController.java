package com.sav.controller;

import com.sav.model.AuthResponse;
import com.sav.model.Client;
import com.sav.model.ConnexionRequest;
import com.sav.model.ReinitialiserMotDePasseRequest;
import com.sav.model.TotpResponse;
import com.sav.model.VerifyTotpRequest;
import com.sav.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Contrôleur REST pour l'authentification et l'inscription.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Endpoints d'inscription, connexion et 2FA")
public class AuthController {

    private final AuthService authService;

    @PostMapping(value = "/inscription", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Inscription d'un nouveau client (avec pièce jointe du matricule fiscal)")
    public ResponseEntity<Void> registerClient(
            @ModelAttribute Client client,
            @RequestParam(value = "document", required = false) MultipartFile document) {
        // Pas de @Valid ici : le rôle (obligatoire) est fixé côté service après
        // le binding (allowlisting) ; Hibernate valide l'entité complète juste
        // avant l'enregistrement en base. Le document est obligatoire (vérifié en service).
        authService.registerClient(client, document);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/connexion")
    @Operation(summary = "Connexion (Etape 1)")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody ConnexionRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/2fa/setup")
    @Operation(summary = "Générer le QR Code TOTP (Etape 2)")
    public ResponseEntity<TotpResponse> setupTotp(@RequestParam String email) {
        return ResponseEntity.ok(authService.setupTotp(email));
    }

    @PostMapping("/2fa/email/send")
    @Operation(summary = "Envoyer un code de connexion 2FA par e-mail (alternative à l'app)")
    public ResponseEntity<Void> envoyerCodeEmail(@RequestParam String email) {
        authService.envoyerCodeEmail(email);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/statut-email")
    @Operation(summary = "Indique si le compte doit définir son mot de passe (client créé par le SAV)")
    public ResponseEntity<java.util.Map<String, Boolean>> statutEmail(@RequestParam String email) {
        return ResponseEntity.ok(java.util.Map.of(
                "existe", authService.emailExiste(email),
                "motDePasseAInitialiser", authService.motDePasseAInitialiser(email)));
    }

    @PostMapping("/definir-mot-de-passe")
    @Operation(summary = "Définir le mot de passe à la 1re connexion (client créé par le SAV)")
    public ResponseEntity<AuthResponse> definirMotDePasse(@Valid @RequestBody ReinitialiserMotDePasseRequest request) {
        return ResponseEntity.ok(authService.definirMotDePasse(
                request.getEmail(), request.getCode(), request.getNouveauMotDePasse()));
    }

    @PostMapping("/2fa/verify")
    @Operation(summary = "Vérifier le code (Authenticator ou e-mail) et obtenir le token JWT (Etape 3)")
    public ResponseEntity<AuthResponse> verifyTotp(@Valid @RequestBody VerifyTotpRequest request) {
        return ResponseEntity.ok(authService.verifyTotp(request));
    }

    @PostMapping("/verifier-code")
    @Operation(summary = "Vérifier le code Google Authenticator (étape mot de passe oublié)")
    public ResponseEntity<Void> verifierCode(@Valid @RequestBody VerifyTotpRequest request) {
        authService.verifierCodeReinitialisation(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/mot-de-passe-oublie")
    @Operation(summary = "Réinitialiser le mot de passe via le code Google Authenticator")
    public ResponseEntity<Void> reinitialiserMotDePasse(@Valid @RequestBody ReinitialiserMotDePasseRequest request) {
        authService.reinitialiserMotDePasse(request);
        return ResponseEntity.ok().build();
    }
}
