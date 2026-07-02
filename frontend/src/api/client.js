import axios from 'axios';

// ============================================================
// Client HTTP centralisé (axios) pour appeler l'API Spring Boot.
// ============================================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // http://localhost:8080/api
  headers: { 'Content-Type': 'application/json' },
});

// --- Intercepteur de requête : ajoute automatiquement le token JWT ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Intercepteur de réponse : déconnexion auto si le token expire (401) ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirige vers la connexion si la session n'est plus valide.
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
