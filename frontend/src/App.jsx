import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppShell from './components/layout/AppShell.jsx';

import Landing from './pages/public/Landing.jsx';
import Login from './pages/public/Login.jsx';
import Register from './pages/public/Register.jsx';
import MotDePasseOublie from './pages/public/MotDePasseOublie.jsx';
import ConfirmerIntervention from './pages/public/ConfirmerIntervention.jsx';

import Dashboard from './pages/app/Dashboard.jsx';
import Interventions from './pages/app/Interventions.jsx';
import Clients from './pages/app/Clients.jsx';
import Employes from './pages/app/Employes.jsx';
import BaseConnaissances from './pages/app/BaseConnaissances.jsx';
import Statistiques from './pages/app/Statistiques.jsx';
import Notifications from './pages/app/Notifications.jsx';
import Messagerie from './pages/app/Messagerie.jsx';
import Parametres from './pages/app/Parametres.jsx';

// ============================================================
// Routage principal : pages publiques (landing/auth) et espace
// applicatif protégé "/app/*" avec gardes de rôle pour les sections
// réservées au Directeur.
// ============================================================

export default function App() {
  return (
    <Routes>
      {/* --- Public --- */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
      <Route path="/confirmer-intervention" element={<ConfirmerIntervention />} />

      {/* --- Application (connecté) --- */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="interventions" element={<Interventions />} />
        <Route
          path="clients"
          element={<ProtectedRoute roles={['DIRECTEUR', 'EMPLOYE_SAV']}><Clients /></ProtectedRoute>}
        />
        <Route
          path="employes"
          element={<ProtectedRoute roles={['DIRECTEUR']}><Employes /></ProtectedRoute>}
        />
        <Route
          path="base-connaissances"
          element={<ProtectedRoute roles={['DIRECTEUR']}><BaseConnaissances /></ProtectedRoute>}
        />
        <Route
          path="statistiques"
          element={<ProtectedRoute roles={['DIRECTEUR']}><Statistiques /></ProtectedRoute>}
        />
        <Route path="notifications" element={<Notifications />} />
        <Route path="messagerie" element={<Messagerie />} />
        <Route path="parametres" element={<Parametres />} />
      </Route>

      {/* Toute route inconnue renvoie à l'accueil public. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
