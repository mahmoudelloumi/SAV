package com.sav.repository;

import com.sav.model.Intervention;
import com.sav.model.enums.EtatIntervention;
import com.sav.model.enums.Priorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entité Intervention.
 * Inclut les requêtes personnalisées pour les statistiques et la recherche.
 *
 * Les méthodes de lecture utilisées par les endpoints chargent `client` et
 * `employeAffecte` en une seule requête (@EntityGraph) : comme les entités
 * sont désormais renvoyées directement (pas de DTO mappé pendant la
 * transaction) et que `open-in-view` est désactivé, ces associations LAZY
 * doivent être déjà chargées avant que la session Hibernate ne se ferme.
 */
@Repository
public interface InterventionRepository extends JpaRepository<Intervention, Long>, JpaSpecificationExecutor<Intervention> {

    @EntityGraph(attributePaths = {"client", "employeAffecte"})
    @Override
    Optional<Intervention> findById(Long id);

    @EntityGraph(attributePaths = {"client", "employeAffecte"})
    Optional<Intervention> findByCode(String code);

    @EntityGraph(attributePaths = {"client", "employeAffecte"})
    @Override
    Page<Intervention> findAll(Pageable pageable);

    // --- Requêtes par état ---

    @EntityGraph(attributePaths = {"client", "employeAffecte"})
    Page<Intervention> findByEtat(EtatIntervention etat, Pageable pageable);

    List<Intervention> findByEtatIn(List<EtatIntervention> etats);

    // --- Requêtes par client ---
    // Remarque : @EntityGraph provoque une erreur Hibernate quand l'attribut
    // chargé en avance est aussi celui filtré dans le WHERE (conflit de jointure
    // interne) — on utilise donc une jointure explicite via @Query à la place.

    @Query(value = "SELECT i FROM Intervention i LEFT JOIN FETCH i.client LEFT JOIN FETCH i.employeAffecte WHERE i.client.id = :clientId",
            countQuery = "SELECT COUNT(i) FROM Intervention i WHERE i.client.id = :clientId")
    Page<Intervention> findByClientId(@Param("clientId") Long clientId, Pageable pageable);

    // --- Requêtes par employé affecté ---

    @Query(value = "SELECT i FROM Intervention i LEFT JOIN FETCH i.client LEFT JOIN FETCH i.employeAffecte WHERE i.employeAffecte.id = :employeId",
            countQuery = "SELECT COUNT(i) FROM Intervention i WHERE i.employeAffecte.id = :employeId")
    Page<Intervention> findByEmployeAffecteId(@Param("employeId") Long employeId, Pageable pageable);

    Page<Intervention> findByEmployeAffecteIdAndEtat(Long employeId, EtatIntervention etat, Pageable pageable);

    // --- Statistiques : Comptage par état ---

    long countByEtat(EtatIntervention etat);

    // Comptage par état sur une période (par date de création).
    long countByEtatAndDateCreationBetween(EtatIntervention etat, LocalDateTime debut, LocalDateTime fin);

    // Nombre total d'interventions créées sur une période.
    long countByDateCreationBetween(LocalDateTime debut, LocalDateTime fin);

    // --- Statistiques : Comptage par priorité ---

    long countByPriorite(Priorite priorite);

    // Comptage par priorité sur une période (par date de création).
    long countByPrioriteAndDateCreationBetween(Priorite priorite, LocalDateTime debut, LocalDateTime fin);

    // --- Statistiques : Chiffre d'affaires ---

    @Query("SELECT COALESCE(SUM(i.prixFinal), 0) FROM Intervention i WHERE i.etat = 'TERMINEE'")
    BigDecimal calculerChiffreAffairesTotal();

    @Query("SELECT COALESCE(SUM(i.prixFinal), 0) FROM Intervention i " +
            "WHERE i.etat = 'TERMINEE' AND i.dateCloture BETWEEN :debut AND :fin")
    BigDecimal calculerChiffreAffairesParPeriode(
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin
    );

    // --- Statistiques : Par employé ---

    @Query("SELECT COUNT(i) FROM Intervention i WHERE i.employeAffecte.id = :employeId AND i.etat = 'TERMINEE'")
    long countInterventionsTermineesParEmploye(@Param("employeId") Long employeId);

