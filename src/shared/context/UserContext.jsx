import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiClient } from "../utils/apiClient";
import { authService } from "../../features/auth/authService";
import { resolveAvatarUrl } from "../utils/resolveAvatarUrl";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (id, token) => {
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
        permisos: permissions,
        avatar: resolveAvatarUrl(userData.avatar, userData.nombre || userData.id),
      };

      setCurrentUser(fullUser);
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
      } catch {
        // Silencioso
      }
    }
    setLoading(false);
  }, [fetchUser]);

  const loginUser = useCallback(async (id, token) => {
    setLoading(true);
    await fetchUser(id, token);
    window.dispatchEvent(new Event("syspharma_auth_changed"));
  }, [fetchUser]);

  const logoutUser = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
    window.dispatchEvent(new Event("syspharma_auth_changed"));
  }, []);

  const refreshUser = useCallback(async () => {
    const token = sessionStorage.getItem("syspharma_token");
    const userStr = sessionStorage.getItem("syspharma_user");
    if (token && userStr) {
      const parsed = JSON.parse(userStr);
      if (parsed && parsed.id) {
        await fetchUser(parsed.id, token);
      }
    }
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, loading, loginUser, logoutUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- hook colocado a propósito junto a su Provider
export const useCurrentUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within a UserProvider");
  }
  return context;
};
