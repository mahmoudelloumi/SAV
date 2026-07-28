package com.sav.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sav.model.BaseConnaissance;
import com.sav.model.ChatbotRequest;
import com.sav.model.ChatbotResponse;
import com.sav.repository.BaseConnaissanceRepository;
import com.sav.repository.InterventionRepository;
import com.sav.service.ChatbotService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Implémentation du chatbot SAV basée sur Ollama (IA locale, gratuite).
 * <p>
 * Le modèle reçoit un prompt système qui le contraint à répondre en JSON :
 * {"reponse": "...", "creerIntervention": bool, "description": "...", "priorite": "..."}.
 * Le mode {@code format: json} d'Ollama garantit une sortie JSON valide.
 */
@Service
@Slf4j
public class ChatbotServiceImpl implements ChatbotService {

    private static final Set<String> PRIORITES_VALIDES =
            Set.of("TRES_URGENT", "URGENT", "NORMAL", "FACULTATIF");

    private static final String PROMPT_SYSTEME = """
            Tu es l'assistant virtuel du service après-vente (SAV) d'une entreprise.
            Tu discutes avec un client en FRANÇAIS, de façon polie, claire et concise.

            TON OBJECTIF PRINCIPAL : AIDER À RÉSOUDRE le problème directement dans la
            conversation. Tu ne dois PAS proposer systématiquement de créer une demande
            d'intervention : c'est un DERNIER recours, seulement si nécessaire ou si le client
            le demande.

            COMMENT AIDER (dans cet ordre) :
            1. Utilise EN PRIORITÉ la BASE DE CONNAISSANCES ci-dessous (problèmes et solutions).
               Si le problème du client y correspond, donne la solution étape par étape, clairement.
            2. Sinon, propose des vérifications GÉNÉRIQUES et SÛRES adaptées au problème
               (redémarrer l'appareil ou l'application, vérifier les câbles et la connexion
               internet, réessayer, se reconnecter, vider le cache du navigateur, mettre à jour…).
            3. Pose UNE question de clarification si c'est utile pour mieux cibler la solution.
            4. Après avoir donné une solution, invite le client à l'essayer et à te dire si
               cela a résolu son problème. Laisse-lui la chance de résoudre lui-même.

            QUAND créer une demande d'intervention ("creerIntervention" = true) — UNIQUEMENT si :
            - le client le DEMANDE explicitement (ex. "créez une intervention", "envoyez un technicien"), OU
            - la solution proposée n'a PAS fonctionné après que le client l'a essayée, OU
            - le problème nécessite une action de NOTRE équipe sur le site/logiciel/matériel
              (corriger un bug, ajouter un produit, modifier un montant, réparation matérielle), OU
            - le problème n'est pas couvert et ne peut PAS être résolu par des vérifications génériques.
            Dans TOUS les autres cas, laisse "creerIntervention" = false et continue d'aider.

            Tu réponds TOUJOURS avec un objet JSON strict de cette forme :
            {
              "reponse": "ton message au client",
              "creerIntervention": false,
              "description": "",
              "priorite": "NORMAL"
            }

            Règles :
            - Quand "creerIntervention" est true : "description" contient un résumé clair et
              professionnel du problème (2 à 4 phrases, à la 1ère personne du point de vue du client),
              et "reponse" explique que tu proposes de créer la demande car tu ne peux pas résoudre
              le problème à distance.
            - "priorite" : TRES_URGENT (panne bloquante, sécurité), URGENT (impact fort),
              NORMAL (gêne modérée), FACULTATIF (amélioration, question).
            - Ne demande jamais d'informations personnelles (le client est déjà identifié).
            - Reste dans le domaine du SAV. Si la question est hors sujet, ramène poliment
              la conversation au support technique.
            - CHANGEMENT DE SUJET : si le client change de problème, traite UNIQUEMENT le nouveau
              sujet. La "description" d'une intervention ne décrit QUE le problème actuel.
            - Réponds toujours à la DERNIÈRE demande du client.
            - NE JAMAIS INVENTER : n'invente pas d'étapes, de menus, de boutons ou de procédures
              PROPRES à l'application/au logiciel du client (ex. "allez dans Paramètres", "cliquez
              sur Produits") s'ils ne figurent pas dans la base de connaissances. Les vérifications
              génériques et sûres (redémarrer, vérifier la connexion, le câble, réessayer) restent
              autorisées. Pour une action à faire sur le site/logiciel, c'est une intervention.
            - FORMAT : "reponse" doit être du TEXTE SIMPLE, sans balises HTML (jamais de <br>,
              <b>, <p>, etc.). Utilise de vrais retours à la ligne et des tirets "-" pour les listes.
            - SOIS CONCIS : donne la solution utile, pose au MAXIMUM une question de clarification,
              ne répète pas les mêmes conseils.
            - Ne donne JAMAIS de lien inventé. Pour un contact rapide, tu peux inviter le
              client à écrire sur WhatsApp au +216 52 316 703.
            """;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String modele;
    // Seuls les modèles « thinking » (qwen3…) acceptent le paramètre think ; l'envoyer à
    // un modèle qui ne le supporte pas fait échouer Ollama. On le désactive donc pour eux.
    private final boolean supporteThink;
    private final BaseConnaissanceRepository baseConnaissanceRepository;
    // Sources de données pour l'assistant du directeur (statistiques + coordonnées).
    private final com.sav.service.StatistiquesService statistiquesService;
    private final com.sav.repository.ClientRepository clientRepository;
    private final com.sav.repository.EmployeRepository employeRepository;
    private final InterventionRepository interventionRepository;

