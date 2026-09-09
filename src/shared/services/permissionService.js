import { authService } from "/src/features/auth/authService";

export const permissionService = {
  // Verifica si el usuario logueado tiene un permiso específico
  hasPermission: (permissionCode) => {
    const userStr = sessionStorage.getItem("syspharma_user");
    if (!userStr || userStr === "undefined") return false;

    const user = JSON.parse(userStr);
    // REGLA DE ORO: El Administrador siempre tiene permiso para todo
    if (user.rol?.toLowerCase().trim() === "administrador") return true;
    
    // Para los demás, buscamos el código en su lista de permisos de memoria
    const permisos = authService.getPermisos() || [];
    return permisos.includes(permissionCode);
  }
};
