package com.sav.service.impl;

import com.sav.model.Client;
import com.sav.model.Employe;
import com.sav.model.Utilisateur;
import com.sav.model.enums.Role;
import com.sav.exception.BusinessException;
import com.sav.exception.DuplicateResourceException;
import com.sav.exception.ResourceNotFoundException;
import com.sav.repository.ClientRepository;
import com.sav.repository.EmployeRepository;
import com.sav.repository.UtilisateurRepository;
import com.sav.service.FileStorageService;
import com.sav.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Implémentation du service de gestion des utilisateurs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UtilisateurServiceImpl implements UtilisateurService {

    private final EmployeRepository employeRepository;
    private final ClientRepository clientRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    // ========== EMPLOYÉS ==========

    @Override
    public Employe creerEmploye(Employe employe) {
        // Vérifier l'unicité de l'email
        if (employeRepository.existsByEmail(employe.getEmail())) {
            throw new DuplicateResourceException("Utilisateur", "email", employe.getEmail());
        }
        if (employe.getRole() != Role.EMPLOYE_SAV && employe.getRole() != Role.DIRECTEUR) {
            throw new BusinessException("Rôle invalide pour un employé");
        }

        // Code employé généré automatiquement s'il n'est pas fourni.
        if (employe.getCodeEmploye() == null || employe.getCodeEmploye().isBlank()) {
            employe.setCodeEmploye(genererCodeEmploye());
        } else if (employeRepository.existsByCodeEmploye(employe.getCodeEmploye())) {
            throw new DuplicateResourceException("Employé", "codeEmploye", employe.getCodeEmploye());
        }

        // Allowlisting : champs contrôlés par le serveur.
        employe.setId(null);
        employe.setMotDePasse(passwordEncoder.encode(employe.getMotDePasse()));
        employe.setActif(true);
        employe.setTwoFactorActive(false);
        employe.setTwoFactorSecret(null);

        Employe saved = employeRepository.save(employe);
        log.info("Employé créé : {} ({})", saved.getCodeEmploye(), saved.getEmail());
        return saved;
    }

    // Génère un code employé unique pour l'année en cours (format EMP-AAAA-NNN).
    private synchronized String genererCodeEmploye() {
        String annee = String.valueOf(java.time.LocalDateTime.now().getYear());
        Integer dernier = employeRepository.findDernierNumeroEmployeParAnnee(annee);
        int prochain = (dernier != null ? dernier : 0) + 1;
        return String.format("EMP-%s-%03d", annee, prochain);
    }

    @Override
    @Transactional(readOnly = true)
    public Employe getEmployeById(Long id) {
        return employeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employé", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Employe> getTousEmployes(Pageable pageable) {
        return employeRepository.findAll(pageable);
    }

    @Override
    public Employe modifierEmploye(Long id, Employe employe) {
        Employe existant = employeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employé", "id", id));

        // On ne copie que les champs modifiables : email/codeEmploye/role/actif/id
        // ne sont jamais lus depuis le JSON entrant, l'entité chargée fait foi.
        existant.setNom(employe.getNom());
        existant.setPrenom(employe.getPrenom());
        existant.setTelephone(employe.getTelephone());
        existant.setAdresse(employe.getAdresse());
        existant.setSpecialite(employe.getSpecialite());

        if (employe.getMotDePasse() != null && !employe.getMotDePasse().isBlank()) {
            existant.setMotDePasse(passwordEncoder.encode(employe.getMotDePasse()));
        }

        Employe saved = employeRepository.save(existant);
        log.info("Employé modifié : {}", saved.getCodeEmploye());
        return saved;
    }

    @Override
    public void supprimerEmploye(Long id) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employé", "id", id));
        employeRepository.delete(employe);
        log.info("Employé supprimé : {}", employe.getCodeEmploye());
    }

    // ========== CLIENTS ==========

    @Override
    public Client creerClientParStaff(Client client, MultipartFile documentMatricule) {
        if (client.getEmail() == null || client.getEmail().isBlank()) {
            throw new BusinessException("L'email du client est obligatoire.");
        }
        if (client.getRaisonSociale() == null || client.getRaisonSociale().isBlank()) {
            throw new BusinessException("La raison sociale (société) est obligatoire.");
        }
        if (utilisateurRepository.existsByEmail(client.getEmail())) {
            throw new DuplicateResourceException("Utilisateur", "email", client.getEmail());
        }
        // Matricule fiscal facultatif, mais unique s'il est renseigné.
        String matricule = client.getMatriculeFiscal() != null && !client.getMatriculeFiscal().isBlank()
                ? client.getMatriculeFiscal().trim() : null;
        if (matricule != null && clientRepository.existsByMatriculeFiscal(matricule)) {
            throw new DuplicateResourceException("Client", "matriculeFiscal", matricule);
        }
        // RNE facultatif, unique s'il est renseigné.
        String rne = client.getRne() != null && !client.getRne().isBlank() ? client.getRne().trim() : null;
        if (rne != null && clientRepository.existsByRne(rne)) {
            throw new DuplicateResourceException("Client", "rne", rne);
        }

        // Allowlisting : le serveur fixe l'identité technique et la sécurité.
        client.setId(null);
        client.setMatriculeFiscal(matricule);
        client.setRne(rne);
        client.setRole(Role.CLIENT);
        client.setActif(true);
        client.setTwoFactorActive(false);
        client.setTwoFactorSecret(null);
        // Le client définira son mot de passe à sa première connexion (email → code).
        client.setMotDePasse(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
        client.setMotDePasseAInitialiser(true);

        // Pièce justificative du matricule fiscal (facultative ici, contrairement au self-service).
        if (documentMatricule != null && !documentMatricule.isEmpty()) {
            String chemin = fileStorageService.stocker(documentMatricule, "matricules");
            client.setDocumentMatriculeChemin(chemin);
            client.setDocumentMatriculeNom(documentMatricule.getOriginalFilename());
            client.setDocumentMatriculeType(documentMatricule.getContentType());
        }

        Client saved = clientRepository.save(client);
        log.info("Client créé par le staff : {} ({})", saved.getRaisonSociale(), saved.getEmail());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Client getClientById(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Client> getTousClients(Pageable pageable) {
        return clientRepository.findAll(pageable);
    }

    @Override
    public Client modifierClient(Long id, Client data) {
        Client existant = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", id));

        // Champs modifiables uniquement ; email et matricule fiscal (identité /
        // connexion) ne sont jamais modifiés depuis le JSON entrant.
        existant.setNom(data.getNom());
        existant.setPrenom(data.getPrenom());
        existant.setTelephone(data.getTelephone());
        existant.setAdresse(data.getAdresse());
        existant.setRaisonSociale(data.getRaisonSociale());
        existant.setRne(data.getRne());

        Client saved = clientRepository.save(existant);
        log.info("Client modifié : {}", saved.getEmail());
        return saved;
    }

    @Override
    public void supprimerClient(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", id));
        if (client.isActif()) {
            throw new BusinessException("Impossible de supprimer un client actif. Désactivez-le d'abord.");
        }
        clientRepository.delete(client);
        log.info("Client supprimé : {}", client.getEmail());
    }

    @Override
    @Transactional(readOnly = true)
    public Resource getDocumentMatricule(Long clientId) {
        Client client = getClientById(clientId);
        if (client.getDocumentMatriculeChemin() == null) {
            throw new ResourceNotFoundException("Document", "clientId", clientId);
        }
        return fileStorageService.charger(client.getDocumentMatriculeChemin());
    }

    // ========== PHOTO DE PROFIL ==========

    @Override
    @Transactional(readOnly = true)
    public Utilisateur getUtilisateurById(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", id));
    }

    @Override
    public Utilisateur mettreAJourPhotoProfil(Long userId, MultipartFile fichier) {
        Utilisateur utilisateur = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));

        String type = fichier.getContentType();
        if (type == null || !type.startsWith("image/")) {
            throw new BusinessException("La photo de profil doit être une image (JPEG, PNG ou GIF)");
        }

        String chemin = fileStorageService.stocker(fichier, "photos-profil");
        utilisateur.setPhotoProfilChemin(chemin);
        utilisateur.setPhotoProfilType(type);
        Utilisateur saved = utilisateurRepository.save(utilisateur);
        log.info("Photo de profil mise à jour pour l'utilisateur {}", userId);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Resource getPhotoProfil(Long userId) {
        Utilisateur utilisateur = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));
        if (utilisateur.getPhotoProfilChemin() == null) {
            throw new ResourceNotFoundException("Photo de profil", "userId", userId);
        }
        return fileStorageService.charger(utilisateur.getPhotoProfilChemin());
    }

    // ========== COMMUN ==========

    @Override
    public void activerDesactiverCompte(Long id, boolean actif) {
        // Repository de base : fonctionne aussi bien pour un employé que pour un client.
        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", id));
        utilisateur.setActif(actif);
        utilisateurRepository.save(utilisateur);
        log.info("Compte {} {}", utilisateur.getEmail(), actif ? "activé" : "désactivé");
    }
}
