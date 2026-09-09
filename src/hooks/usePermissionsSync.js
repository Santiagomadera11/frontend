import { useEffect, useRef } from "react";
import { rolesService } from "../features/settings/rolesService";
import { useCurrentUser } from "/src/shared/context/UserContext";

const POLL_INTERVAL = 30_000; // 30 segundos

export const usePermissionsSync = () => {
  const intervalRef = useRef(null);
  const { currentUser, refreshUser } = useCurrentUser();

  useEffect(() => {
    const sync = async () => {
      try {
        // Solo aplica para empleados (no admin, no cliente)
        if (!currentUser?.rolId || currentUser?.rol?.toLowerCase().trim() === "administrador") return;

        // Consulta los permisos actuales del rol desde la BD
        const permisosActuales = await rolesService.getPermisos(currentUser.rolId);

        if (!Array.isArray(permisosActuales)) return;

        const permisosGuardados = currentUser.permisos || [];

        // Compara si cambiaron
        const cambiaron =
          permisosActuales.length !== permisosGuardados.length ||
          permisosActuales.some((p) => !permisosGuardados.includes(p));

        if (cambiaron) {
          // Refrescar el contexto
          await refreshUser();

          // Notifica a todos los componentes
          window.dispatchEvent(new Event("permissionsUpdated"));
        }
      } catch (error) {
        // Silencioso
      }
    };

    // Ejecuta inmediatamente al montar
    sync();

    // Luego cada 30 segundos
    intervalRef.current = setInterval(sync, POLL_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [currentUser?.id, currentUser?.rolId, refreshUser]);
};
