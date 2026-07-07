package com.sav.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Entité Employé. Hérite d'Utilisateur.
 * Utilisée pour les rôles EMPLOYE_SAV et DIRECTEUR.
 */
@Entity
@Table(name = "employe")
@DiscriminatorValue("EMPLOYE")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
public class Employe extends Utilisateur {

    // Généré automatiquement côté serveur (format EMP-AAAA-NNN) s'il n'est pas fourni.
    @Size(max = 20, message = "Le code employé ne doit pas dépasser 20 caractères")
    @Column(name = "code_employe", nullable = false, unique = true, length = 20)
    private String codeEmploye;

    @Size(max = 100, message = "La spécialité ne doit pas dépasser 100 caractères")
    @Column(name = "specialite", length = 100)
    private String specialite;

    // --- Relations ---

    @JsonIgnore
    @OneToMany(mappedBy = "employeAffecte", fetch = FetchType.LAZY)
    private List<Intervention> interventionsAffectees = new ArrayList<>();
}
