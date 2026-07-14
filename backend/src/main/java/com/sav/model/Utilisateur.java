package com.sav.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.sav.model.enums.Role;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Entité abstraite représentant un utilisateur du système.
 * Stratégie d'héritage JOINED : une table par sous-classe.
 */
@Entity
@Table(name = "utilisateur")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "type_utilisateur", discriminatorType = DiscriminatorType.STRING, length = 10)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"motDePasse", "twoFactorSecret"})
public abstract class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100, message = "Le nom ne doit pas dépasser 100 caractères")
    @Column(name = "nom", nullable = false, length = 100)
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(max = 100, message = "Le prénom ne doit pas dépasser 100 caractères")
    @Column(name = "prenom", nullable = false, length = 100)
    private String prenom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email doit être valide")
    @Size(max = 150, message = "L'email ne doit pas dépasser 150 caractères")
    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Column(name = "mot_de_passe", nullable = false, length = 255)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String motDePasse;

    @Size(max = 20, message = "Le téléphone ne doit pas dépasser 20 caractères")
    @Column(name = "telephone", length = 20)
    private String telephone;

    @Size(max = 500, message = "L'adresse ne doit pas dépasser 500 caractères")
    @Column(name = "adresse", length = 500)
    private String adresse;

    @NotNull(message = "Le rôle est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    @Column(name = "actif", nullable = false)
    private boolean actif = true;

    // Vrai pour un client créé par le SAV : il doit définir son mot de passe à
    // la première connexion (via un code reçu par e-mail).
    @Column(name = "mot_de_passe_a_initialiser", nullable = false, columnDefinition = "boolean default false")
    private boolean motDePasseAInitialiser = false;

    // --- Photo de profil (facultative, modifiable dans les paramètres) ---

    @Column(name = "photo_profil_type", length = 100)
    private String photoProfilType;      // content-type, exposé : non nul => une photo existe

    @JsonIgnore
    @Column(name = "photo_profil_chemin", length = 500)
    private String photoProfilChemin;    // chemin serveur, jamais renvoyé au client

    // --- Double authentification (2FA / TOTP) : commune à tous les rôles ---

    @Column(name = "two_factor_active", nullable = false, columnDefinition = "boolean default false")
    private boolean twoFactorActive = false;

    @Column(name = "two_factor_secret", length = 255)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String twoFactorSecret;

    // --- 2FA par code envoyé par e-mail (méthode alternative à Google Authenticator) ---

    @JsonIgnore
    @Column(name = "email_otp_code", length = 10)
    private String emailOtpCode;

    @JsonIgnore
    @Column(name = "email_otp_expiration")
    private LocalDateTime emailOtpExpiration;

    @CreatedDate
    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @LastModifiedDate
    @Column(name = "date_modification", nullable = false)
    private LocalDateTime dateModification;
}
