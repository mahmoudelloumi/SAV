import { useAuth } from '../../context/AuthContext.jsx';
import DashboardClient from './DashboardClient.jsx';
import DashboardEmploye from './DashboardEmploye.jsx';
import DashboardDirecteur from './DashboardDirecteur.jsx';

// Dispatch du tableau de bord selon le rôle de l'utilisateur connecté.
export default function Dashboard() {
  const { user } = useAuth();

  if (user.role === 'CLIENT') return <DashboardClient />;
  if (user.role === 'EMPLOYE_SAV') return <DashboardEmploye />;
  return <DashboardDirecteur />;
}
