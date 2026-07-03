package com.sav.service;

import com.sav.model.Commentaire;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service de messagerie liée à une intervention : chaque intervention porte
 * un fil de discussion (commentaires) entre le client propriétaire,
 * l'employé affecté et le directeur.
 */
public interface CommentaireService {

    Commentaire ajouterCommentaire(Long interventionId, String contenu, Long auteurId);

    Page<Commentaire> getCommentairesParIntervention(Long interventionId, Long demandeurId, Pageable pageable);
}
