package com.sav.controller;

import com.sav.model.AmeliorerTexteRequest;
import com.sav.model.ChatbotRequest;
import com.sav.model.ChatbotResponse;
import com.sav.service.ChatbotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur REST du chatbot d'assistance SAV (IA locale via Ollama).
 */
@RestController
@RequestMapping("/chatbot")
@RequiredArgsConstructor
@Tag(name = "Chatbot", description = "Assistant virtuel SAV (IA)")
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/message")
    @Operation(summary = "Envoyer un message au chatbot et recevoir sa réponse")
    public ResponseEntity<ChatbotResponse> envoyerMessage(@Valid @RequestBody ChatbotRequest request) {
        return ResponseEntity.ok(chatbotService.repondre(request));
    }

    @PostMapping("/public")
    @Operation(summary = "Assistant public (visiteurs) : compte, connexion, contact, adresse")
    public ResponseEntity<ChatbotResponse> messagePublic(@Valid @RequestBody ChatbotRequest request) {
        return ResponseEntity.ok(chatbotService.repondrePublic(request));
    }

    @PostMapping("/admin")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('DIRECTEUR')")
    @Operation(summary = "Assistant de données du directeur : CA/employés, interventions, coordonnées")
    public ResponseEntity<ChatbotResponse> messageAdmin(@Valid @RequestBody ChatbotRequest request) {
        return ResponseEntity.ok(chatbotService.repondreAdmin(request));
    }

    @PostMapping("/ameliorer-description")
    @Operation(summary = "Reformuler la description d'un problème avec l'IA")
    public ResponseEntity<java.util.Map<String, String>> ameliorerDescription(
            @Valid @RequestBody AmeliorerTexteRequest request) {
        String ameliore = chatbotService.ameliorerDescription(request.getTexte());
        return ResponseEntity.ok(java.util.Map.of("texte", ameliore));
    }

    @PostMapping("/rapport")
    @Operation(summary = "Générer un rapport technique final avec l'IA (staff)")
    public ResponseEntity<java.util.Map<String, String>> genererRapport(
            @RequestBody java.util.Map<String, String> body) {
        String rapport = chatbotService.genererRapportTechnique(
                body.get("description"), body.get("notes"));
        return ResponseEntity.ok(java.util.Map.of("texte", rapport));
    }

    @PostMapping("/classifier")
    @Operation(summary = "Classer automatiquement un problème : priorité + catégorie (IA)")
    public ResponseEntity<ChatbotService.Classification> classifier(
            @Valid @RequestBody AmeliorerTexteRequest request) {
        return ResponseEntity.ok(chatbotService.classer(request.getTexte()));
    }
}
