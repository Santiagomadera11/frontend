import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "../utils/apiClient";
import { authService } from "../../features/auth/authService";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (id, token) => {
    try {
      const res = await apiClient.get(`/api/Usuario/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = res.data;

      // Obtener permisos del rol
      const rolesRes = await apiClient.get(`/api/RolMaestro`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const roles = rolesRes.data;
      const currentRole = (userData.rolNombre || userData.rol || "").toLowerCase().trim();
      const miRol = roles.find(r => (r.nombre || "").toLowerCase().trim() === currentRole);
      const permissions = miRol?.permisos || [];

      const fullUser = {
        ...userData,
        rol: currentRole,
        permisos: permissions
      };

      setCurrentUser(fullUser);
    } catch (err) {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem("syspharma_token");
    const userStr = sessionStorage.getItem("syspharma_user");
    
    if (token && userStr) {
      try {
        const parsed = JSON.parse(userStr);
        if (parsed && parsed.id) {
          fetchUser(parsed.id, token);
          return;
        }
      } catch (e) {
        // Silencioso
      }
    }
    setLoading(false);
  }, []);

  const loginUser = async (id, token) => {
    setLoading(true);
    await fetchUser(id, token);
  };

  const logoutUser = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const refreshUser = async () => {
    const token = sessionStorage.getItem("syspharma_token");
    const userStr = sessionStorage.getItem("syspharma_user");
    if (token && userStr) {
      const parsed = JSON.parse(userStr);
      if (parsed && parsed.id) {
        await fetchUser(parsed.id, token);
      }
    }
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, loading, loginUser, logoutUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useCurrentUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within a UserProvider");
  }
  return context;
};
