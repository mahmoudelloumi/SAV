package com.sav.service;

import com.sav.model.AuthResponse;
import com.sav.model.Client;
import com.sav.model.ConnexionRequest;
import com.sav.model.ReinitialiserMotDePasseRequest;
import com.sav.model.TotpResponse;
import com.sav.model.VerifyTotpRequest;
import org.springframework.web.multipart.MultipartFile;

/**
 * Interface du service d'authentification et de gestion 2FA.
 */
public interface AuthService {

    void registerClient(Client client, MultipartFile documentMatricule);

    AuthResponse login(ConnexionRequest request);

    TotpResponse setupTotp(String email);

    // 2FA par e-mail : génère un code et l'envoie à l'utilisateur.
    void envoyerCodeEmail(String email);

    // Indique si un compte existe pour cet email.
    boolean emailExiste(String email);

    // Indique si le compte doit définir son mot de passe (client créé par le SAV).
    boolean motDePasseAInitialiser(String email);

    // Définit le mot de passe (1re connexion) après vérification du code e-mail,
    // puis connecte l'utilisateur (renvoie le token).
    AuthResponse definirMotDePasse(String email, String code, String nouveauMotDePasse);

    AuthResponse verifyTotp(VerifyTotpRequest request);

    // Vérifie le code TOTP pour la réinitialisation (sans changer le mot de passe).
    void verifierCodeReinitialisation(VerifyTotpRequest request);

    void reinitialiserMotDePasse(ReinitialiserMotDePasseRequest request);
}
