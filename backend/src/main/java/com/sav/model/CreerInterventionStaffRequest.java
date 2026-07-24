package com.sav.model;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Création d'une intervention par un employé/directeur pour le compte d'un client.
 * Le client peut être existant ({@code clientId}) ou nouveau (champs société/contact).
 * L'intervention reste « en attente de confirmation » jusqu'à validation du code
 * reçu par le client par e-mail.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreerInterventionStaffRequest {

    // --- Client existant (prioritaire s'il est renseigné) ---
    private Long clientId;

    // --- Nouveau client (utilisé si clientId est absent) ---
    private String raisonSociale;   // Société
    private String prenom;          // Contact (prénom)
    private String nom;             // Contact (nom)
    private String email;
    private String telephone;
    private String matriculeFiscal; // facultatif

    // --- Intervention ---
    @NotBlank(message = "La description est obligatoire")
    private String description;

    private String priorite;        // TRES_URGENT / URGENT / NORMAL / FACULTATIF
    private String categorie;       // LOGICIEL / MATERIEL / RESEAU / INSTALLATION / MAINTENANCE / AUTRE
}
