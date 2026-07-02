package com.sav.repository;

import com.sav.model.HistoriqueIntervention;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository pour l'entité HistoriqueIntervention.
 */
@Repository
public interface HistoriqueInterventionRepository extends JpaRepository<HistoriqueIntervention, Long> {

    Page<HistoriqueIntervention> findByInterventionId(Long interventionId, Pageable pageable);
}
