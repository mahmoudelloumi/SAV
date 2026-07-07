package com.sav.repository;

import com.sav.model.Employe;
import com.sav.model.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entité Employe.
 */
@Repository
public interface EmployeRepository extends JpaRepository<Employe, Long>, JpaSpecificationExecutor<Employe> {

    Optional<Employe> findByEmail(String email);

    Optional<Employe> findByCodeEmploye(String codeEmploye);

    boolean existsByEmail(String email);

    boolean existsByCodeEmploye(String codeEmploye);

    List<Employe> findByRole(Role role);

    List<Employe> findByActifTrue();

    // Dernier numéro de code employé pour une année (format EMP-AAAA-NNN),
    // pour générer automatiquement le code suivant.
    @Query("SELECT MAX(CAST(SUBSTRING(e.codeEmploye, 10, 3) AS int)) FROM Employe e " +
            "WHERE e.codeEmploye LIKE 'EMP-%' AND SUBSTRING(e.codeEmploye, 5, 4) = :annee")
    Integer findDernierNumeroEmployeParAnnee(@Param("annee") String annee);
}
