package com.sav.service;

import com.sav.exception.BusinessException;
import com.sav.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Service de stockage de fichiers sur le disque local.
 * Valide le type et la taille selon la configuration `application.upload.*`.
 */
@Service
@Slf4j
public class FileStorageService {

    private final Path racine;
    private final List<String> typesAutorises;
    private final long tailleMax;

    public FileStorageService(
            @Value("${application.upload.directory}") String directory,
            @Value("${application.upload.allowed-types}") String allowedTypes,
            @Value("${application.upload.max-size}") long maxSize) {
        this.racine = Paths.get(directory).toAbsolutePath().normalize();
        this.typesAutorises = Arrays.asList(allowedTypes.split(","));
        this.tailleMax = maxSize;
    }

    /**
     * Stocke un fichier dans un sous-dossier et renvoie son chemin relatif
     * (utilisable ensuite avec {@link #charger(String)}).
     */
    public String stocker(MultipartFile fichier, String sousDossier) {
        if (fichier == null || fichier.isEmpty()) {
            throw new BusinessException("Le fichier est vide");
        }
        if (fichier.getSize() > tailleMax) {
            throw new BusinessException("Le fichier dépasse la taille maximale autorisée (10 Mo)");
        }
        String type = fichier.getContentType();
        if (type == null || !typesAutorises.contains(type)) {
            throw new BusinessException("Type de fichier non autorisé. Formats acceptés : PDF, JPEG, PNG, GIF");
        }

        try {
            Path dossier = racine.resolve(sousDossier).normalize();
            Files.createDirectories(dossier);

            String nomUnique = UUID.randomUUID() + extension(fichier.getOriginalFilename());
            Path cible = dossier.resolve(nomUnique);
            Files.copy(fichier.getInputStream(), cible);

            String cheminRelatif = sousDossier + "/" + nomUnique;
            log.info("Fichier stocké : {}", cheminRelatif);
            return cheminRelatif;
        } catch (IOException e) {
            throw new BusinessException("Impossible d'enregistrer le fichier : " + e.getMessage());
        }
    }

    /**
     * Charge un fichier précédemment stocké sous forme de {@link Resource}.
     */
    public Resource charger(String cheminRelatif) {
        try {
            Path fichier = racine.resolve(cheminRelatif).normalize();
            // Sécurité : empêcher toute sortie du dossier racine (path traversal).
            if (!fichier.startsWith(racine)) {
                throw new ResourceNotFoundException("Fichier", "chemin", cheminRelatif);
            }
            Resource resource = new UrlResource(fichier.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("Fichier", "chemin", cheminRelatif);
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Fichier", "chemin", cheminRelatif);
        }
    }

    private String extension(String nomFichier) {
        if (nomFichier == null) return "";
        int point = nomFichier.lastIndexOf('.');
        return point >= 0 ? nomFichier.substring(point) : "";
    }
}
