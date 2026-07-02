package com.sav.repository;

import com.sav.model.Commentaire;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository pour l'entité Commentaire.
 */
@Repository
public interface CommentaireRepository extends JpaRepository<Commentaire, Long> {

    Page<Commentaire> findByInterventionId(Long interventionId, Pageable pageable);
}
