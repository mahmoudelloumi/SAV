import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Empêche l'accès si l'utilisateur n'est pas connecté, et restreint
// optionnellement l'accès à une liste de rôles autorisés.
export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }
  return children;
}
