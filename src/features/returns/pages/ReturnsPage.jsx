import { useCurrentUser } from "/src/shared/context/UserContext";
import React from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, ArrowLeft } from "lucide-react";
import { useReturns } from "../hooks/useReturns";
import { ReturnList } from "../components/ReturnList";

export const ReturnsPage = () => {
  const navigate = useNavigate();
  const { devoluciones, loading, fetchAll } = useReturns();

  const { currentUser } = useCurrentUser();
  const user = currentUser || {};
  const userRole = (user.rol || "").toLowerCase().trim();
  const userPerms = (user.permisos || []).map((perm) => String(perm || "").toLowerCase().trim());
  const ventasPath = userRole === "administrador" ? "/admin/ventas" : "/employee/ventas";
  const colorClass = userRole === "administrador" ? "emerald" : "blue";
  
  // Validar permisos de acceso
  const hasAccess = userRole === "administrador" || userPerms.includes("sales.view") || userPerms.includes("sales.return");

  if (!hasAccess) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center bg-white rounded-xl border-2 border-red-200 p-8 max-w-md">
          <h2 className="text-2xl font-black text-red-600 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-6">No tienes permisos para ver las devoluciones. Contacta al administrador para que te asigne los permisos necesarios.</p>
          <button
            onClick={() => navigate(ventasPath)}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Volver a Ventas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              userRole === "administrador" ? "bg-emerald-100" : "bg-blue-100"
            }`}>
              <RotateCcw size={22} className={userRole === "administrador" ? "text-emerald-600" : "text-blue-600"} />
            </div>
            Devoluciones
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona las devoluciones de ventas</p>
        </div>
        <button
          onClick={() => navigate(ventasPath)}
          className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm ${
            userRole === "administrador"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <ArrowLeft size={18} /> Volver a Ventas
        </button>
      </div>

      {/* Contenido */}
      <ReturnList devoluciones={devoluciones} loading={loading} onRefresh={fetchAll} />
    </div>
  );
};
