package com.sav.service.impl;

import com.sav.model.AuthResponse;
import com.sav.model.Client;
import com.sav.model.ConnexionRequest;
import com.sav.model.HistoriqueConnexion;
import com.sav.model.ReinitialiserMotDePasseRequest;
import com.sav.model.TotpResponse;
import com.sav.model.Utilisateur;
import com.sav.model.VerifyTotpRequest;
import com.sav.model.enums.Role;
import com.sav.exception.BusinessException;
import com.sav.exception.DuplicateResourceException;
import com.sav.exception.ResourceNotFoundException;
import com.sav.repository.ClientRepository;
import com.sav.repository.HistoriqueConnexionRepository;
import com.sav.repository.UtilisateurRepository;
import com.sav.security.JwtService;
import com.sav.security.TotpService;
import com.sav.security.UserDetailsImpl;
import com.sav.service.AuthService;
import com.sav.service.EmailService;
import com.sav.service.FileStorageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Implémentation du service d'authentification.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final ClientRepository clientRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final TotpService totpService;
    private final HistoriqueConnexionRepository historiqueConnexionRepository;
    private final HttpServletRequest servletRequest;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;

    private static final java.security.SecureRandom RANDOM = new java.security.SecureRandom();
    private static final int OTP_VALIDITE_MINUTES = 5;

    @Override
    @Transactional
    public void registerClient(Client client, MultipartFile documentMatricule) {
        // La pièce justificative du matricule fiscal est obligatoire.
        if (documentMatricule == null || documentMatricule.isEmpty()) {
            throw new BusinessException("La pièce jointe du matricule fiscal est obligatoire");
        }

        if (utilisateurRepository.existsByEmail(client.getEmail())) {
            throw new DuplicateResourceException("Utilisateur", "email", client.getEmail());
        }
        if (clientRepository.existsByMatriculeFiscal(client.getMatriculeFiscal())) {
            throw new DuplicateResourceException("Client", "matriculeFiscal", client.getMatriculeFiscal());
        }
        // RNE optionnel : on ne vérifie l'unicité que s'il est renseigné.
        if (client.getRne() != null && !client.getRne().isBlank()
                && clientRepository.existsByRne(client.getRne())) {
            throw new DuplicateResourceException("Client", "rne", client.getRne());
        }

        // Allowlisting : ces champs sont contrôlés par le serveur, jamais par le JSON entrant.
        client.setId(null);
        client.setMotDePasse(passwordEncoder.encode(client.getMotDePasse()));
        client.setRole(Role.CLIENT);
        client.setActif(true);
        client.setTwoFactorActive(false);
        client.setTwoFactorSecret(null);
        if (client.getRne() != null && client.getRne().isBlank()) {
            client.setRne(null); // évite une chaîne vide qui violerait l'unicité entre plusieurs clients
        }

        // Stockage de la pièce justificative.
        String chemin = fileStorageService.stocker(documentMatricule, "matricules");
        client.setDocumentMatriculeChemin(chemin);
        client.setDocumentMatriculeNom(documentMatricule.getOriginalFilename());
        client.setDocumentMatriculeType(documentMatricule.getContentType());

        clientRepository.save(client);
        log.info("Nouveau client inscrit : {} (document : {})", client.getEmail(), client.getDocumentMatriculeNom());
    }

    @Override
    @Transactional
    public AuthResponse login(ConnexionRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Email ou mot de passe incorrect"));

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMotDePasse())
            );
        } catch (Exception e) {
            logConnectionAttempt(utilisateur, false, "Mauvais mot de passe");
            throw new BadCredentialsException("Email ou mot de passe incorrect");
        }

        if (!utilisateur.isActif()) {
            logConnectionAttempt(utilisateur, false, "Compte inactif");
            throw new BusinessException("Votre compte est désactivé. Veuillez contacter le support.");
        }

        // Le 2FA est obligatoire pour TOUS les rôles (client, employé, directeur).
        // Le mot de passe seul ne suffit jamais : on renvoie toujours une réponse
        // partielle demandant l'étape 2FA (activation la 1ère fois, puis code).
        boolean deuxiemeFacteurDejaActif = utilisateur.isTwoFactorActive();
        logConnectionAttempt(utilisateur, true,
                deuxiemeFacteurDejaActif ? "Connexion partielle (2FA requis)"
                        : "Connexion partielle (2FA requis pour activation)");
        return AuthResponse.builder()
                .email(utilisateur.getEmail())
                .twoFactorRequired(true)
                .twoFactorActive(deuxiemeFacteurDejaActif)
                .build();
    }

    @Override
    @Transactional
    public TotpResponse setupTotp(String email) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", email));

        if (utilisateur.isTwoFactorActive()) {
            throw new BusinessException("Le 2FA est déjà activé pour ce compte");
        }

        String secret = totpService.generateSecret();
        utilisateur.setTwoFactorSecret(secret);
        utilisateurRepository.save(utilisateur);

        String qrCodeUri = totpService.getQrCodeImageUri(secret, utilisateur.getEmail());

        log.info("Configuration 2FA initiée pour {}", email);
        return TotpResponse.builder()
                .secret(secret)
                .qrCodeImageUri(qrCodeUri)
                .build();
    }

    @Override
    @Transactional
    public void envoyerCodeEmail(String email) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", email));

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        utilisateur.setEmailOtpCode(code);
        utilisateur.setEmailOtpExpiration(LocalDateTime.now().plusMinutes(OTP_VALIDITE_MINUTES));
        utilisateurRepository.save(utilisateur);

        emailService.envoyerCodeAuthentification(utilisateur.getEmail(), code, OTP_VALIDITE_MINUTES);
        log.info("Code 2FA e-mail envoyé à {}", email);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean emailExiste(String email) {
        return utilisateurRepository.findByEmail(email).isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean motDePasseAInitialiser(String email) {
        return utilisateurRepository.findByEmail(email)
                .map(Utilisateur::isMotDePasseAInitialiser)
                .orElse(false);
    }

    @Override
    @Transactional
    public AuthResponse definirMotDePasse(String email, String code, String nouveauMotDePasse) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", email));

        if (!utilisateur.isMotDePasseAInitialiser()) {
            throw new BusinessException("Ce compte a déjà un mot de passe. Connectez-vous normalement.");
        }
        // Vérification du code reçu par e-mail (prouve la possession de l'adresse).
        boolean codeOk = utilisateur.getEmailOtpCode() != null
                && utilisateur.getEmailOtpExpiration() != null
                && utilisateur.getEmailOtpExpiration().isAfter(LocalDateTime.now())
                && utilisateur.getEmailOtpCode().equals(code);
        if (!codeOk) {
            throw new BusinessException("Le code de vérification est invalide ou expiré.");
        }
        validerForceMotDePasse(nouveauMotDePasse);

        utilisateur.setMotDePasse(passwordEncoder.encode(nouveauMotDePasse));
        utilisateur.setMotDePasseAInitialiser(false);
        utilisateur.setEmailOtpCode(null);
        utilisateur.setEmailOtpExpiration(null);
        utilisateurRepository.save(utilisateur);

        logConnectionAttempt(utilisateur, true, "Mot de passe défini (1re connexion)");
        log.info("Mot de passe défini pour {} (1re connexion)", email);
        return generateAuthResponse(utilisateur);
    }

    @Override
    @Transactional
    public AuthResponse verifyTotp(VerifyTotpRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", request.getEmail()));

        // 1) Code reçu par e-mail (méthode alternative), non expiré.
        boolean okEmail = utilisateur.getEmailOtpCode() != null
                && utilisateur.getEmailOtpExpiration() != null
                && utilisateur.getEmailOtpExpiration().isAfter(LocalDateTime.now())
                && utilisateur.getEmailOtpCode().equals(request.getCode());

        // 2) Sinon, code Google Authenticator (TOTP).
        boolean okTotp = !okEmail
                && utilisateur.getTwoFactorSecret() != null
                && totpService.verifyCode(utilisateur.getTwoFactorSecret(), request.getCode());

        if (!okEmail && !okTotp) {
            logConnectionAttempt(utilisateur, false, "Code 2FA invalide");
            throw new BusinessException("Le code de vérification est invalide ou expiré.");
        }

        if (okEmail) {
            // Code e-mail consommé (usage unique).
            utilisateur.setEmailOtpCode(null);
            utilisateur.setEmailOtpExpiration(null);
        }
        // Le 2FA est considéré actif dès la 1ère validation réussie (TOTP configuré).
        if (okTotp && !utilisateur.isTwoFactorActive()) {
            utilisateur.setTwoFactorActive(true);
            log.info("2FA (Authenticator) activé avec succès pour {}", request.getEmail());
        }
        utilisateurRepository.save(utilisateur);

        logConnectionAttempt(utilisateur, true,
                okEmail ? "Connexion réussie avec 2FA (e-mail)" : "Connexion réussie avec 2FA (Authenticator)");
        return generateAuthResponse(utilisateur);
    }

    @Override
    @Transactional(readOnly = true)
    public void verifierCodeReinitialisation(VerifyTotpRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("Aucun compte n'est associé à cet email."));
        if (!codeVerificationValide(utilisateur, request.getCode())) {
            throw new BusinessException("Le code est invalide ou expiré.");
        }
    }

    @Override
    @Transactional
    public void reinitialiserMotDePasse(ReinitialiserMotDePasseRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", request.getEmail()));

        // Vérification par code Google Authenticator OU code reçu par e-mail.
        if (!codeVerificationValide(utilisateur, request.getCode())) {
            throw new BusinessException("Le code est invalide ou expiré.");
        }

        validerForceMotDePasse(request.getNouveauMotDePasse());
        utilisateur.setMotDePasse(passwordEncoder.encode(request.getNouveauMotDePasse()));
        // Consomme le code e-mail s'il a été utilisé (usage unique).
        if (utilisateur.getEmailOtpCode() != null && utilisateur.getEmailOtpCode().equals(request.getCode())) {
            utilisateur.setEmailOtpCode(null);
            utilisateur.setEmailOtpExpiration(null);
        }
        utilisateurRepository.save(utilisateur);
        log.info("Mot de passe réinitialisé pour {}", utilisateur.getEmail());
    }

    // Vrai si le code correspond à un code e-mail (non expiré) OU au code Authenticator.
    private boolean codeVerificationValide(Utilisateur utilisateur, String code) {
        boolean okEmail = utilisateur.getEmailOtpCode() != null
                && utilisateur.getEmailOtpExpiration() != null
                && utilisateur.getEmailOtpExpiration().isAfter(LocalDateTime.now())
                && utilisateur.getEmailOtpCode().equals(code);
        boolean okTotp = !okEmail
                && utilisateur.getTwoFactorSecret() != null
                && totpService.verifyCode(utilisateur.getTwoFactorSecret(), code);
        return okEmail || okTotp;
    }

    // Même règle que côté inscription : 8+ car., 1 maj., 1 min., 1 chiffre, 1 spécial.
    private void validerForceMotDePasse(String mdp) {
        if (mdp == null || !mdp.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$")) {
            throw new BusinessException(
                    "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
        }
    }

    private AuthResponse generateAuthResponse(Utilisateur utilisateur) {
        UserDetailsImpl userDetails = UserDetailsImpl.build(utilisateur);
        String token = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(utilisateur.getId())
                .email(utilisateur.getEmail())
                .nom(utilisateur.getNom())
                .prenom(utilisateur.getPrenom())
                .role(utilisateur.getRole().name())
                .twoFactorRequired(false)
                .twoFactorActive(utilisateur.isTwoFactorActive())
                .build();
    }

    private void logConnectionAttempt(Utilisateur utilisateur, boolean succes, String motif) {
        String ip = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");

        HistoriqueConnexion hc = HistoriqueConnexion.builder()
                .utilisateur(utilisateur)
                .adresseIp(ip)
                .navigateur(userAgent)
                .succes(succes)
                .motifEchec(succes ? null : motif)
                .dateConnexion(LocalDateTime.now())
                .build();
        historiqueConnexionRepository.save(hc);
    }
}
