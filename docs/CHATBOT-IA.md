# Chatbot IA (Ollama)

Assistant virtuel SAV intégré à l'application : les clients décrivent leur
problème, l'IA propose des solutions de dépannage, et si le problème n'est pas
résolu elle propose de créer une demande d'intervention **pré-remplie**
(description + priorité déduites de la conversation).

L'IA tourne **en local** via [Ollama](https://ollama.com) : gratuit, sans clé
API, les données ne quittent pas la machine.

## Installation (une seule fois)

1. Télécharger et installer Ollama : https://ollama.com/download (Windows)
2. Télécharger le modèle :

```bash
ollama pull llama3.2
```

> `llama3.2` (3B) est léger (~2 Go, 8 Go de RAM suffisent). Pour un meilleur
> français, si la machine a 16 Go de RAM : `ollama pull mistral` puis définir
> la variable d'environnement `OLLAMA_MODEL=mistral`.

3. Vérifier qu'Ollama tourne (il démarre automatiquement avec Windows) :

```bash
curl http://localhost:11434
# → "Ollama is running"
```

## Configuration

Dans `backend/src/main/resources/application.yml` :

```yaml
application:
  chatbot:
    ollama-url: ${OLLAMA_URL:http://localhost:11434}
    model: ${OLLAMA_MODEL:llama3.2}
    timeout-seconds: ${OLLAMA_TIMEOUT:120}
```

## Architecture

```
ChatbotWidget.jsx (bulle flottante, rôle CLIENT)
        │  POST /api/chatbot/message  { message, historique }
        ▼
ChatbotController → ChatbotServiceImpl
        │  POST http://localhost:11434/api/chat  (format: json)
        ▼
      Ollama (llama3.2)
```

Le modèle répond en JSON strict :

```json
{
  "reponse": "message affiché au client",
  "creerIntervention": true,
  "description": "résumé du problème",
  "priorite": "URGENT"
}
```

Quand `creerIntervention` vaut `true`, le widget affiche un bouton
« Créer cette demande » qui ouvre le formulaire de création d'intervention
pré-rempli (`CreerInterventionModal` avec la prop `initial`).

## Fichiers ajoutés / modifiés

- `backend/.../model/ChatbotRequest.java` — DTO requête (nouveau)
- `backend/.../model/ChatbotResponse.java` — DTO réponse (nouveau)
- `backend/.../service/ChatbotService.java` + `impl/ChatbotServiceImpl.java` (nouveaux)
- `backend/.../controller/ChatbotController.java` (nouveau)
- `backend/.../resources/application.yml` — section `application.chatbot` (modifié)
- `frontend/src/api/chatbotService.js` (nouveau)
- `frontend/src/components/chatbot/ChatbotWidget.jsx` (nouveau)
- `frontend/src/components/interventions/CreerInterventionModal.jsx` — prop `initial` (modifié)
- `frontend/src/components/layout/AppShell.jsx` — intégration du widget (modifié)

## Test rapide

1. Démarrer Ollama, le backend et le frontend.
2. Se connecter avec un compte **Client**.
3. Cliquer sur la bulle en bas à droite, écrire par ex. :
   « Mon imprimante affiche une erreur E-04 et ne démarre plus. »
4. Discuter, puis demander une intervention → bouton « Créer cette demande ».
