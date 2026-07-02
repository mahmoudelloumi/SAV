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
 * Journal d'audit global du système.
 * Trace toutes les actions effectuées (création, modification, suppression, connexion).
 */
@Entity
@Table(name = "journal_audit", indexes = {
        @Index(name = "idx_audit_action", columnList = "action"),
        @Index(name = "idx_audit_type_entite", columnList = "type_entite"),
        @Index(name = "idx_audit_date", columnList = "date_action"),
        @Index(name = "idx_audit_utilisateur", columnList = "effectue_par_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "L'action est obligatoire")
    @Size(max = 50, message = "L'action ne doit pas dépasser 50 caractères")
    @Column(name = "action", nullable = false, length = 50)
    private String action;

    @NotBlank(message = "Le type d'entité est obligatoire")
    @Size(max = 100, message = "Le type d'entité ne doit pas dépasser 100 caractères")
    @Column(name = "type_entite", nullable = false, length = 100)
    private String typeEntite;

    @Column(name = "id_entite")
    private Long idEntite;

    @Size(max = 2000, message = "Les détails ne doivent pas dépasser 2000 caractères")
    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Size(max = 45, message = "L'adresse IP ne doit pas dépasser 45 caractères")
    @Column(name = "adresse_ip", length = 45)
    private String adresseIp;

    @CreatedDate
    @Column(name = "date_action", nullable = false, updatable = false)
    private LocalDateTime dateAction;

    // --- Relations ---

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "effectue_par_id", nullable = false)
    private Utilisateur effectuePar;
}
