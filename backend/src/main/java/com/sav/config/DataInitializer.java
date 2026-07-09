package com.sav.config;

import com.sav.model.Employe;
import com.sav.model.Utilisateur;
import com.sav.model.enums.Role;
import com.sav.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Initialise des données par défaut au démarrage de l'application.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "admin@sav.com";
    private static final String ADMIN_MDP = "Admin@123";

    @Override
    public void run(String... args) throws Exception {
        // Crée le compte Directeur par défaut UNIQUEMENT s'il n'existe pas encore.
        // On ne touche jamais à un compte existant : mot de passe et 2FA (secret
        // Google Authenticator) sont ainsi conservés d'un démarrage à l'autre.
        if (utilisateurRepository.findByEmail(ADMIN_EMAIL).isPresent()) {
            return;
        }

        Employe directeur = new Employe();
        directeur.setNom("Admin");
        directeur.setPrenom("Directeur");
        directeur.setEmail(ADMIN_EMAIL);
        directeur.setMotDePasse(passwordEncoder.encode(ADMIN_MDP));
        directeur.setTelephone("00000000");
        directeur.setRole(Role.DIRECTEUR);
        directeur.setActif(true);
        directeur.setTwoFactorActive(false);
        directeur.setTwoFactorSecret(null);
        directeur.setCodeEmploye("DIR-001");
        utilisateurRepository.save(directeur);
        log.info("Compte Directeur créé (Email: {} / Mdp: {})", ADMIN_EMAIL, ADMIN_MDP);
    }
}
