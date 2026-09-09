import { apiClient } from "../../shared/utils/apiClient";
import { authService } from "../auth/authService";

const ENDPOINT = "Permiso";

export const permissionService = {
  // ── Catálogo de permisos desde backend ───────────────────────────────────
  getCatalog: async () => {
    const res = await apiClient.get(ENDPOINT);
    return res.data;
  },

  createPermiso: async (data) => {
    const res = await apiClient.post(ENDPOINT, data);
    return res.data;
  },

  updatePermiso: async (data) => {
    const res = await apiClient.put(ENDPOINT, data);
    return res.data;
  },

  // ── Verificación de permisos (desde memoria, no localStorage) ────────────
  hasPerm: (roleName, permId) => {
    if (!roleName) return false;
    
    // Normalizamos el rol para comparar
    const normalizedRole = roleName.toLowerCase().trim();
    if (normalizedRole === "administrador") return true;

    // Obtener permisos desde memoria (cargados en el login)
    const permisos = authService.getPermisos();
    return permisos.includes(permId);
  },

  // ── Obtener permisos actuales en memoria ─────────────────────────────────
  getPermisos: () => authService.getPermisos(),

  // Compatibilidad con código anterior — ya no usa localStorage
  getAll: () => ({}),
  saveAll: () => {},
  getRolePerms: () => ({}),
  updateRole: () => {},
  removeRole: () => {},
  syncFromRoles: () => {},
  init: () => {},
};

permissionService.init(); 