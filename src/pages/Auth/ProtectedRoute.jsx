import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, authLoading } = useContext(AuthContext);

  if (authLoading) {
    // You can show a loading indicator or return null
    return <div>Authenticating...</div>;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in, but does not have proper role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