    // Interventions terminées d'un employé, clôturées sur une période donnée.
    @Query("SELECT COUNT(i) FROM Intervention i WHERE i.employeAffecte.id = :employeId " +
            "AND i.etat = 'TERMINEE' AND i.dateCloture BETWEEN :debut AND :fin")
    long countTermineesParEmployeEtPeriode(@Param("employeId") Long employeId,
                                           @Param("debut") LocalDateTime debut,
                                           @Param("fin") LocalDateTime fin);

    // CA généré par un employé sur les interventions clôturées d'une période donnée.
    @Query("SELECT COALESCE(SUM(COALESCE(i.prixFinal, i.prixEstime, 0)), 0) FROM Intervention i " +
            "WHERE i.employeAffecte.id = :employeId AND i.etat = 'TERMINEE' AND i.dateCloture BETWEEN :debut AND :fin")
    BigDecimal calculerChiffreAffairesParEmployeEtPeriode(@Param("employeId") Long employeId,
                                                          @Param("debut") LocalDateTime debut,
                                                          @Param("fin") LocalDateTime fin);

    // Charge active d'un technicien : interventions dans l'un des états fournis
    // (non terminées et non annulées).
    @Query("SELECT COUNT(i) FROM Intervention i WHERE i.employeAffecte.id = :employeId AND i.etat IN :etats")
    long countChargeActive(@Param("employeId") Long employeId, @Param("etats") List<EtatIntervention> etats);

    // CA généré par un employé sur ses interventions terminées : on privilégie le
    // prix final, mais on retombe sur le prix estimé quand l'intervention a été
    // terminée sans clôture chiffrée (prixFinal non renseigné).
    @Query("SELECT COALESCE(SUM(COALESCE(i.prixFinal, i.prixEstime, 0)), 0) FROM Intervention i " +
            "WHERE i.employeAffecte.id = :employeId AND i.etat = 'TERMINEE'")
    BigDecimal calculerChiffreAffairesParEmploye(@Param("employeId") Long employeId);

    // --- Statistiques : Évolution mensuelle ---

    @Query("SELECT FUNCTION('TO_CHAR', i.dateCreation, 'YYYY-MM') AS mois, COUNT(i) " +
            "FROM Intervention i " +
            "WHERE i.dateCreation BETWEEN :debut AND :fin " +
            "GROUP BY FUNCTION('TO_CHAR', i.dateCreation, 'YYYY-MM') " +
            "ORDER BY mois")
    List<Object[]> countParMois(
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin
    );

    @Query("SELECT FUNCTION('TO_CHAR', i.dateCreation, 'YYYY-MM-DD') AS jour, COUNT(i) " +
            "FROM Intervention i " +
            "WHERE i.dateCreation BETWEEN :debut AND :fin " +
            "GROUP BY FUNCTION('TO_CHAR', i.dateCreation, 'YYYY-MM-DD') " +
            "ORDER BY jour")
    List<Object[]> countParJour(
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin
    );

    // --- Statistiques : Chiffre d'affaires par période (somme des prix finaux, à la clôture) ---

    @Query("SELECT FUNCTION('TO_CHAR', i.dateCloture, 'YYYY-MM') AS mois, COALESCE(SUM(i.prixFinal), 0) " +
            "FROM Intervention i " +
            "WHERE i.etat = 'TERMINEE' AND i.dateCloture BETWEEN :debut AND :fin " +
            "GROUP BY FUNCTION('TO_CHAR', i.dateCloture, 'YYYY-MM') " +
            "ORDER BY mois")
    List<Object[]> chiffreAffairesParMois(
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin
    );

    @Query("SELECT FUNCTION('TO_CHAR', i.dateCloture, 'YYYY-MM-DD') AS jour, COALESCE(SUM(i.prixFinal), 0) " +
            "FROM Intervention i " +
            "WHERE i.etat = 'TERMINEE' AND i.dateCloture BETWEEN :debut AND :fin " +
            "GROUP BY FUNCTION('TO_CHAR', i.dateCloture, 'YYYY-MM-DD') " +
            "ORDER BY jour")
    List<Object[]> chiffreAffairesParJour(
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin
    );

    // --- Génération du code : dernier numéro de l'année ---

    @Query("SELECT MAX(CAST(SUBSTRING(i.code, 10, 6) AS int)) FROM Intervention i " +
            "WHERE SUBSTRING(i.code, 5, 4) = :annee")
    Integer findDernierNumeroParAnnee(@Param("annee") String annee);
}
