import { createContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const RoleContext = createContext({});

export const RoleProvider = ({ children }) => {
  const { user } = useAuth();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${user.id}/role`,
        { credentials: "include" }
      );

      const data = await response.json();

      setRole(data.role || null);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (requiredRole) => {
    return role === requiredRole;
  };

  return (
    <RoleContext.Provider value={{ role, loading, hasRole }}>
      {children}
    </RoleContext.Provider>
  );
};
