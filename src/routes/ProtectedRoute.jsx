import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "/src/shared/context/UserContext";

const ROLES_FIJOS = ["administrador", "empleado", "cliente"];

const PERMS_ADMIN = [
  "dashboard.view", "users.view", "users.create", "users.edit", "users.delete",
  "users.status", "system.roles", "reports.shifts", "reports.performance",
  "config.service_categories.create", "config.payment_methods.create", "config.document_types.create"
];

const normalizePerm = (perm) => String(perm || "").toLowerCase().trim();

const ProtectedRoute = ({ children, requiredRole, requiredPerm, requiredAnyPerm }) => {
  const { currentUser, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const user = currentUser;
  const userRole = user.rol?.toLowerCase().trim();
  const userPerms = (user.permisos || []).map(normalizePerm);
  const esRolFijo = ROLES_FIJOS.includes(userRole);
  const esRolDinamico = !esRolFijo;
  const tienePermisosAdmin = userPerms.some(p => PERMS_ADMIN.includes(p));

  // Admin siempre pasa
  if (userRole === "administrador") {
    return children ? children : <Outlet />;
  }

  // Verificar rol requerido
  if (requiredRole) {
    const req = requiredRole.toLowerCase().trim();

    if (req === "administrador") {
      // Solo el admin fijo puede entrar al panel admin
      if (userRole !== "administrador") {
        return <Navigate to="/" replace />;
      }
    }

    if (req === "empleado") {
      // Empleado fijo y roles dinámicos con permisos pueden entrar al panel empleado
      if (userRole === "empleado" || esRolDinamico) {
        // permitir
      } else {
        return <Navigate to="/" replace />;
      }
    }

    if (req === "cliente") {
      if (userRole !== "cliente") {
        return <Navigate to="/" replace />;
      }
    }
  }

  // Verificar permiso requerido
  if (requiredPerm) {
    const isAdmin = userRole === "administrador";
    const hasPermission = isAdmin || userPerms.includes(normalizePerm(requiredPerm));

    if (!hasPermission) {
      const defaultPath = userRole === "cliente"
        ? "/client/inicio"
        : userRole === "administrador" && tienePermisosAdmin
          ? "/admin/dashboard"
          : "/employee/inicio";
      return <Navigate to={defaultPath} replace />;
    }
  }

  if (requiredAnyPerm?.length) {
    const isAdmin = userRole === "administrador";
    const hasPermission = isAdmin || requiredAnyPerm.some((perm) => userPerms.includes(normalizePerm(perm)));

    if (!hasPermission) {
      const defaultPath = userRole === "cliente" ? "/client/inicio" : "/employee/inicio";
      return <Navigate to={defaultPath} replace />;
    }
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
