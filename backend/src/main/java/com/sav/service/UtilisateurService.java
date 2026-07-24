package com.sav.service;

import com.sav.model.Client;
import com.sav.model.Employe;
import com.sav.model.Utilisateur;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

/**
 * Interface du service de gestion des utilisateurs.
 */
public interface UtilisateurService {

    // --- Employés ---
    Employe creerEmploye(Employe employe);
    Employe getEmployeById(Long id);
    Page<Employe> getTousEmployes(Pageable pageable);
    Employe modifierEmploye(Long id, Employe employe);
    void supprimerEmploye(Long id);

    // --- Clients ---
    Client creerClientParStaff(Client client, MultipartFile documentMatricule);
    Client getClientById(Long id);
    Page<Client> getTousClients(Pageable pageable);
    Client modifierClient(Long id, Client client);
    void supprimerClient(Long id);
    Resource getDocumentMatricule(Long clientId);

    // --- Commun ---
    void activerDesactiverCompte(Long id, boolean actif);

    // --- Photo de profil ---
    Utilisateur getUtilisateurById(Long id);
    Utilisateur mettreAJourPhotoProfil(Long userId, MultipartFile fichier);
    Resource getPhotoProfil(Long userId);
}
