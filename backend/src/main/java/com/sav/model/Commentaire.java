package com.sav.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Commentaire ajouté à une intervention par un employé SAV.
 */
@Entity
@Table(name = "commentaire", indexes = {
        @Index(name = "idx_commentaire_intervention", columnList = "intervention_id"),
        @Index(name = "idx_commentaire_date", columnList = "date_creation")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Commentaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le contenu du commentaire est obligatoire")
    @Size(max = 2000, message = "Le commentaire ne doit pas dépasser 2000 caractères")
    @Column(name = "contenu", nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @CreatedDate
    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    // --- Relations ---

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "intervention_id", nullable = false)
    private Intervention intervention;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    // --- Champs calculés (non persistés) : exposent l'identité de l'auteur
    //     sans sérialiser l'objet Utilisateur complet (mot de passe, etc.).

    @Transient
    public Long getAuteurId() {
        return auteur != null ? auteur.getId() : null;
    }

    @Transient
    public String getAuteurNom() {
        return auteur != null ? auteur.getNom() + " " + auteur.getPrenom() : null;
    }

    @Transient
    public String getAuteurRole() {
        return auteur != null ? auteur.getRole().name() : null;
    }
}
