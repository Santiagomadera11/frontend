import { useEffect, useRef } from "react";
import { rolesService } from "../features/settings/rolesService";
import { useCurrentUser } from "/src/shared/context/UserContext";

const POLL_INTERVAL = 30_000;

export const usePermissionsSync = () => {
  const intervalRef = useRef(null);
  const { currentUser, refreshUser } = useCurrentUser();

  useEffect(() => {
    const sync = async () => {
      try {
        if (!currentUser?.rolId || currentUser?.rol?.toLowerCase().trim() === "administrador") return;

        const permisosActuales = await rolesService.getPermisos(currentUser.rolId);

        if (!Array.isArray(permisosActuales)) return;

        const permisosGuardados = currentUser.permisos || [];

        const cambiaron =
          permisosActuales.length !== permisosGuardados.length ||
          permisosActuales.some((p) => !permisosGuardados.includes(p));

        if (cambiaron) {
          await refreshUser();

          window.dispatchEvent(new Event("permissionsUpdated"));
        }
      } catch {
      }
    };

    sync();

    intervalRef.current = setInterval(sync, POLL_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [currentUser, refreshUser]);
};
