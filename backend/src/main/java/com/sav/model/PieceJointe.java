package com.sav.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Pièce jointe associée à une intervention (PDF, images, etc.).
 */
@Entity
@Table(name = "piece_jointe", indexes = {
        @Index(name = "idx_piece_jointe_intervention", columnList = "intervention_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PieceJointe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom du fichier est obligatoire")
    @Size(max = 255, message = "Le nom du fichier ne doit pas dépasser 255 caractères")
    @Column(name = "nom_fichier", nullable = false, length = 255)
    private String nomFichier;

    @NotBlank(message = "Le chemin du fichier est obligatoire")
    @Size(max = 500, message = "Le chemin du fichier ne doit pas dépasser 500 caractères")
    @Column(name = "chemin_fichier", nullable = false, length = 500)
    private String cheminFichier;

    @NotBlank(message = "Le type du fichier est obligatoire")
    @Size(max = 100, message = "Le type du fichier ne doit pas dépasser 100 caractères")
    @Column(name = "type_fichier", nullable = false, length = 100)
    private String typeFichier;

    @Positive(message = "La taille du fichier doit être positive")
    @Column(name = "taille_fichier", nullable = false)
    private Long tailleFichier;

    @CreatedDate
    @Column(name = "date_telechargement", nullable = false, updatable = false)
    private LocalDateTime dateTelechargement;

    // --- Relations ---

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "intervention_id", nullable = false)
    private Intervention intervention;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "telecharge_par_id", nullable = false)
    private Utilisateur telechargePar;
}
