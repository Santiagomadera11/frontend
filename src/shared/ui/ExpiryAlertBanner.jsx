import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, X } from "lucide-react";
import { productService } from "/src/features/inventory/products/services/productService";

export const ExpiryAlertBanner = () => {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const user = currentUser || {};
  const userRole = (user.rol || "").toLowerCase().trim();
  const userPerms = (user.permisos || []).map((p) => String(p || "").toLowerCase().trim());
  const canViewProducts = userRole === "administrador" || userPerms.includes("products.view");

  const [resumen, setResumen] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!canViewProducts) return;
    let cancelled = false;
    productService.getProximosAVencer()
      .then((data) => {
        if (!cancelled) setResumen(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [canViewProducts]);

  if (!canViewProducts || dismissed || !resumen) return null;

  const { vencidos = 0, porVencer = 0, diasAlerta = 30 } = resumen;
  if (vencidos === 0 && porVencer === 0) return null;

  const isCritical = vencidos > 0;
  const productosPath = userRole === "administrador" ? "/admin/productos" : "/employee/productos";

  const partes = [];
  if (vencidos > 0) partes.push(`${vencidos} producto${vencidos === 1 ? "" : "s"} vencido${vencidos === 1 ? "" : "s"}`);
  if (porVencer > 0) partes.push(`${porVencer} por vencer en los próximos ${diasAlerta} días`);

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm border-b ${
        isCritical
          ? "bg-red-50 border-red-200 text-red-800"
          : "bg-amber-50 border-amber-200 text-amber-800"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle size={18} className="flex-shrink-0" />
        <span className="truncate">
          <strong>Alerta de inventario:</strong> {partes.join(" y ")}.
        </span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate(productosPath, { state: { filterStatus: "proximos" } })}
          className={`font-semibold underline hover:no-underline ${isCritical ? "text-red-700" : "text-amber-700"}`}
        >
          Ver detalle
        </button>
        <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-gray-600" title="Cerrar">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
