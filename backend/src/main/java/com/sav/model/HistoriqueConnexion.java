package com.sav.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Historique des tentatives de connexion (réussies et échouées).
 */
@Entity
@Table(name = "historique_connexion", indexes = {
        @Index(name = "idx_connexion_utilisateur", columnList = "utilisateur_id"),
        @Index(name = "idx_connexion_date", columnList = "date_connexion"),
        @Index(name = "idx_connexion_succes", columnList = "succes")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueConnexion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 45, message = "L'adresse IP ne doit pas dépasser 45 caractères")
    @Column(name = "adresse_ip", length = 45)
    private String adresseIp;

    @Size(max = 255, message = "Le navigateur ne doit pas dépasser 255 caractères")
    @Column(name = "navigateur", length = 255)
    private String navigateur;

    @Column(name = "succes", nullable = false)
    private boolean succes;

    @Size(max = 200, message = "Le motif d'échec ne doit pas dépasser 200 caractères")
    @Column(name = "motif_echec", length = 200)
    private String motifEchec;

    @CreatedDate
    @Column(name = "date_connexion", nullable = false, updatable = false)
    private LocalDateTime dateConnexion;

    // --- Relations ---

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;
}
