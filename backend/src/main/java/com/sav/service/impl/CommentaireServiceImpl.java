package com.sav.service.impl;

import com.sav.exception.BusinessException;
import com.sav.exception.ResourceNotFoundException;
import com.sav.model.Commentaire;
import com.sav.model.Intervention;
import com.sav.model.Utilisateur;
import com.sav.model.enums.Role;
import com.sav.repository.CommentaireRepository;
import com.sav.repository.InterventionRepository;
import com.sav.repository.UtilisateurRepository;
import com.sav.service.CommentaireService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implémentation de la messagerie liée aux interventions.
 * Suit le style d'InterventionServiceImpl (helpers findXxxOrThrow, hydrater).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CommentaireServiceImpl implements CommentaireService {

    private final CommentaireRepository commentaireRepository;
    private final InterventionRepository interventionRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Override
    public Commentaire ajouterCommentaire(Long interventionId, String contenu, Long auteurId) {
        if (contenu == null || contenu.isBlank()) {
            throw new BusinessException("Le contenu du message est obligatoire");
        }

        Intervention intervention = findInterventionOrThrow(interventionId);
        Utilisateur auteur = findUtilisateurOrThrow(auteurId);

        verifierAcces(intervention, auteur);

        Commentaire commentaire = Commentaire.builder()
                .contenu(contenu)
                .intervention(intervention)
                .auteur(auteur)
                .build();

        Commentaire saved = commentaireRepository.save(commentaire);
        log.info("Message ajouté à l'intervention {} par l'utilisateur {}", intervention.getCode(), auteurId);
        return hydrater(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Commentaire> getCommentairesParIntervention(Long interventionId, Long demandeurId, Pageable pageable) {
        Intervention intervention = findInterventionOrThrow(interventionId);
        Utilisateur demandeur = findUtilisateurOrThrow(demandeurId);

        verifierAcces(intervention, demandeur);

        Page<Commentaire> page = commentaireRepository.findByInterventionId(interventionId, pageable);
        page.forEach(this::hydrater);
        return page;
    }

    // ========== MÉTHODES PRIVÉES ==========

    /**
     * Règle d'accès à la messagerie d'une intervention :
     *  - DIRECTEUR : accès total ;
     *  - CLIENT : uniquement s'il est le propriétaire de l'intervention ;
     *  - EMPLOYE_SAV : uniquement s'il est l'employé affecté.
     * Si aucun employé n'est encore affecté, client et directeur peuvent déjà
     * échanger — ce n'est pas une erreur, seulement l'absence d'un 3e participant.
     */
    private void verifierAcces(Intervention intervention, Utilisateur utilisateur) {
        if (utilisateur.getRole() == Role.DIRECTEUR) {
            return;
        }
        if (utilisateur.getRole() == Role.CLIENT
                && intervention.getClient().getId().equals(utilisateur.getId())) {
            return;
        }
        if (utilisateur.getRole() == Role.EMPLOYE_SAV
                && intervention.getEmployeAffecte() != null
                && intervention.getEmployeAffecte().getId().equals(utilisateur.getId())) {
            return;
        }
        throw new AccessDeniedException("Vous n'avez pas accès à la messagerie de cette intervention");
    }

    /**
     * Force l'initialisation du proxy LAZY `auteur` avant la fermeture de la
     * session Hibernate (open-in-view désactivé), pour que les getters
     * transitoires (auteurNom, auteurRole, ...) restent accessibles lors de
     * la sérialisation JSON faite par le contrôleur.
     */
    private Commentaire hydrater(Commentaire c) {
        c.getAuteur().getNom();
        return c;
    }

    private Intervention findInterventionOrThrow(Long id) {
        return interventionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention", "id", id));
    }

    private Utilisateur findUtilisateurOrThrow(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", id));
    }
}
