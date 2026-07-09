package com.sav.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Entité Client. Hérite d'Utilisateur avec les champs spécifiques :
 * matricule fiscal, RNE, raison sociale. Le 2FA est géré au niveau
 * d'Utilisateur (commun à tous les rôles).
 */
@Entity
@Table(name = "client")
@DiscriminatorValue("CLIENT")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
public class Client extends Utilisateur {

    // Obligatoire à l'auto-inscription (contrôlé dans AuthService), mais optionnel
    // pour un client créé par un employé/directeur lors d'une intervention.
    @Size(max = 20, message = "Le matricule fiscal ne doit pas dépasser 20 caractères")
    @Column(name = "matricule_fiscal", unique = true, length = 20)
    private String matriculeFiscal;

    // RNE optionnel (peut être vide). Reste unique : PostgreSQL autorise
    // plusieurs valeurs NULL sous une contrainte d'unicité.
    @Size(max = 20, message = "Le RNE ne doit pas dépasser 20 caractères")
    @Column(name = "rne", unique = true, length = 20)
    private String rne;

    @NotBlank(message = "La raison sociale est obligatoire")
    @Size(max = 200, message = "La raison sociale ne doit pas dépasser 200 caractères")
    @Column(name = "raison_sociale", nullable = false, length = 200)
    private String raisonSociale;

    // --- Pièce justificative du matricule fiscal (photo/PDF fournie à l'inscription) ---

    @Column(name = "document_matricule_nom", length = 255)
    private String documentMatriculeNom;      // nom d'origine, exposé (le frontend sait qu'un doc existe)

    @Column(name = "document_matricule_type", length = 100)
    private String documentMatriculeType;     // content-type, pour re-servir le fichier

    @JsonIgnore
    @Column(name = "document_matricule_chemin", length = 500)
    private String documentMatriculeChemin;   // chemin serveur, jamais exposé

    // --- Relations ---

    @JsonIgnore
    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Intervention> interventions = new ArrayList<>();
}
