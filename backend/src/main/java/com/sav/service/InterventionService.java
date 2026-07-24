package com.sav.service;

import com.sav.model.AffecterInterventionRequest;
import com.sav.model.ChangerEtatRequest;
import com.sav.model.CloturerInterventionRequest;
import com.sav.model.CreerInterventionStaffRequest;
import com.sav.model.Intervention;
import com.sav.model.PieceJointe;
import com.sav.model.SuggestionTechnicienResponse;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

/**
 * Interface du service de gestion des interventions SAV.
 */
public interface InterventionService {

    // --- Création ---
    Intervention creerIntervention(Intervention intervention, Long clientId);
    Intervention creerInterventionParStaff(CreerInterventionStaffRequest request, Long userId);
    void confirmerIntervention(String codeIntervention, String codeConfirmation);
    void renvoyerCodeConfirmation(Long interventionId);

    // --- Consultation ---
    Intervention getInterventionById(Long id);
    Intervention getInterventionByCode(String code);
    Page<Intervention> getToutesInterventions(Pageable pageable);
    Page<Intervention> getInterventionsParClient(Long clientId, Pageable pageable);
    Page<Intervention> getInterventionsParEmploye(Long employeId, Pageable pageable);
    Page<Intervention> getInterventionsParEtat(String etat, Pageable pageable);

    // --- Actions Directeur ---
    Intervention affecterIntervention(Long interventionId, AffecterInterventionRequest request, Long directeurId);
    SuggestionTechnicienResponse suggererTechnicien(Long interventionId);
    Intervention modifierPriorite(Long interventionId, String nouvellePriorite, Long directeurId);
    Intervention annulerIntervention(Long interventionId, String motif, Long directeurId);

    // --- Actions Employé ---
    Intervention prendreEnCharge(Long interventionId, Long employeId);
    Intervention accepterIntervention(Long interventionId, Long employeId);
    Intervention changerEtat(Long interventionId, ChangerEtatRequest request, Long employeId);
    Intervention ajouterRapport(Long interventionId, String rapport, Long employeId);
    Intervention modifierPrix(Long interventionId, BigDecimal prixEstime, BigDecimal prixFinal, Long employeId);
    Intervention cloturerIntervention(Long interventionId, CloturerInterventionRequest request, Long employeId);

    // --- Rapport de clôture ---
    void envoyerRapportParEmail(Long interventionId);

    // --- Pièces jointes ---
    List<PieceJointe> ajouterPiecesJointes(Long interventionId, MultipartFile[] fichiers, Long userId);
    List<PieceJointe> getPiecesJointes(Long interventionId);
    PieceJointe getPieceJointe(Long pieceId);
    Resource getContenuPieceJointe(Long pieceId);
}
