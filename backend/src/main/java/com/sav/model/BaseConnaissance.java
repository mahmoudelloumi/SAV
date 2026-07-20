package com.sav.model;

import com.sav.model.enums.CategorieConnaissance;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Entrée de la base de connaissances utilisée par le chatbot pour répondre
 * précisément aux clients (infos entreprise, problèmes connus + solutions, produits).
 */
@Entity
@Table(name = "base_connaissance")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaseConnaissance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "La catégorie est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(name = "categorie", nullable = false, length = 20)
    private CategorieConnaissance categorie;

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 200, message = "Le titre ne doit pas dépasser 200 caractères")
    @Column(name = "titre", nullable = false, length = 200)
    private String titre;

    @NotBlank(message = "Le contenu est obligatoire")
    @Column(name = "contenu", nullable = false, columnDefinition = "TEXT")
    private String contenu;

    // Mots-clés facultatifs (séparés par des virgules) pour aider le chatbot à cibler.
    @Size(max = 300, message = "Les mots-clés ne doivent pas dépasser 300 caractères")
    @Column(name = "mots_cles", length = 300)
    private String motsCles;

    @Column(name = "actif", nullable = false, columnDefinition = "boolean default true")
    private boolean actif = true;

    @CreatedDate
    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @LastModifiedDate
    @Column(name = "date_modification", nullable = false)
    private LocalDateTime dateModification;
}
