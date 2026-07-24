package com.sav.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sav.model.enums.CategorieIntervention;
import com.sav.model.enums.EtatIntervention;
import com.sav.model.enums.Priorite;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité centrale : Intervention SAV.
 * Représente une demande d'intervention avec son cycle de vie complet.
 */
@Entity
@Table(name = "intervention", indexes = {
        @Index(name = "idx_intervention_code", columnList = "code"),
        @Index(name = "idx_intervention_etat", columnList = "etat"),
        @Index(name = "idx_intervention_priorite", columnList = "priorite"),
        @Index(name = "idx_intervention_client", columnList = "client_id"),
        @Index(name = "idx_intervention_employe", columnList = "employe_affecte_id"),
        @Index(name = "idx_intervention_date_creation", columnList = "date_creation")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"commentaires", "piecesJointes", "historiques"})
public class Intervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 20)
    private String code;

    @NotBlank(message = "La description est obligatoire")
    @Size(max = 2000, message = "La description ne doit pas dépasser 2000 caractères")
    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "La priorité est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(name = "priorite", nullable = false, length = 20)
    private Priorite priorite = Priorite.NORMAL;

    @NotNull(message = "L'état est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(name = "etat", nullable = false, length = 20)
    private EtatIntervention etat = EtatIntervention.NOUVELLE;

    // Catégorie technique (classification automatique par l'IA, modifiable).
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "categorie", length = 20)
    private CategorieIntervention categorie = CategorieIntervention.AUTRE;

    @DecimalMin(value = "0.0", message = "Le prix estimé doit être positif")
    @Digits(integer = 9, fraction = 3, message = "Le prix estimé ne doit pas dépasser 9 chiffres entiers et 3 décimales")
    @Column(name = "prix_estime", precision = 12, scale = 3)
    private BigDecimal prixEstime;

    @DecimalMin(value = "0.0", message = "Le prix final doit être positif")
    @Digits(integer = 9, fraction = 3, message = "Le prix final ne doit pas dépasser 9 chiffres entiers et 3 décimales")
    @Column(name = "prix_final", precision = 12, scale = 3)
    private BigDecimal prixFinal;

    @Size(max = 5000, message = "Le rapport technique ne doit pas dépasser 5000 caractères")
    @Column(name = "rapport_technique", columnDefinition = "TEXT")
    private String rapportTechnique;

    // --- Confirmation client (interventions créées par un employé/directeur) ---
    // confirmee = false tant que le client n'a pas validé le code reçu par e-mail.
    // Les interventions créées directement par le client sont confirmee = true.
    @Column(name = "confirmee", nullable = false, columnDefinition = "boolean default true")
    private boolean confirmee = true;

    @JsonIgnore
    @Column(name = "code_confirmation", length = 10)
    private String codeConfirmation;

    @CreatedDate
    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_cloture")
    private LocalDateTime dateCloture;

    @LastModifiedDate
    @Column(name = "date_modification", nullable = false)
    private LocalDateTime dateModification;

    // --- Relations ---

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_affecte_id")
    private Employe employeAffecte;

    @JsonIgnore
    @OneToMany(mappedBy = "intervention", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("dateCreation DESC")
    private List<Commentaire> commentaires = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "intervention", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("dateTelechargement DESC")
    private List<PieceJointe> piecesJointes = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "intervention", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("dateModification DESC")
    private List<HistoriqueIntervention> historiques = new ArrayList<>();

    // --- Champs calculés (non persistés) : préservent le contrat JSON plat
    //     déjà consommé par le frontend, sans exposer les objets complets.

    @Transient
    public Long getClientId() {
        return client != null ? client.getId() : null;
    }

    @Transient
    public String getClientNom() {
        return client != null ? client.getNom() + " " + client.getPrenom() : null;
    }

    @Transient
    public String getClientRaisonSociale() {
        return client != null ? client.getRaisonSociale() : null;
    }

    @Transient
    public Long getEmployeAffecteId() {
        return employeAffecte != null ? employeAffecte.getId() : null;
    }

    @Transient
    public String getEmployeAffecteNom() {
        return employeAffecte != null ? employeAffecte.getNom() + " " + employeAffecte.getPrenom() : null;
    }
}
