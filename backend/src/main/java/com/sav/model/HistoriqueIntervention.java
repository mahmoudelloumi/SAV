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
 * Historique des modifications d'une intervention.
 * Trace chaque changement de champ (état, priorité, employé, etc.).
 */
@Entity
@Table(name = "historique_intervention", indexes = {
        @Index(name = "idx_historique_intervention", columnList = "intervention_id"),
        @Index(name = "idx_historique_date", columnList = "date_modification")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueIntervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le champ modifié est obligatoire")
    @Size(max = 100, message = "Le champ modifié ne doit pas dépasser 100 caractères")
    @Column(name = "champ_modifie", nullable = false, length = 100)
    private String champModifie;

    @Size(max = 500, message = "L'ancienne valeur ne doit pas dépasser 500 caractères")
    @Column(name = "ancienne_valeur", length = 500)
    private String ancienneValeur;

    @NotBlank(message = "La nouvelle valeur est obligatoire")
    @Size(max = 500, message = "La nouvelle valeur ne doit pas dépasser 500 caractères")
    @Column(name = "nouvelle_valeur", nullable = false, length = 500)
    private String nouvelleValeur;

    @CreatedDate
    @Column(name = "date_modification", nullable = false, updatable = false)
    private LocalDateTime dateModification;

    // --- Relations ---

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "intervention_id", nullable = false)
    private Intervention intervention;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "modifie_par_id", nullable = false)
    private Utilisateur modifiePar;
}
