package com.sav.service.impl;

import com.sav.exception.ResourceNotFoundException;
import com.sav.model.BaseConnaissance;
import com.sav.repository.BaseConnaissanceRepository;
import com.sav.service.BaseConnaissanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BaseConnaissanceServiceImpl implements BaseConnaissanceService {

    private final BaseConnaissanceRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<BaseConnaissance> getToutes() {
        return repository.findAllByOrderByCategorieAscTitreAsc();
    }

    @Override
    public BaseConnaissance creer(BaseConnaissance entree) {
        entree.setId(null);
        BaseConnaissance saved = repository.save(entree);
        log.info("Entrée de connaissance créée : {}", saved.getTitre());
        return saved;
    }

    @Override
    public BaseConnaissance modifier(Long id, BaseConnaissance entree) {
        BaseConnaissance existant = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Connaissance", "id", id));
        existant.setCategorie(entree.getCategorie());
        existant.setTitre(entree.getTitre());
        existant.setContenu(entree.getContenu());
        existant.setMotsCles(entree.getMotsCles());
        existant.setActif(entree.isActif());
        return repository.save(existant);
    }

    @Override
    public void supprimer(Long id) {
        BaseConnaissance existant = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Connaissance", "id", id));
        repository.delete(existant);
        log.info("Entrée de connaissance supprimée : {}", existant.getTitre());
    }
}
