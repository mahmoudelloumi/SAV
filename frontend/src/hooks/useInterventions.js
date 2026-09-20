import { useCallback, useEffect, useState } from 'react';
import {
  getInterventionsParClient,
  getInterventionsParEmploye,
  getToutesInterventions,
} from '../api/interventionService.js';

// ============================================================
// Charge la page d'interventions correspondant au rôle de l'utilisateur
// connecté (endpoint différent selon CLIENT/EMPLOYE_SAV/DIRECTEUR).
// Le filtrage par état/priorité/recherche texte se fait ensuite côté
// composant (client-side) sur la page couramment chargée.
// ============================================================

export function useInterventions(user, { page = 0, size = 20, sort = 'dateCreation,desc' } = {}) {
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0, number: 0 });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    if (!user) return;
    setChargement(true);
    setErreur('');
    try {
      let reponse;
      if (user.role === 'CLIENT') {
        reponse = await getInterventionsParClient(user.userId, page, size, sort);
      } else if (user.role === 'EMPLOYE_SAV') {
        reponse = await getInterventionsParEmploye(user.userId, page, size, sort);
      } else {
        reponse = await getToutesInterventions(page, size, sort);
      }
      setData(reponse.data);
    } catch (err) {
      // Message explicite selon la cause : sans cela une session expirée, un
      // backend arrêté et un refus de droits donnent tous la même erreur.
      if (!err.response) {
        setErreur("Impossible de joindre le serveur. Vérifiez que le backend est démarré (http://localhost:8080).");
      } else if (err.response.status === 401) {
        setErreur("Votre session a expiré. Veuillez vous reconnecter.");
      } else if (err.response.status === 403) {
        setErreur("Vous n'avez pas les droits nécessaires pour consulter ces interventions.");
      } else {
        setErreur(`Impossible de charger les interventions (erreur ${err.response.status}).`);
      }
    } finally {
      setChargement(false);
    }
  }, [user, page, size, sort]);

  useEffect(() => {
    charger();
  }, [charger]);

  return { ...data, chargement, erreur, recharger: charger };
}
