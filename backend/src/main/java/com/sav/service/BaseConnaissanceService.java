package com.sav.service;

import com.sav.model.BaseConnaissance;

import java.util.List;

/**
 * Gestion de la base de connaissances du chatbot (CRUD).
 */
public interface BaseConnaissanceService {

    List<BaseConnaissance> getToutes();

    BaseConnaissance creer(BaseConnaissance entree);

    BaseConnaissance modifier(Long id, BaseConnaissance entree);

    void supprimer(Long id);
}
