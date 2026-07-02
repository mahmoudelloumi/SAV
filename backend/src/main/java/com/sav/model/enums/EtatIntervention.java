package com.sav.model.enums;

/**
 * Énumération des différents états possibles d'une intervention SAV.
 */
public enum EtatIntervention {
    NOUVELLE,       // Demande créée par le client
    AFFECTEE,       // Demande affectée à un employé par le directeur
    ACCEPTEE,       // Demande acceptée par l'employé
    EN_ATTENTE,     // En attente de pièces ou de validation
    EN_COURS,       // Traitement en cours par l'employé
    TERMINEE,       // Intervention clôturée (facturée/réparée)
    ANNULEE         // Intervention annulée
}
