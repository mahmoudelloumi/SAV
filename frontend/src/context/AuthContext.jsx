import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getPhotoProfil } from '../api/utilisateurService.js';

// ============================================================
// Contexte d'authentification : garde l'utilisateur connecté,
// le token JWT et la photo de profil accessibles dans toute l'app.
// ============================================================

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // On récupère l'utilisateur déjà stocké (persistance après rafraîchissement).
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Photo de profil de l'utilisateur connecté (object URL du blob téléchargé).
  const [photoUrl, setPhotoUrl] = useState(null);

  // (Re)charge la photo de profil depuis le backend et remplace l'URL courante.
  const rafraichirPhoto = useCallback(async (cible) => {
    const u = cible || user;
    if (!u?.userId) return;
    try {
      const { data } = await getPhotoProfil(u.userId);
      const url = URL.createObjectURL(data);
      setPhotoUrl((ancienne) => {
        if (ancienne) URL.revokeObjectURL(ancienne);
        return url;
      });
    } catch {
      // Pas de photo (404) : on retombe sur les initiales.
      setPhotoUrl((ancienne) => {
        if (ancienne) URL.revokeObjectURL(ancienne);
        return null;
      });
    }
  }, [user]);

  // Charge la photo à la connexion / au rechargement de page.
  useEffect(() => {
    if (user?.userId) rafraichirPhoto(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  // Enregistre le token + les infos utilisateur après une connexion réussie.
  function login(authResponse) {
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('user', JSON.stringify(authResponse));
    setUser(authResponse);
  }

  // Déconnexion : on nettoie tout.
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPhotoUrl((ancienne) => {
      if (ancienne) URL.revokeObjectURL(ancienne);
      return null;
    });
  }

  // Met à jour partiellement l'utilisateur connecté (ex. après changement de photo).
  function updateUser(champs) {
    setUser((prev) => {
      const maj = { ...prev, ...champs };
      localStorage.setItem('user', JSON.stringify(maj));
      return maj;
    });
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, photoUrl, rafraichirPhoto }}>
      {children}
    </AuthContext.Provider>
  );
}

// Petit hook pratique : const { user, login, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
