package com.sav.service.impl;

import com.sav.model.*;
import com.sav.model.enums.CategorieIntervention;
import com.sav.model.enums.EtatIntervention;
import com.sav.model.enums.Priorite;
import com.sav.model.enums.Role;
import com.sav.exception.*;
import com.sav.repository.*;
import com.sav.service.ChatbotService;
import com.sav.service.EmailService;
import com.sav.service.FileStorageService;
import com.sav.service.InterventionService;
import com.sav.service.RapportPdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Implémentation du service de gestion des interventions SAV.
 * Contient toute la logique métier : création, affectation, transitions d'état, clôture.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InterventionServiceImpl implements InterventionService {

    private final InterventionRepository interventionRepository;
    private final ClientRepository clientRepository;
    private final EmployeRepository employeRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final HistoriqueInterventionRepository historiqueRepository;
    private final PieceJointeRepository pieceJointeRepository;
    private final FileStorageService fileStorageService;
    private final RapportPdfService rapportPdfService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final ChatbotService chatbotService;

    // États considérés comme « charge active » d'un technicien (ni terminé, ni annulé).
    private static final List<EtatIntervention> ETATS_ACTIFS = List.of(
            EtatIntervention.NOUVELLE, EtatIntervention.AFFECTEE, EtatIntervention.ACCEPTEE,
            EtatIntervention.EN_COURS, EtatIntervention.EN_ATTENTE);

    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Matrice des transitions d'état autorisées.
     */
    private static final Map<EtatIntervention, Set<EtatIntervention>> TRANSITIONS_AUTORISEES = Map.of(
            EtatIntervention.NOUVELLE, EnumSet.of(EtatIntervention.AFFECTEE, EtatIntervention.ANNULEE),
            EtatIntervention.AFFECTEE, EnumSet.of(EtatIntervention.ACCEPTEE, EtatIntervention.ANNULEE),
            EtatIntervention.ACCEPTEE, EnumSet.of(EtatIntervention.EN_COURS, EtatIntervention.EN_ATTENTE, EtatIntervention.ANNULEE),
            EtatIntervention.EN_ATTENTE, EnumSet.of(EtatIntervention.EN_COURS, EtatIntervention.ANNULEE),
            EtatIntervention.EN_COURS, EnumSet.of(EtatIntervention.TERMINEE, EtatIntervention.EN_ATTENTE),
            EtatIntervention.TERMINEE, EnumSet.noneOf(EtatIntervention.class),
            EtatIntervention.ANNULEE, EnumSet.noneOf(EtatIntervention.class)
    );

    // ========== CRÉATION ==========

    @Override
    public Intervention creerIntervention(Intervention intervention, Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));

        // Allowlisting : seuls description/priorite viennent du JSON entrant ;
        // tout le reste (code, état, client, prix, dates) est fixé côté serveur
        // dans une nouvelle instance, jamais l'objet reçu tel quel.
        Intervention nouvelle = Intervention.builder()
                .code(genererCode())
                .description(intervention.getDescription())
                .priorite(intervention.getPriorite() != null ? intervention.getPriorite() : Priorite.NORMAL)
                .categorie(intervention.getCategorie() != null ? intervention.getCategorie() : CategorieIntervention.AUTRE)
                .etat(EtatIntervention.NOUVELLE)
                .client(client)
                // Le client est déjà authentifié sur son compte : aucune confirmation par
                // code n'est requise (contrairement aux interventions créées par le staff).
                .confirmee(true)
                .build();

        Intervention saved = interventionRepository.save(nouvelle);
        enregistrerHistorique(saved, "etat", null, "NOUVELLE", client);

        log.info("Intervention créée : {} par le client {}", saved.getCode(), clientId);
        return hydrater(saved);
    }

    @Override
    public Intervention creerInterventionParStaff(CreerInterventionStaffRequest req, Long userId) {
        Utilisateur auteur = findUtilisateurOrThrow(userId);
        Client client = resoudreOuCreerClient(req);

        // Code de confirmation à 6 chiffres, envoyé au client par e-mail.
        String codeConfirmation = String.format("%06d", RANDOM.nextInt(1_000_000));

        Intervention nouvelle = Intervention.builder()
                .code(genererCode())
                .description(req.getDescription())
                .priorite(req.getPriorite() != null && !req.getPriorite().isBlank()
                        ? Priorite.valueOf(req.getPriorite()) : Priorite.NORMAL)
                .categorie(req.getCategorie() != null && !req.getCategorie().isBlank()
                        ? CategorieIntervention.valueOf(req.getCategorie()) : CategorieIntervention.AUTRE)
                .etat(EtatIntervention.NOUVELLE)
                .client(client)
                .confirmee(false)                 // en attente de confirmation du client
                .codeConfirmation(codeConfirmation)
                .build();

        Intervention saved = interventionRepository.save(nouvelle);
        enregistrerHistorique(saved, "etat", null, "NOUVELLE (en attente de confirmation)", auteur);
        log.info("Intervention {} créée par le staff {} pour le client {} (en attente de confirmation)",
                saved.getCode(), userId, client.getEmail());

        // Envoi du code d'acceptation au client (asynchrone, n'interrompt pas la création).
        try {
            emailService.envoyerCodeConfirmation(client.getEmail(), saved.getCode(), codeConfirmation);
        } catch (Exception e) {
            log.error("Code de confirmation non envoyé pour {} : {}", saved.getCode(), e.getMessage());
        }
        return hydrater(saved);
    }

    // Retourne le client existant (clientId) ou en crée un nouveau (partiel) à partir
    // des informations saisies par l'employé/directeur.
    private Client resoudreOuCreerClient(CreerInterventionStaffRequest req) {
        if (req.getClientId() != null) {
            return clientRepository.findById(req.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Client", "id", req.getClientId()));
        }
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            throw new BusinessException("L'email du client est obligatoire pour créer un nouveau client.");
        }
        if (utilisateurRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new BusinessException("Un compte existe déjà avec cet email. Sélectionnez le client existant.");
        }
        if (req.getRaisonSociale() == null || req.getRaisonSociale().isBlank()) {
            throw new BusinessException("La société (raison sociale) est obligatoire.");
        }
        // Matricule fiscal facultatif, mais unique s'il est renseigné.
        String matricule = req.getMatriculeFiscal() != null && !req.getMatriculeFiscal().isBlank()
                ? req.getMatriculeFiscal().trim() : null;
        if (matricule != null && clientRepository.existsByMatriculeFiscal(matricule)) {
            throw new BusinessException("Un client existe déjà avec ce matricule fiscal.");
        }

        Client client = new Client();
        client.setRaisonSociale(req.getRaisonSociale());
        client.setPrenom(req.getPrenom() != null ? req.getPrenom() : "");
        client.setNom(req.getNom() != null ? req.getNom() : "");
        client.setEmail(req.getEmail());
        client.setTelephone(req.getTelephone());
        client.setMatriculeFiscal(matricule);
        client.setRole(Role.CLIENT);
        client.setActif(true);
        client.setTwoFactorActive(false);
        // Mot de passe aléatoire + à initialiser : le client le définira à sa première
        // connexion (email → code reçu par e-mail → nouveau mot de passe).
        client.setMotDePasse(passwordEncoder.encode(UUID.randomUUID().toString()));
        client.setMotDePasseAInitialiser(true);
        Client saved = clientRepository.save(client);
        log.info("Nouveau client créé par le staff : {} ({})", saved.getRaisonSociale(), saved.getEmail());
        return saved;
    }

    @Override
    public void confirmerIntervention(String codeIntervention, String codeConfirmation) {
        Intervention intervention = interventionRepository.findByCode(codeIntervention)
                .orElseThrow(() -> new BusinessException("Aucune intervention ne correspond à ce code."));

        if (intervention.isConfirmee()) {
            throw new BusinessException("Cette intervention est déjà confirmée.");
        }
        if (intervention.getCodeConfirmation() == null
                || !intervention.getCodeConfirmation().equals(codeConfirmation)) {
            throw new BusinessException("Le code de confirmation est invalide.");
        }

        intervention.setConfirmee(true);
        intervention.setCodeConfirmation(null);
        interventionRepository.save(intervention);
        log.info("Intervention {} confirmée par le client.", codeIntervention);
    }

    @Override
    public void renvoyerCodeConfirmation(Long interventionId) {
        Intervention intervention = hydrater(findInterventionOrThrow(interventionId));
        if (intervention.isConfirmee()) {
            throw new BusinessException("Cette intervention est déjà confirmée.");
        }
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        intervention.setCodeConfirmation(code);
        interventionRepository.save(intervention);

        String emailClient = intervention.getClient() != null ? intervention.getClient().getEmail() : null;
        emailService.envoyerCodeConfirmation(emailClient, intervention.getCode(), code);
        log.info("Nouveau code de confirmation renvoyé pour {}", intervention.getCode());
    }

    // ========== CONSULTATION ==========

    @Override
    @Transactional(readOnly = true)
    public Intervention getInterventionById(Long id) {
        return findInterventionOrThrow(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Intervention getInterventionByCode(String code) {
        return interventionRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention", "code", code));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Intervention> getToutesInterventions(Pageable pageable) {
        return interventionRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Intervention> getInterventionsParClient(Long clientId, Pageable pageable) {
        return interventionRepository.findByClientId(clientId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Intervention> getInterventionsParEmploye(Long employeId, Pageable pageable) {
        return interventionRepository.findByEmployeAffecteId(employeId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Intervention> getInterventionsParEtat(String etat, Pageable pageable) {
        EtatIntervention etatEnum = EtatIntervention.valueOf(etat);
        return interventionRepository.findByEtat(etatEnum, pageable);
    }

    // ========== ACTIONS DIRECTEUR ==========

    @Override
    public Intervention affecterIntervention(Long interventionId, AffecterInterventionRequest request, Long directeurId) {
        Intervention intervention = findInterventionOrThrow(interventionId);
        exigerConfirmation(intervention);
        Employe employe = employeRepository.findById(request.getEmployeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employé", "id", request.getEmployeId()));
        Utilisateur directeur = findUtilisateurOrThrow(directeurId);

        validerTransition(intervention.getEtat(), EtatIntervention.AFFECTEE);

        String ancienEmploye = intervention.getEmployeAffecte() != null
                ? intervention.getEmployeAffecte().getNom() + " " + intervention.getEmployeAffecte().getPrenom()
                : null;

        intervention.setEmployeAffecte(employe);
        intervention.setEtat(EtatIntervention.AFFECTEE);

        enregistrerHistorique(intervention, "employeAffecte", ancienEmploye,
                employe.getNom() + " " + employe.getPrenom(), directeur);
        enregistrerHistorique(intervention, "etat", intervention.getEtat().name(), "AFFECTEE", directeur);

        Intervention saved = interventionRepository.save(intervention);
        log.info("Intervention {} affectée à l'employé {} par le directeur {}",
                saved.getCode(), employe.getCodeEmploye(), directeurId);
        return hydrater(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SuggestionTechnicienResponse suggererTechnicien(Long interventionId) {
        Intervention intervention = findInterventionOrThrow(interventionId);

        // Techniciens éligibles : employés SAV actifs (le directeur n'est pas affectable).
        List<Employe> techniciens = employeRepository.findByActifTrue().stream()
                .filter(e -> e.getRole() == Role.EMPLOYE_SAV)
                .toList();
        if (techniciens.isEmpty()) {
            throw new BusinessException("Aucun technicien actif n'est disponible pour l'affectation.");
        }

        // Statistiques par technicien : charge active + expérience (interventions terminées).
        List<ChatbotService.TechnicienCandidat> candidats = techniciens.stream()
                .map(e -> new ChatbotService.TechnicienCandidat(
                        e.getId(),
                        (e.getPrenom() + " " + e.getNom()).trim(),
                        e.getSpecialite(),
                        interventionRepository.countChargeActive(e.getId(), ETATS_ACTIFS),
                        interventionRepository.countInterventionsTermineesParEmploye(e.getId())))
                // Classement déterministe : d'abord la plus faible charge, puis la plus grande
                // expérience. Sert de repli et fournit une liste ordonnée à l'IA.
                .sorted(java.util.Comparator
                        .comparingLong(ChatbotService.TechnicienCandidat::chargeActive)
                        .thenComparing(java.util.Comparator.comparingLong(
                                ChatbotService.TechnicienCandidat::interventionsTerminees).reversed()))
                .toList();

        ChatbotService.SuggestionAffectation suggestion = chatbotService.suggererTechnicien(
                intervention.getDescription(),
                intervention.getPriorite() != null ? intervention.getPriorite().name() : "NORMAL",
                candidats);

        String nomChoisi = candidats.stream()
                .filter(c -> c.id().equals(suggestion.employeId()))
                .map(ChatbotService.TechnicienCandidat::nom)
                .findFirst().orElse(null);

        List<SuggestionTechnicienResponse.Candidat> candidatsDto = candidats.stream()
                .map(c -> SuggestionTechnicienResponse.Candidat.builder()
                        .id(c.id())
                        .nom(c.nom())
                        .specialite(c.specialite())
                        .chargeActive(c.chargeActive())
                        .interventionsTerminees(c.interventionsTerminees())
                        .recommande(c.id().equals(suggestion.employeId()))
                        .build())
                .toList();

        return SuggestionTechnicienResponse.builder()
                .employeId(suggestion.employeId())
                .employeNom(nomChoisi)
                .raison(suggestion.raison())
                .candidats(candidatsDto)
                .build();
    }

    @Override
    public Intervention modifierPriorite(Long interventionId, String nouvellePriorite, Long directeurId) {
        Intervention intervention = findInterventionOrThrow(interventionId);
        Utilisateur directeur = findUtilisateurOrThrow(directeurId);

        String anciennePriorite = intervention.getPriorite().name();
        Priorite prioriteEnum = Priorite.valueOf(nouvellePriorite);
        intervention.setPriorite(prioriteEnum);

        enregistrerHistorique(intervention, "priorite", anciennePriorite, nouvellePriorite, directeur);

        Intervention saved = interventionRepository.save(intervention);
        log.info("Priorité de l'intervention {} modifiée : {} → {}", saved.getCode(), anciennePriorite, nouvellePriorite);
        return hydrater(saved);
    }

    @Override
    public Intervention annulerIntervention(Long interventionId, String motif, Long directeurId) {
        Intervention intervention = findInterventionOrThrow(interventionId);
        Utilisateur directeur = findUtilisateurOrThrow(directeurId);

        validerTransition(intervention.getEtat(), EtatIntervention.ANNULEE);

        if (motif == null || motif.isBlank()) {
            throw new BusinessException("Un motif est obligatoire pour annuler une intervention");
        }

        String ancienEtat = intervention.getEtat().name();
        intervention.setEtat(EtatIntervention.ANNULEE);

        enregistrerHistorique(intervention, "etat", ancienEtat, "ANNULEE", directeur);
        enregistrerHistorique(intervention, "motifAnnulation", null, motif, directeur);

        Intervention saved = interventionRepository.save(intervention);
        log.info("Intervention {} annulée par le directeur {}", saved.getCode(), directeurId);
        return hydrater(saved);
    }

    // ========== ACTIONS EMPLOYÉ ==========

    @Override
    public Intervention prendreEnCharge(Long interventionId, Long employeId) {
        Intervention intervention = findInterventionOrThrow(interventionId);
        exigerConfirmation(intervention);
        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employé", "id", employeId));

        // Un seul employé peut prendre une intervention : le premier arrivé.
        if (intervention.getEmployeAffecte() != null) {
            throw new BusinessException("Cette intervention a déjà été prise en charge par un autre employé");
        }

        validerTransition(intervention.getEtat(), EtatIntervention.AFFECTEE);

        intervention.setEmployeAffecte(employe);
        intervention.setEtat(EtatIntervention.AFFECTEE);

        enregistrerHistorique(intervention, "employeAffecte", null,
                employe.getNom() + " " + employe.getPrenom(), employe);
        enregistrerHistorique(intervention, "etat", "NOUVELLE", "AFFECTEE", employe);

        Intervention saved = interventionRepository.save(intervention);
        log.info("Intervention {} prise en charge par l'employé {}", saved.getCode(), employeId);
        return hydrater(saved);
    }

    @Override
    public Intervention accepterIntervention(Long interventionId, Long employeId) {
        Intervention intervention = findInterventionOrThrow(interventionId);
        Utilisateur employe = findUtilisateurOrThrow(employeId);

        exigerConfirmation(intervention);
        verifierAffectation(intervention, employeId);
        validerTransition(intervention.getEtat(), EtatIntervention.ACCEPTEE);

        String ancienEtat = intervention.getEtat().name();
        intervention.setEtat(EtatIntervention.ACCEPTEE);

        enregistrerHistorique(intervention, "etat", ancienEtat, "ACCEPTEE", employe);

        Intervention saved = interventionRepository.save(intervention);
        log.info("Intervention {} acceptée par l'employé {}", saved.getCode(), employeId);
        return hydrater(saved);
    }

    @Override
    public Intervention changerEtat(Long interventionId, ChangerEtatRequest request, Long employeId) {
        Intervention intervention = findInterventionOrThrow(interventionId);
        Utilisateur employe = findUtilisateurOrThrow(employeId);

        exigerConfirmation(intervention);
        // Le directeur peut changer l'état sans être affecté ; l'employé doit l'être.
        if (employe.getRole() != Role.DIRECTEUR) {
            verifierAffectation(intervention, employeId);
        }

        EtatIntervention nouvelEtat = EtatIntervention.valueOf(request.getNouvelEtat());
        validerTransition(intervention.getEtat(), nouvelEtat);

        // Vérifier le motif pour les mises en attente
        if (nouvelEtat == EtatIntervention.EN_ATTENTE && (request.getMotif() == null || request.getMotif().isBlank())) {
            throw new BusinessException("Un motif est obligatoire pour mettre une intervention en attente");
        }

        String ancienEtat = intervention.getEtat().name();
        intervention.setEtat(nouvelEtat);

        enregistrerHistorique(intervention, "etat", ancienEtat, nouvelEtat.name(), employe);
        if (request.getMotif() != null && !request.getMotif().isBlank()) {
            enregistrerHistorique(intervention, "motif", null, request.getMotif(), employe);
        }

        Intervention saved = interventionRepository.save(intervention);
        log.info("État de l'intervention {} modifié : {} → {} par l'employé {}",
                saved.getCode(), ancienEtat, nouvelEtat, employeId);
        return hydrater(saved);
    }

    @Override
    public Intervention ajouterRapport(Long interventionId, String rapport, Long employeId) {
        Intervention intervention = findInterventionOrThrow(interventionId);
        Utilisateur employe = findUtilisateurOrThrow(employeId);

        verifierAffectation(intervention, employeId);

        String ancienRapport = intervention.getRapportTechnique();
        intervention.setRapportTechnique(rapport);

        enregistrerHistorique(intervention, "rapportTechnique", ancienRapport, "Rapport mis à jour", employe);

        Intervention saved = interventionRepository.save(intervention);
        log.info("Rapport technique ajouté à l'intervention {} par l'employé {}", saved.getCode(), employeId);
        return hydrater(saved);
    }

    @Override
    public Intervention modifierPrix(Long interventionId, BigDecimal prixEstime, BigDecimal prixFinal, Long employeId) {
        Intervention intervention = findInterventionOrThrow(interventionId);
        Utilisateur employe = findUtilisateurOrThrow(employeId);

        exigerConfirmation(intervention);
        // Le directeur peut modifier les prix sans être affecté ; l'employé doit l'être.
        if (employe.getRole() != Role.DIRECTEUR) {
            verifierAffectation(intervention, employeId);
        }

        if (prixEstime != null) {
            String ancien = intervention.getPrixEstime() != null ? intervention.getPrixEstime().toString() : null;
            intervention.setPrixEstime(prixEstime);
            enregistrerHistorique(intervention, "prixEstime", ancien, prixEstime.toString(), employe);
        }

        if (prixFinal != null) {
            String ancien = intervention.getPrixFinal() != null ? intervention.getPrixFinal().toString() : null;
            intervention.setPrixFinal(prixFinal);
            enregistrerHistorique(intervention, "prixFinal", ancien, prixFinal.toString(), employe);
        }

        Intervention saved = interventionRepository.save(intervention);
        log.info("Prix modifié pour l'intervention {} par l'employé {}", saved.getCode(), employeId);
        return hydrater(saved);
    }

    @Override
    public Intervention cloturerIntervention(Long interventionId, CloturerInterventionRequest request, Long userId) {
        Intervention intervention = findInterventionOrThrow(interventionId);
        Utilisateur utilisateur = findUtilisateurOrThrow(userId);
        boolean estDirecteur = utilisateur.getRole() == Role.DIRECTEUR;

        exigerConfirmation(intervention);

        EtatIntervention ancienEtat = intervention.getEtat();

        if (estDirecteur) {
            // Le directeur peut clôturer sans être affecté, depuis n'importe quel état actif.
            if (ancienEtat == EtatIntervention.TERMINEE || ancienEtat == EtatIntervention.ANNULEE) {
                throw new BusinessException("Cette intervention est déjà " + ancienEtat.name().toLowerCase() + ".");
            }
        } else {
            // L'employé doit être affecté et respecter la transition EN_COURS → TERMINEE.
            verifierAffectation(intervention, userId);
            validerTransition(ancienEtat, EtatIntervention.TERMINEE);
        }

        // Mettre à jour les champs de clôture
        intervention.setRapportTechnique(request.getRapportTechnique());
        intervention.setPrixFinal(request.getPrixFinal());
        intervention.setEtat(EtatIntervention.TERMINEE);
        intervention.setDateCloture(LocalDateTime.now());

        enregistrerHistorique(intervention, "etat", ancienEtat.name(), "TERMINEE", utilisateur);
        enregistrerHistorique(intervention, "rapportTechnique", null, "Rapport final ajouté", utilisateur);
        enregistrerHistorique(intervention, "prixFinal", null, request.getPrixFinal().toString(), utilisateur);

        Intervention saved = interventionRepository.save(intervention);
        log.info("Intervention {} clôturée par l'utilisateur {} ({})", saved.getCode(), userId,
                estDirecteur ? "directeur" : "employé");
        return hydrater(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public void envoyerRapportParEmail(Long interventionId) {
        Intervention intervention = hydrater(findInterventionOrThrow(interventionId));

        if (intervention.getEtat() != EtatIntervention.TERMINEE) {
            throw new BusinessException("Le rapport n'est disponible que pour une intervention clôturée.");
        }

        byte[] pdf = rapportPdfService.genererRapportCloture(intervention);
        String emailClient = intervention.getClient() != null ? intervention.getClient().getEmail() : null;
        String emailEmploye = intervention.getEmployeAffecte() != null ? intervention.getEmployeAffecte().getEmail() : null;

        if (emailClient == null || emailClient.isBlank()) {
            throw new BusinessException("Le client n'a pas d'adresse e-mail enregistrée.");
        }
        emailService.envoyerRapportCloture(emailClient, emailEmploye, intervention.getCode(), pdf);
        log.info("Rapport de l'intervention {} envoyé à la demande", intervention.getCode());
    }

    // ========== PIÈCES JOINTES ==========

    @Override
    public List<PieceJointe> ajouterPiecesJointes(Long interventionId, MultipartFile[] fichiers, Long userId) {
        Intervention intervention = findInterventionOrThrow(interventionId);
        Utilisateur utilisateur = findUtilisateurOrThrow(userId);

        List<PieceJointe> ajoutees = new ArrayList<>();
        if (fichiers == null) return ajoutees;

        for (MultipartFile fichier : fichiers) {
            if (fichier == null || fichier.isEmpty()) continue;
            String chemin = fileStorageService.stocker(fichier, "pieces-jointes");
            PieceJointe piece = PieceJointe.builder()
                    .nomFichier(fichier.getOriginalFilename() != null ? fichier.getOriginalFilename() : "fichier")
                    .cheminFichier(chemin)
                    .typeFichier(fichier.getContentType() != null ? fichier.getContentType() : "application/octet-stream")
                    .tailleFichier(fichier.getSize())
                    .intervention(intervention)
                    .telechargePar(utilisateur)
                    .build();
            ajoutees.add(pieceJointeRepository.save(piece));
        }
        log.info("{} pièce(s) jointe(s) ajoutée(s) à l'intervention {}", ajoutees.size(), intervention.getCode());
        return ajoutees;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PieceJointe> getPiecesJointes(Long interventionId) {
        return pieceJointeRepository.findByInterventionId(interventionId);
    }

    @Override
    @Transactional(readOnly = true)
    public PieceJointe getPieceJointe(Long pieceId) {
        return pieceJointeRepository.findById(pieceId)
                .orElseThrow(() -> new ResourceNotFoundException("Pièce jointe", "id", pieceId));
    }

    @Override
    @Transactional(readOnly = true)
    public Resource getContenuPieceJointe(Long pieceId) {
        return fileStorageService.charger(getPieceJointe(pieceId).getCheminFichier());
    }

    // ========== MÉTHODES PRIVÉES ==========

    /**
     * Génère le prochain code intervention pour l'année en cours (format SAV-AAAA-NNNNNN).
     * Le compteur se réinitialise chaque année. `synchronized` évite les collisions
     * de numéro sous charge concurrente.
     */
    private synchronized String genererCode() {
        String annee = String.valueOf(LocalDateTime.now().getYear());
        Integer dernierNumero = interventionRepository.findDernierNumeroParAnnee(annee);
        int prochainNumero = (dernierNumero != null ? dernierNumero : 0) + 1;
        return String.format("SAV-%s-%06d", annee, prochainNumero);
    }

    /**
     * Force l'initialisation des proxies LAZY (client, employeAffecte) avant que la
     * session Hibernate ne se ferme (open-in-view désactivé), pour que les getters
     * transitoires de Intervention (clientNom, employeAffecteNom, ...) restent
     * accessibles lors de la sérialisation JSON faite par le contrôleur.
     */
    private Intervention hydrater(Intervention i) {
        i.getClient().getNom();
        if (i.getEmployeAffecte() != null) {
            i.getEmployeAffecte().getNom();
        }
        return i;
    }

    private Intervention findInterventionOrThrow(Long id) {
        return interventionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention", "id", id));
    }

    private Utilisateur findUtilisateurOrThrow(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", id));
    }

    private void validerTransition(EtatIntervention etatActuel, EtatIntervention etatDemande) {
        Set<EtatIntervention> transitions = TRANSITIONS_AUTORISEES.get(etatActuel);
        if (transitions == null || !transitions.contains(etatDemande)) {
            throw new InvalidStateTransitionException(etatActuel.name(), etatDemande.name());
        }
    }

    private void verifierAffectation(Intervention intervention, Long employeId) {
        if (intervention.getEmployeAffecte() == null || !intervention.getEmployeAffecte().getId().equals(employeId)) {
            throw new BusinessException("Vous n'êtes pas affecté à cette intervention");
        }
    }

    // Bloque toute action de traitement tant que le client n'a pas confirmé l'intervention.
    private void exigerConfirmation(Intervention intervention) {
        if (!intervention.isConfirmee()) {
            throw new BusinessException(
                    "L'intervention doit d'abord être confirmée par le client (code) avant toute action.");
        }
    }

    private void enregistrerHistorique(Intervention intervention, String champ, String ancienneValeur, String nouvelleValeur, Utilisateur utilisateur) {
        HistoriqueIntervention historique = HistoriqueIntervention.builder()
                .champModifie(champ)
                .ancienneValeur(ancienneValeur)
                .nouvelleValeur(nouvelleValeur)
                .intervention(intervention)
                .modifiePar(utilisateur)
                .build();
        historiqueRepository.save(historique);
    }
}
