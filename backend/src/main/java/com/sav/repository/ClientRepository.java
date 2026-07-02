package com.sav.repository;

import com.sav.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour l'entité Client.
 * JpaSpecificationExecutor permet la recherche multicritère dynamique.
 */
@Repository
public interface ClientRepository extends JpaRepository<Client, Long>, JpaSpecificationExecutor<Client> {

    Optional<Client> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByMatriculeFiscal(String matriculeFiscal);

    boolean existsByRne(String rne);
}
