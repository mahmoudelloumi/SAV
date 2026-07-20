package com.sav.repository;

import com.sav.model.BaseConnaissance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour la base de connaissances du chatbot.
 */
@Repository
public interface BaseConnaissanceRepository extends JpaRepository<BaseConnaissance, Long> {

    List<BaseConnaissance> findByActifTrueOrderByCategorieAscTitreAsc();

    List<BaseConnaissance> findAllByOrderByCategorieAscTitreAsc();
}
