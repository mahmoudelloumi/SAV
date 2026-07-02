package com.sav.repository;

import com.sav.model.JournalAudit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Repository pour l'entité JournalAudit.
 */
@Repository
public interface JournalAuditRepository extends JpaRepository<JournalAudit, Long>, JpaSpecificationExecutor<JournalAudit> {

    Page<JournalAudit> findByEffectueParId(Long utilisateurId, Pageable pageable);

    Page<JournalAudit> findByTypeEntite(String typeEntite, Pageable pageable);

    Page<JournalAudit> findByAction(String action, Pageable pageable);
}
