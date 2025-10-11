import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";

/**
 * Protected Route Component
 * Redirect to login if not authenticated
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

