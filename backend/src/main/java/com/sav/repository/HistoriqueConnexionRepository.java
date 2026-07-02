package com.sav.repository;

import com.sav.model.HistoriqueConnexion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository pour l'entité HistoriqueConnexion.
 */
@Repository
public interface HistoriqueConnexionRepository extends JpaRepository<HistoriqueConnexion, Long> {

    Page<HistoriqueConnexion> findByUtilisateurId(Long utilisateurId, Pageable pageable);

    Page<HistoriqueConnexion> findBySucces(boolean succes, Pageable pageable);

    long countByUtilisateurIdAndSuccesFalse(Long utilisateurId);
}
