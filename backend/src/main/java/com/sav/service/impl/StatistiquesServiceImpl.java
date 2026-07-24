package com.sav.service.impl;

import com.sav.model.Employe;
import com.sav.model.StatistiquesResponse;
import com.sav.model.enums.EtatIntervention;
import com.sav.model.enums.Priorite;
import com.sav.repository.EmployeRepository;
import com.sav.repository.InterventionRepository;
import com.sav.service.StatistiquesService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Implémentation du service de statistiques.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatistiquesServiceImpl implements StatistiquesService {

    private final InterventionRepository interventionRepository;
    private final EmployeRepository employeRepository;

    @Override
    public StatistiquesResponse getStatistiques() {
        // Tableau de bord : agrégats GLOBAUX (toutes périodes) ; l'évolution reste sur
        // une fenêtre par défaut (12 derniers mois / 30 derniers jours).
        LocalDateTime debut = YearMonth.now().minusMonths(11).atDay(1).atStartOfDay();
        LocalDateTime fin = LocalDateTime.now();
        return buildStatistiques(debut, fin, false);
    }

    @Override
    public StatistiquesResponse getStatistiquesParPeriode(LocalDateTime debut, LocalDateTime fin) {
        // Vue filtrée : TOUS les agrégats sont restreints à la période choisie.
        return buildStatistiques(debut, fin, true);
    }

    /**
     * @param filtrerAgregats si true, les comptages et le CA (par état, priorité, total,
     *                        performance et CA par employé) sont restreints à [debut, fin] ;
     *                        sinon ils portent sur l'ensemble des données (tableau de bord).
     *                        Les courbes d'évolution portent toujours sur [debut, fin].
     */
    private StatistiquesResponse buildStatistiques(LocalDateTime debut, LocalDateTime fin, boolean filtrerAgregats) {
        // Interventions par état
        Map<String, Long> parEtat = new LinkedHashMap<>();
        for (EtatIntervention etat : EtatIntervention.values()) {
            parEtat.put(etat.name(), filtrerAgregats
                    ? interventionRepository.countByEtatAndDateCreationBetween(etat, debut, fin)
                    : interventionRepository.countByEtat(etat));
        }

        // Interventions par priorité
        Map<String, Long> parPriorite = new LinkedHashMap<>();
        for (Priorite priorite : Priorite.values()) {
            parPriorite.put(priorite.name(), filtrerAgregats
                    ? interventionRepository.countByPrioriteAndDateCreationBetween(priorite, debut, fin)
                    : interventionRepository.countByPriorite(priorite));
        }

        // Chiffre d'affaires total (période si filtré, sinon global)
        BigDecimal caTotal = filtrerAgregats
                ? interventionRepository.calculerChiffreAffairesParPeriode(debut, fin)
                : interventionRepository.calculerChiffreAffairesTotal();
        YearMonth moisCourant = YearMonth.now();
        BigDecimal caMois = interventionRepository.calculerChiffreAffairesParPeriode(
                moisCourant.atDay(1).atStartOfDay(),
                moisCourant.atEndOfMonth().atTime(23, 59, 59)
        );

        // Évolution mensuelle : on pré-remplit TOUS les mois de la période à 0 pour
        // obtenir une courbe continue, puis on applique les comptes réels.
        Map<String, Long> evolutionMensuelle = new LinkedHashMap<>();
        for (YearMonth m = YearMonth.from(debut); !m.isAfter(YearMonth.from(fin)); m = m.plusMonths(1)) {
            evolutionMensuelle.put(m.toString(), 0L); // clé au format "AAAA-MM"
        }
        List<Object[]> evolution = interventionRepository.countParMois(debut, fin);
        for (Object[] row : evolution) {
            evolutionMensuelle.put((String) row[0], ((Number) row[1]).longValue());
        }

        // Évolution quotidienne : 30 derniers jours (se terminant à `fin`), 0 par défaut.
        Map<String, Long> evolutionQuotidienne = new LinkedHashMap<>();
        LocalDate finJour = fin.toLocalDate();
        LocalDate debutJour = finJour.minusDays(29);
        for (LocalDate d = debutJour; !d.isAfter(finJour); d = d.plusDays(1)) {
            evolutionQuotidienne.put(d.toString(), 0L); // clé "AAAA-MM-JJ"
        }
        List<Object[]> parJour = interventionRepository.countParJour(debutJour.atStartOfDay(), fin);
        for (Object[] row : parJour) {
            evolutionQuotidienne.put((String) row[0], ((Number) row[1]).longValue());
        }

        // Chiffre d'affaires par mois (même fenêtre que l'évolution mensuelle), 0 par défaut.
        Map<String, BigDecimal> caParMois = new LinkedHashMap<>();
        for (YearMonth m = YearMonth.from(debut); !m.isAfter(YearMonth.from(fin)); m = m.plusMonths(1)) {
            caParMois.put(m.toString(), BigDecimal.ZERO);
        }
        for (Object[] row : interventionRepository.chiffreAffairesParMois(debut, fin)) {
            caParMois.put((String) row[0], new BigDecimal(row[1].toString()));
        }

        // Chiffre d'affaires par jour (30 derniers jours), 0 par défaut.
        Map<String, BigDecimal> caParJour = new LinkedHashMap<>();
        for (LocalDate d = debutJour; !d.isAfter(finJour); d = d.plusDays(1)) {
            caParJour.put(d.toString(), BigDecimal.ZERO);
        }
        for (Object[] row : interventionRepository.chiffreAffairesParJour(debutJour.atStartOfDay(), fin)) {
            caParJour.put((String) row[0], new BigDecimal(row[1].toString()));
        }

        // Performance employés (nombre d'interventions terminées + CA généré),
        // filtré sur la période (par date de clôture) en mode filtré.
        Map<String, Long> performanceEmployes = new LinkedHashMap<>();
        Map<String, BigDecimal> chiffreAffairesEmployes = new LinkedHashMap<>();
        List<Employe> employes = employeRepository.findByActifTrue();
        for (Employe emp : employes) {
            String nomComplet = emp.getNom() + " " + emp.getPrenom();
            long count = filtrerAgregats
                    ? interventionRepository.countTermineesParEmployeEtPeriode(emp.getId(), debut, fin)
                    : interventionRepository.countInterventionsTermineesParEmploye(emp.getId());
            BigDecimal ca = filtrerAgregats
                    ? interventionRepository.calculerChiffreAffairesParEmployeEtPeriode(emp.getId(), debut, fin)
                    : interventionRepository.calculerChiffreAffairesParEmploye(emp.getId());
            performanceEmployes.put(nomComplet, count);
            chiffreAffairesEmployes.put(nomComplet, ca);
        }

        // Compteurs globaux (période si filtré, sinon ensemble des données).
        long total = filtrerAgregats
                ? interventionRepository.countByDateCreationBetween(debut, fin)
                : interventionRepository.count();
        long enCours = filtrerAgregats
                ? interventionRepository.countByEtatAndDateCreationBetween(EtatIntervention.EN_COURS, debut, fin)
                : interventionRepository.countByEtat(EtatIntervention.EN_COURS);
        long terminees = filtrerAgregats
                ? interventionRepository.countByEtatAndDateCreationBetween(EtatIntervention.TERMINEE, debut, fin)
                : interventionRepository.countByEtat(EtatIntervention.TERMINEE);

        return StatistiquesResponse.builder()
                .interventionsParEtat(parEtat)
                .interventionsParPriorite(parPriorite)
                .chiffreAffairesTotal(caTotal)
                .chiffreAffairesMoisCourant(caMois)
                .totalInterventions(total)
                .interventionsEnCours(enCours)
                .interventionsTerminees(terminees)
                .evolutionMensuelle(evolutionMensuelle)
                .evolutionQuotidienne(evolutionQuotidienne)
                .performanceEmployes(performanceEmployes)
                .chiffreAffairesEmployes(chiffreAffairesEmployes)
                .chiffreAffairesParMois(caParMois)
                .chiffreAffairesParJour(caParJour)
                .build();
    }
}
