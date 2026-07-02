package com.sav.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception levée lors d'une transition d'état invalide sur une intervention.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidStateTransitionException extends RuntimeException {

    public InvalidStateTransitionException(String etatActuel, String etatDemande) {
        super(String.format("Transition d'état invalide : '%s' → '%s'", etatActuel, etatDemande));
    }
}