    public ChatbotServiceImpl(
            @Value("${application.chatbot.ollama-url:http://localhost:11434}") String ollamaUrl,
            @Value("${application.chatbot.model:llama3.2}") String modele,
            @Value("${application.chatbot.timeout-seconds:120}") long timeoutSeconds,
            ObjectMapper objectMapper,
            BaseConnaissanceRepository baseConnaissanceRepository,
            com.sav.service.StatistiquesService statistiquesService,
            com.sav.repository.ClientRepository clientRepository,
            com.sav.repository.EmployeRepository employeRepository,
            InterventionRepository interventionRepository) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));
        this.restClient = RestClient.builder()
                .baseUrl(ollamaUrl)
                .requestFactory(factory)
                .build();
        this.objectMapper = objectMapper;
        this.modele = modele;
        this.supporteThink = modele != null && modele.toLowerCase().startsWith("qwen3");
        this.baseConnaissanceRepository = baseConnaissanceRepository;
        this.statistiquesService = statistiquesService;
        this.clientRepository = clientRepository;
        this.employeRepository = employeRepository;
        this.interventionRepository = interventionRepository;
    }

    // Construit le corps d'une requête Ollama, en ajoutant think=false uniquement pour les
    // modèles « thinking » (qwen3) afin de couper leur réflexion et gagner en vitesse.
    private Map<String, Object> corpsOllama(Map<String, Object> base) {
        java.util.Map<String, Object> corps = new java.util.HashMap<>(base);
        corps.put("model", modele);
        corps.put("stream", false);
        corps.put("keep_alive", "30m");
        if (supporteThink) {
            corps.put("think", false);
        }
        return corps;
    }

    // Précharge le modèle en mémoire au démarrage (dans un thread à part pour ne pas
    // ralentir le démarrage), afin d'éviter la lenteur du tout premier message client.
    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void prechauffer() {
        new Thread(() -> {
            try {
                restClient.post().uri("/api/chat").body(corpsOllama(Map.of(
                        "messages", List.of(Map.of("role", "user", "content", "Bonjour"))
                ))).retrieve().body(JsonNode.class);
                log.info("Modèle {} préchargé en mémoire.", modele);
            } catch (Exception e) {
                log.warn("Préchargement du modèle {} impossible (Ollama démarré ?) : {}", modele, e.getMessage());
            }
        }, "chatbot-warmup").start();
    }

    // Construit le prompt système : instructions + base de connaissances active.
    private String construirePromptSysteme() {
        List<BaseConnaissance> entrees = baseConnaissanceRepository.findByActifTrueOrderByCategorieAscTitreAsc();
        if (entrees.isEmpty()) {
            return PROMPT_SYSTEME;
        }
        StringBuilder sb = new StringBuilder(PROMPT_SYSTEME);
        sb.append("\n\n=== BASE DE CONNAISSANCES DE L'ENTREPRISE ===\n");
        sb.append("Utilise EN PRIORITÉ ces informations pour répondre. Si la réponse s'y trouve, ");
        sb.append("donne-la précisément (coordonnées, horaires, solution). N'invente JAMAIS ");
        sb.append("d'information absente de cette base.\n");
        for (BaseConnaissance e : entrees) {
            sb.append("\n[").append(e.getCategorie()).append("] ").append(e.getTitre()).append("\n");
            sb.append(e.getContenu()).append("\n");
        }
        return sb.toString();
    }

    @Override
    public ChatbotResponse repondre(ChatbotRequest request) {
        return dialoguer(request, construirePromptSysteme());
    }

    @Override
    public ChatbotResponse repondrePublic(ChatbotRequest request) {
        // Prompt visiteur + uniquement les connaissances « entreprise » (horaires, contact…).
        StringBuilder prompt = new StringBuilder(PROMPT_PUBLIC);
        List<BaseConnaissance> entrees = baseConnaissanceRepository.findByActifTrueOrderByCategorieAscTitreAsc()
                .stream()
                .filter(e -> e.getCategorie() == com.sav.model.enums.CategorieConnaissance.ENTREPRISE)
                .toList();
        if (!entrees.isEmpty()) {
            prompt.append("\n\n=== BASE DE CONNAISSANCES (entreprise) ===\n");
            for (BaseConnaissance e : entrees) {
                prompt.append("\n[").append(e.getTitre()).append("]\n").append(e.getContenu()).append("\n");
            }
        }
        return dialoguer(request, prompt.toString());
    }

    @Override
    public ChatbotResponse repondreAdmin(ChatbotRequest request) {
        String prompt = PROMPT_ADMIN + "\n\n" + construireSnapshotDonnees();

        // Construction de la conversation (système = instructions + données, puis historique + question).
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", prompt));
        if (request.getHistorique() != null) {
            int debut = Math.max(0, request.getHistorique().size() - 8);
            request.getHistorique().subList(debut, request.getHistorique().size())
                    .forEach(m -> messages.add(Map.of(
                            "role", "assistant".equals(m.getRole()) ? "assistant" : "user",
                            "content", m.getContent() == null ? "" : m.getContent())));
        }
        messages.add(Map.of("role", "user", "content", request.getMessage()));

        // Réponse en TEXTE (pas de JSON d'intervention) : c'est un assistant d'analyse.
        // Température 0 : réponses déterministes et stables sur les mêmes données.
        Map<String, Object> corps = corpsOllama(Map.of(
                "messages", messages,
                "options", Map.of("temperature", 0.0)
        ));
        try {
            JsonNode reponse = restClient.post()
                    .uri("/api/chat")
                    .body(corps)
                    .retrieve()
                    .body(JsonNode.class);
            String contenu = nettoyerReponse(reponse.path("message").path("content").asText());
            return ChatbotResponse.builder()
                    .reponse(contenu.isBlank()
                            ? "Je n'ai pas trouvé cette information dans les données."
                            : contenu)
                    .creerIntervention(false)
                    .build();
        } catch (Exception e) {
            log.error("Erreur assistant directeur ({}) : {}", modele, e.getMessage());
            return ChatbotResponse.builder()
                    .reponse("Désolé, l'assistant est momentanément indisponible. Vérifiez qu'Ollama est démarré.")
                    .creerIntervention(false)
                    .build();
        }
    }

    // Construit un instantané des données de l'entreprise (statistiques + coordonnées)
    // injecté au modèle pour qu'il réponde UNIQUEMENT à partir de faits réels.
    private String construireSnapshotDonnees() {
        StringBuilder sb = new StringBuilder("=== DONNÉES DE L'ENTREPRISE (source de vérité) ===\n");

        // --- Statistiques globales + par employé ---
        try {
            com.sav.model.StatistiquesResponse s = statistiquesService.getStatistiques();
            sb.append("\n[GLOBAL]\n");
            sb.append("Chiffre d'affaires total : ").append(s.getChiffreAffairesTotal()).append(" DT\n");
            sb.append("Chiffre d'affaires du mois courant : ").append(s.getChiffreAffairesMoisCourant()).append(" DT\n");
            sb.append("Nombre total d'interventions : ").append(s.getTotalInterventions()).append("\n");
            sb.append("Interventions en cours : ").append(s.getInterventionsEnCours()).append("\n");
            sb.append("Interventions terminées : ").append(s.getInterventionsTerminees()).append("\n");
            if (s.getInterventionsParEtat() != null) {
                sb.append("Répartition par état : ").append(s.getInterventionsParEtat()).append("\n");
            }
            if (s.getInterventionsParPriorite() != null) {
                sb.append("Répartition par priorité : ").append(s.getInterventionsParPriorite()).append("\n");
            }

            // Classement des EMPLOYÉS SAV (le DIRECTEUR est exclu : ce n'est pas un
            // « employé » au sens des performances). Inclut CA, terminées, charge et coordonnées.
            record EmpStat(String nom, java.math.BigDecimal ca, long terminees, long charge, String email, String tel) {}
            List<EmpStat> statsEmployes = new ArrayList<>();
            for (com.sav.model.Employe emp : employeRepository.findByActifTrue()) {
                if (emp.getRole() != com.sav.model.enums.Role.EMPLOYE_SAV) continue; // exclut le directeur
                statsEmployes.add(new EmpStat(
                        (emp.getPrenom() + " " + emp.getNom()).trim(),
                        interventionRepository.calculerChiffreAffairesParEmploye(emp.getId()),
                        interventionRepository.countInterventionsTermineesParEmploye(emp.getId()),
                        interventionRepository.countChargeActive(emp.getId(), ETATS_ACTIFS_ADMIN),
                        emp.getEmail(),
                        emp.getTelephone() == null ? "—" : emp.getTelephone()));
            }
            statsEmployes.sort(java.util.Comparator.comparing(EmpStat::ca).reversed());

            sb.append("\n[CLASSEMENT DES EMPLOYÉS PAR CA] (employés SAV uniquement, du plus au moins élevé)\n");
            for (EmpStat es : statsEmployes) {
                sb.append("- ").append(es.nom())
                        .append(" : CA généré = ").append(es.ca()).append(" DT")
                        .append(", interventions terminées = ").append(es.terminees())
                        .append(", interventions en cours = ").append(es.charge()).append("\n");
            }
            // Réponses déjà calculées côté serveur : le modèle DOIT les reprendre telles quelles.
            if (!statsEmployes.isEmpty()) {
                EmpStat topCa = statsEmployes.get(0);
                EmpStat minCa = statsEmployes.get(statsEmployes.size() - 1);
                EmpStat topInt = statsEmployes.stream()
                        .max(java.util.Comparator.comparingLong(EmpStat::terminees)).orElse(topCa);
                EmpStat plusCharge = statsEmployes.stream()
                        .max(java.util.Comparator.comparingLong(EmpStat::charge)).orElse(topCa);
                EmpStat moinsCharge = statsEmployes.stream()
                        .min(java.util.Comparator.comparingLong(EmpStat::charge)).orElse(topCa);
                sb.append("\n[RÉPONSES PRÉ-CALCULÉES] (déjà vérifiées — utilise-les directement, ne recalcule pas)\n");
                sb.append("Employé générant le PLUS de CA : ").append(topCa.nom()).append(" (").append(topCa.ca()).append(" DT)\n");
                sb.append("Employé générant le MOINS de CA : ").append(minCa.nom()).append(" (").append(minCa.ca()).append(" DT)\n");
                sb.append("Employé ayant traité le PLUS d'interventions : ").append(topInt.nom())
                        .append(" (").append(topInt.terminees()).append(" terminées)\n");
                sb.append("Employé le PLUS chargé (interventions en cours) : ").append(plusCharge.nom())
                        .append(" (").append(plusCharge.charge()).append(" en cours")
                        .append(", email : ").append(plusCharge.email())
                        .append(", tél : ").append(plusCharge.tel()).append(")\n");
                sb.append("Employé le MOINS chargé (interventions en cours) : ").append(moinsCharge.nom())
                        .append(" (").append(moinsCharge.charge()).append(" en cours")
                        .append(", email : ").append(moinsCharge.email())
                        .append(", tél : ").append(moinsCharge.tel()).append(")\n");
            }
        } catch (Exception e) {
            log.warn("Snapshot statistiques indisponible : {}", e.getMessage());
        }

        // --- Coordonnées des employés (techniciens + directeur) ---
        sb.append("\n[EMPLOYÉS] (coordonnées)\n");
        for (com.sav.model.Employe emp : employeRepository.findByActifTrue()) {
            long chargeActive = interventionRepository.countChargeActive(emp.getId(), ETATS_ACTIFS_ADMIN);
            sb.append("- ").append(emp.getPrenom()).append(" ").append(emp.getNom())
                    .append(" | rôle : ").append(emp.getRole())
                    .append(" | spécialité : ").append(emp.getSpecialite() == null || emp.getSpecialite().isBlank() ? "Général" : emp.getSpecialite())
                    .append(" | email : ").append(emp.getEmail())
                    .append(" | tél : ").append(emp.getTelephone() == null ? "—" : emp.getTelephone())
                    .append(" | interventions en cours : ").append(chargeActive).append("\n");
        }

        // --- Coordonnées des clients (limité pour rester rapide) ---
        List<com.sav.model.Client> clients = clientRepository.findAll();
        sb.append("\n[CLIENTS] (").append(clients.size()).append(" au total, coordonnées)\n");
        int max = Math.min(clients.size(), 80);
        for (int i = 0; i < max; i++) {
            com.sav.model.Client c = clients.get(i);
            sb.append("- ").append(c.getRaisonSociale() == null ? "(société ?)" : c.getRaisonSociale())
                    .append(" | contact : ").append(c.getPrenom()).append(" ").append(c.getNom())
                    .append(" | email : ").append(c.getEmail())
                    .append(" | tél : ").append(c.getTelephone() == null ? "—" : c.getTelephone())
                    .append("\n");
        }
        if (clients.size() > max) {
            sb.append("… (").append(clients.size() - max).append(" autres clients non listés)\n");
        }
        return sb.toString();
    }

    // États « charge active » — dupliqué ici pour l'assistant (évite le couplage au service intervention).
    private static final List<com.sav.model.enums.EtatIntervention> ETATS_ACTIFS_ADMIN = List.of(
            com.sav.model.enums.EtatIntervention.NOUVELLE, com.sav.model.enums.EtatIntervention.AFFECTEE,
            com.sav.model.enums.EtatIntervention.ACCEPTEE, com.sav.model.enums.EtatIntervention.EN_COURS,
            com.sav.model.enums.EtatIntervention.EN_ATTENTE);

    // Logique commune : conversation avec Ollama + analyse du JSON renvoyé.
    private ChatbotResponse dialoguer(ChatbotRequest request, String promptSysteme) {
        // --- Construction de la conversation pour Ollama ---
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", promptSysteme));
        if (request.getHistorique() != null) {
            // On limite l'historique aux 10 derniers messages pour rester rapide.
            int debut = Math.max(0, request.getHistorique().size() - 10);
            request.getHistorique().subList(debut, request.getHistorique().size())
                    .forEach(m -> messages.add(Map.of(
                            "role", "assistant".equals(m.getRole()) ? "assistant" : "user",
                            "content", m.getContent() == null ? "" : m.getContent())));
        }
        messages.add(Map.of("role", "user", "content", request.getMessage()));

        Map<String, Object> corps = corpsOllama(Map.of(
                "messages", messages,
                "format", "json",           // force une sortie JSON valide
                "options", Map.of("temperature", 0.1)
        ));

        // --- Appel de l'API Ollama : POST /api/chat ---
        String contenu;
        try {
            JsonNode reponseOllama = restClient.post()
                    .uri("/api/chat")
                    .body(corps)
                    .retrieve()
                    .body(JsonNode.class);
            contenu = reponseOllama.path("message").path("content").asText();
        } catch (Exception e) {
            log.error("Erreur d'appel à Ollama ({}) : {}", modele, e.getMessage());
            return ChatbotResponse.builder()
                    .reponse("Désolé, l'assistant est momentanément indisponible. "
                            + "Vérifiez qu'Ollama est démarré, ou créez directement une demande d'intervention.")
                    .creerIntervention(false)
                    .build();
        }

        // --- Analyse du JSON produit par le modèle ---
        try {
            JsonNode json = objectMapper.readTree(contenu);
            String priorite = json.path("priorite").asText("NORMAL").toUpperCase();
            if (!PRIORITES_VALIDES.contains(priorite)) {
                priorite = "NORMAL";
            }
            return ChatbotResponse.builder()
                    .reponse(nettoyerReponse(json.path("reponse").asText(contenu)))
                    .creerIntervention(json.path("creerIntervention").asBoolean(false))
                    .suggestionDescription(json.path("description").asText(""))
                    .suggestionPriorite(priorite)
                    .build();
        } catch (Exception e) {
            // Repli : si le modèle n'a pas produit du JSON exploitable,
            // on renvoie le texte brut comme réponse simple.
            log.warn("Réponse Ollama non-JSON, renvoi du texte brut");
            return ChatbotResponse.builder()
                    .reponse(nettoyerReponse(contenu))
                    .creerIntervention(false)
                    .build();
        }
    }

    private static final String PROMPT_PUBLIC = """
            Tu es l'assistant virtuel du site d'ID Software Solutions (service après-vente).
            Tu réponds à des VISITEURS NON CONNECTÉS, en FRANÇAIS, poliment et TRÈS brièvement
            (1 à 3 phrases maximum).

            Tu peux répondre UNIQUEMENT sur ces sujets :

            1. CRÉER UN COMPTE : cliquer sur « Créer un compte » sur le site, puis remplir le
               formulaire : nom, prénom, email, téléphone, mot de passe (min. 8 caractères avec
               majuscule, minuscule, chiffre et caractère spécial), raison sociale (société),
               matricule fiscal, et joindre une photo ou un PDF du matricule fiscal.
               Il faut aussi accepter les conditions d'utilisation.

            2. SE CONNECTER : cliquer sur « Connexion », saisir son email puis son mot de passe.
               Une double authentification est ensuite demandée : soit un code de l'application
               Google Authenticator, soit un code reçu par e-mail. En cas d'oubli, utiliser
               « Mot de passe oublié » (vérification par code Authenticator ou par e-mail).

            3. CONTACT :
               - Téléphones : + (216) 52.316.703 / 52.316.709 / 52.316.807
               - WhatsApp : +216 52 316 703
               - E-mail : id2softwaresolutions@gmail.com
               - Site web : https://idsoft.tn

            4. ADRESSE : Ariana Palace Immeuble, Bloc A, étage 5, Ave El-Bousten, Sfax, Tunisie.

            5. DISPONIBILITÉ / HORAIRES : donne des horaires UNIQUEMENT s'ils figurent
               explicitement dans la BASE DE CONNAISSANCES ci-dessous.
               S'ils n'y figurent PAS, réponds EXACTEMENT ceci et rien d'autre :
               "Je n'ai pas nos horaires exacts ici. Contactez-nous sur WhatsApp au
               +216 52 316 703 ou par téléphone au + (216) 52.316.703."
               N'ÉCRIS JAMAIS une phrase comme "nos horaires sont les suivants" si tu n'as
               pas les horaires réels à donner juste après.

            Règles STRICTES :
            - N'invente RIEN. Si tu ne connais pas la réponse, invite à contacter le SAV par
              WhatsApp au +216 52 316 703.
            - N'annonce jamais une information que tu ne possèdes pas (ne commence pas une
              liste ou une énumération vide).
            - N'utilise AUCUN emoji.
            - Ne parle pas de la gestion des interventions : pour cela, le visiteur doit d'abord
              créer un compte et se connecter.
            - Réponds en TEXTE SIMPLE, sans balise HTML, sans longue liste.

            Tu réponds TOUJOURS avec un objet JSON strict de cette forme :
            {"reponse": "ton message au visiteur", "creerIntervention": false, "description": "", "priorite": "NORMAL"}
            """;

    private static final String PROMPT_ADMIN = """
            Tu es l'assistant de données du DIRECTEUR d'une entreprise de SAV informatique.
            Tu réponds en FRANÇAIS, de façon claire, précise et concise.

            Tu disposes plus bas d'un INSTANTANÉ DES DONNÉES réelles de l'entreprise :
            chiffre d'affaires (total, du mois, par employé), nombre d'interventions
            (global, par état, par priorité, terminées par employé), charge en cours par
            employé, et les COORDONNÉES des employés et des clients (email, téléphone).

            RÈGLES STRICTES :
            - Réponds UNIQUEMENT à partir des données fournies ci-dessous. N'invente JAMAIS
              un chiffre, un nom, un email ou un numéro. Si l'information n'y figure pas,
              dis simplement que tu ne l'as pas dans les données.
            - Les montants sont en dinars tunisiens (DT).
            - PRIORITÉ ABSOLUE : si une section [RÉPONSES PRÉ-CALCULÉES] est fournie, utilise
              ses valeurs telles quelles. Ne recalcule pas et ne compare pas toi-même les
              chiffres : ces réponses sont déjà vérifiées.
            - « Employé » désigne uniquement les employés SAV, JAMAIS le directeur.
            - Pour « qui rapporte le plus / le moins », lis le [CLASSEMENT DES EMPLOYÉS PAR CA]
              (déjà trié) : le premier de la liste rapporte le plus, le dernier le moins.
            - Quand on te demande des coordonnées, donne exactement l'email et le téléphone
              présents dans les données.
            - Reste factuel : pas d'opinion, pas de conseil non demandé, pas de HTML.
            - Si on te demande un classement, présente-le trié (du plus élevé au plus faible).
            - Sois bref : va droit au fait, utilise des listes courtes si utile.
            """;

    private static final String PROMPT_AMELIORATION = """
            Tu corriges et reformules la demande d'un client pour un service après-vente.
            Réécris son texte en FRANÇAIS, à la 1re personne, en UNE SEULE PHRASE
            (deux au maximum si c'est vraiment nécessaire).

            Règles STRICTES :
            - Reste EXACTEMENT sur ce que le client a écrit. N'ajoute AUCUNE information,
              AUCUN conseil, AUCUNE hypothèse, AUCUNE formule de politesse.
            - NE RALLONGE PAS le texte : le résultat doit être aussi court que possible,
              clair et factuel. Si le texte d'origine est déjà clair, change le minimum.
            - Corrige simplement l'orthographe, la grammaire et la formulation.
            - Pas de HTML, pas de liste, pas de titre, pas d'introduction.
            - Réponds UNIQUEMENT avec la phrase reformulée.
            """;

    private static final String PROMPT_RAPPORT = """
            Tu es un technicien de service après-vente. Tu rédiges le RAPPORT TECHNIQUE FINAL
            d'une intervention, en FRANÇAIS, dans un style professionnel, factuel et concis.

            On te fournit :
            - LE PROBLÈME signalé par le client.
            - LES NOTES du technicien (ce qui a réellement été fait). Elles peuvent être brèves
              ou absentes.

            Rédige un rapport clair de 2 à 4 phrases couvrant : le diagnostic, l'action réalisée
            et le résultat (problème résolu). Reste STRICTEMENT fidèle aux notes du technicien :
            n'invente aucune pièce changée, aucun prix, aucune manipulation non mentionnée.
            Si les notes sont vides, rédige un rapport générique et prudent basé uniquement sur
            le problème signalé, sans inventer de détails techniques précis.

            Règles STRICTES :
            - Pas de HTML, pas de liste à puces, pas de titre, pas de formule de politesse.
            - Ne mentionne aucun montant ni prix.
            - Réponds UNIQUEMENT avec le texte du rapport, rien d'autre.
            """;

    @Override
    public String genererRapportTechnique(String description, String notes) {
        String probleme = description == null ? "" : description.trim();
        String notesTech = notes == null ? "" : notes.trim();
        if (probleme.isBlank() && notesTech.isBlank()) {
            return "";
        }
        String contenu = "PROBLÈME SIGNALÉ :\n" + (probleme.isBlank() ? "(non précisé)" : probleme)
                + "\n\nNOTES DU TECHNICIEN :\n" + (notesTech.isBlank() ? "(aucune)" : notesTech);
        Map<String, Object> corps = corpsOllama(Map.of(
                "messages", List.of(
                        Map.of("role", "system", "content", PROMPT_RAPPORT),
                        Map.of("role", "user", "content", contenu)
                ),
                "options", Map.of("temperature", 0.3)
        ));
        try {
            JsonNode reponse = restClient.post()
                    .uri("/api/chat")
                    .body(corps)
                    .retrieve()
                    .body(JsonNode.class);
            String rapport = nettoyerReponse(reponse.path("message").path("content").asText());
            return rapport.isBlank() ? notesTech : rapport;
        } catch (Exception e) {
            log.error("Génération du rapport technique impossible ({}) : {}", modele, e.getMessage());
            throw new com.sav.exception.BusinessException(
                    "L'assistant est momentanément indisponible. Réessayez plus tard.");
        }
    }

    private static final String PROMPT_AFFECTATION = """
            Tu es un responsable SAV qui affecte les interventions aux techniciens.
            On te donne le PROBLÈME à traiter, sa PRIORITÉ, et une LISTE de techniciens
            disponibles avec, pour chacun : un id, un nom, une spécialité, sa CHARGE ACTIVE
            (nombre d'interventions en cours) et son EXPÉRIENCE (interventions déjà terminées).

            Choisis LE technicien le plus adapté selon ces critères, par ordre d'importance :
            1. Spécialité en rapport avec le problème (si pertinent).
            2. Charge active la plus FAIBLE (privilégie un technicien disponible).
            3. Expérience (nombre d'interventions terminées) la plus élevée.

            Réponds UNIQUEMENT avec un objet JSON strict :
            {"employeId": <id du technicien choisi>, "raison": "phrase courte en français justifiant le choix"}

            La "raison" doit être une seule phrase concise (charge et expérience à l'appui),
            sans HTML. Choisis obligatoirement un "employeId" présent dans la liste.
            """;

    @Override
    public SuggestionAffectation suggererTechnicien(String description, String priorite, List<TechnicienCandidat> candidats) {
        if (candidats == null || candidats.isEmpty()) {
            return new SuggestionAffectation(null, "Aucun technicien disponible.");
        }
        // Repli déterministe : le 1er candidat (déjà classé par charge/expérience côté appelant).
        TechnicienCandidat defaut = candidats.get(0);

        StringBuilder liste = new StringBuilder();
        for (TechnicienCandidat c : candidats) {
            liste.append("- id=").append(c.id())
                    .append(", nom=").append(c.nom())
                    .append(", specialite=").append(c.specialite() == null || c.specialite().isBlank() ? "Général" : c.specialite())
                    .append(", charge_active=").append(c.chargeActive())
                    .append(", terminees=").append(c.interventionsTerminees())
                    .append("\n");
        }
        String contenu = "PROBLÈME :\n" + (description == null ? "" : description.trim())
                + "\n\nPRIORITÉ : " + (priorite == null ? "NORMAL" : priorite)
                + "\n\nTECHNICIENS DISPONIBLES :\n" + liste;

        Map<String, Object> corps = corpsOllama(Map.of(
                "messages", List.of(
                        Map.of("role", "system", "content", PROMPT_AFFECTATION),
                        Map.of("role", "user", "content", contenu)
                ),
                "format", "json",
                "options", Map.of("temperature", 0.1)
        ));
        try {
            JsonNode reponse = restClient.post()
                    .uri("/api/chat")
                    .body(corps)
                    .retrieve()
                    .body(JsonNode.class);
            JsonNode json = objectMapper.readTree(reponse.path("message").path("content").asText());
            Long idChoisi = json.path("employeId").isNumber() ? json.path("employeId").asLong() : null;
            // On n'accepte l'id que s'il fait partie des candidats proposés ; sinon repli déterministe.
            TechnicienCandidat choisi = candidats.stream()
                    .filter(c -> c.id().equals(idChoisi))
                    .findFirst().orElse(defaut);
            // La raison affichée est TOUJOURS construite à partir des vrais chiffres du technicien
            // retenu (le modèle peut se tromper dans sa justification) : garantie de véracité.
            return new SuggestionAffectation(choisi.id(), raisonPour(choisi));
        } catch (Exception e) {
            log.warn("Suggestion d'affectation IA indisponible ({}) : {} — repli déterministe", modele, e.getMessage());
            return new SuggestionAffectation(defaut.id(), raisonPour(defaut));
        }
    }

    // Justification factuelle à partir des statistiques réelles du technicien.
    private String raisonPour(TechnicienCandidat c) {
        String specialite = c.specialite() == null || c.specialite().isBlank() ? "Général" : c.specialite();
        return String.format("%s (spécialité %s) : %d intervention(s) en cours et %d déjà traitée(s).",
                c.nom(), specialite, c.chargeActive(), c.interventionsTerminees());
    }

    private static final Set<String> CATEGORIES_VALIDES =
            Set.of("LOGICIEL", "MATERIEL", "RESEAU", "INSTALLATION", "MAINTENANCE", "AUTRE");

    private static final String PROMPT_CLASSIFICATION = """
            Tu classes automatiquement une demande d'intervention SAV décrite par un client.
            Détermine deux choses à partir du texte :

            1. PRIORITE (gravité/urgence) parmi EXACTEMENT :
               - TRES_URGENT : panne totale bloquante, perte de données, faille de sécurité.
               - URGENT : impact fort sur le travail, mais contournement possible.
               - NORMAL : gêne modérée, fonctionnement partiel.
               - FACULTATIF : question, amélioration, demande non bloquante.

            2. CATEGORIE technique parmi EXACTEMENT :
               - LOGICIEL : bug, application, site web, données, compte, affichage.
               - MATERIEL : appareil physique (ordinateur, imprimante, écran, périphérique).
               - RESEAU : connexion, internet, wifi, serveur, accès distant.
               - INSTALLATION : mise en place, configuration, déploiement d'un nouvel équipement/logiciel.
               - MAINTENANCE : entretien, mise à jour, vérification périodique.
               - AUTRE : ne correspond à aucune catégorie ci-dessus.

            Réponds UNIQUEMENT avec un objet JSON strict :
            {"priorite": "<une valeur>", "categorie": "<une valeur>"}
            N'ajoute aucun texte, aucune explication.
            """;

    @Override
    public Classification classer(String description) {
        if (description == null || description.isBlank()) {
            return new Classification("NORMAL", "AUTRE");
        }
        Map<String, Object> corps = corpsOllama(Map.of(
                "messages", List.of(
                        Map.of("role", "system", "content", PROMPT_CLASSIFICATION),
                        Map.of("role", "user", "content", description.trim())
                ),
                "format", "json",
                "options", Map.of("temperature", 0.0)
        ));
        try {
            JsonNode reponse = restClient.post()
                    .uri("/api/chat")
                    .body(corps)
                    .retrieve()
                    .body(JsonNode.class);
            JsonNode json = objectMapper.readTree(reponse.path("message").path("content").asText());
            String priorite = json.path("priorite").asText("NORMAL").toUpperCase();
            String categorie = json.path("categorie").asText("AUTRE").toUpperCase();
            if (!PRIORITES_VALIDES.contains(priorite)) priorite = "NORMAL";
            if (!CATEGORIES_VALIDES.contains(categorie)) categorie = "AUTRE";
            return new Classification(priorite, categorie);
        } catch (Exception e) {
            log.warn("Classification automatique indisponible ({}) : {} — valeurs par défaut", modele, e.getMessage());
            return new Classification("NORMAL", "AUTRE");
        }
    }

    @Override
    public String ameliorerDescription(String texte) {
        if (texte == null || texte.isBlank()) {
            return "";
        }
        Map<String, Object> corps = corpsOllama(Map.of(
                "messages", List.of(
                        Map.of("role", "system", "content", PROMPT_AMELIORATION),
                        Map.of("role", "user", "content", texte)
                ),
                "options", Map.of("temperature", 0.2)
        ));
        try {
            JsonNode reponse = restClient.post()
                    .uri("/api/chat")
                    .body(corps)
                    .retrieve()
                    .body(JsonNode.class);
            String ameliore = nettoyerReponse(reponse.path("message").path("content").asText());
            // Repli sur le texte d'origine si le modèle renvoie du vide.
            return ameliore.isBlank() ? texte : ameliore;
        } catch (Exception e) {
            log.error("Amélioration de description impossible ({}) : {}", modele, e.getMessage());
            throw new com.sav.exception.BusinessException(
                    "L'assistant est momentanément indisponible. Réessayez plus tard.");
        }
    }

    // Nettoie le texte : convertit les <br> en sauts de ligne et retire toute balise HTML
    // (le chat affiche du texte simple, pas du HTML).
    private String nettoyerReponse(String texte) {
        if (texte == null) return "";
        return texte
                .replaceAll("(?i)<br\\s*/?>", "\n")   // <br>, <br/> -> saut de ligne
                .replaceAll("<[^>]+>", "")            // retire les autres balises HTML
                .replaceAll("\n{3,}", "\n\n")         // limite les lignes vides multiples
                .trim();
    }
}
