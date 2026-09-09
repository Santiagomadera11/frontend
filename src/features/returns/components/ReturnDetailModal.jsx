import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState } from "react";
import { X, CheckCircle, XCircle, Loader, Clock, User, Package, FileText } from "lucide-react";
import { returnService } from "../services/returnService";
import { ToastNotification } from "/src/shared/ui/ToastNotification";

const ESTADO_CONFIG = {
  1: { label: "Pendiente", icon: Clock, bg: "bg-yellow-50", border: "border-yellow-100", text: "text-yellow-700", iconColor: "text-yellow-500" },
  2: { label: "Aprobada", icon: CheckCircle, bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700", iconColor: "text-emerald-500" },
  3: { label: "Rechazada", icon: XCircle, bg: "bg-red-50", border: "border-red-100", text: "text-red-700", iconColor: "text-red-500" },
};

const fmt = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
    v || 0
  );

export const ReturnDetailModal = ({ isOpen, onClose, devolucion, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { currentUser } = useCurrentUser();
  const user = currentUser || {};
  const userRole = (user.rol || "").toLowerCase().trim();

  if (!isOpen || !devolucion) return null;

  const estadoConfig = ESTADO_CONFIG[devolucion.estadoId] || ESTADO_CONFIG[1];
  const EstadoIcon = estadoConfig.icon;
  const isPendiente = devolucion.estadoId === 1;

  const handleAprobar = async () => {
    try {
      setLoading(true);
      await returnService.gestionar(devolucion.id, {
        nuevoEstado: 2,
        usuarioGestionId: user.id,
      });
      setToast({ message: "Devolución aprobada exitosamente", type: "success" });
      setTimeout(() => {
        onRefresh?.();
      }, 1500);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Error al aprobar la devolución",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = async () => {
    try {
      setLoading(true);
      await returnService.gestionar(devolucion.id, {
        nuevoEstado: 3,
        usuarioGestionId: user.id,
      });
      setToast({ message: "Devolución rechazada", type: "success" });
      setTimeout(() => {
        onRefresh?.();
      }, 1500);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Error al rechazar la devolución",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className={`${estadoConfig.bg} border-b ${estadoConfig.border} px-6 py-4 flex items-center justify-between flex-shrink-0`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${estadoConfig.bg} flex items-center justify-center`}>
                <EstadoIcon size={20} className={estadoConfig.iconColor} />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${estadoConfig.text}`}>
                  Devolución - Venta N° {devolucion.numeroVenta}
                </h2>
                <p className={`text-xs ${estadoConfig.text} opacity-75`}>{estadoConfig.label}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`${estadoConfig.text} hover:opacity-75 transition-opacity p-1`}
            >
              <X size={24} />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Info Principal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-600 font-semibold uppercase mb-1">Cliente</div>
                <div className="text-sm font-bold text-gray-900">{devolucion.clienteNombre}</div>
                <div className="text-xs text-gray-600 mt-1">
                  Doc: {devolucion.clienteDocumento || "-"}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-600 font-semibold uppercase mb-1">Total Devolución</div>
                <div className="text-lg font-bold" style={{
                  color: userRole === "administrador" ? "#059669" : "#2563eb"
                }}>
                  {fmt(devolucion.totalDevolucion)}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-600 font-semibold uppercase mb-1">Fecha Devolución</div>
                <div className="text-sm text-gray-900">
                  {new Date(devolucion.fechaDevolucion).toLocaleDateString("es-CO")}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-600 font-semibold uppercase mb-1">Usuario</div>
                <div className="text-sm text-gray-900">{devolucion.usuarioNombre || "-"}</div>
              </div>
            </div>

            {/* Motivo y Observaciones */}
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-blue-900 uppercase mb-1">Motivo</div>
                    <div className="text-sm text-blue-800">{devolucion.motivo}</div>
                  </div>
                </div>
              </div>

              {devolucion.observaciones && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-amber-900 uppercase mb-1">
                    Observaciones
                  </div>
                  <div className="text-sm text-amber-800">{devolucion.observaciones}</div>
                </div>
              )}
            </div>

            {/* Productos Devueltos */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Package size={18} style={{
                  color: userRole === "administrador" ? "#059669" : "#2563eb"
                }} /> Productos Devueltos
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Producto</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-700">Cantidad</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Precio Unit.</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(devolucion.detalles || []).map((detalle) => (
                      <tr key={detalle.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-900 font-medium">
                          {detalle.productoNombre}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700">
                          {detalle.cantidadDevuelta}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {fmt(detalle.precioUnitario)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold" style={{
                          color: userRole === "administrador" ? "#059669" : "#2563eb"
                        }}>
                          {fmt(detalle.subtotalDevuelto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex gap-3 flex-shrink-0">
            {isPendiente ? (
              <>
                <button
                  onClick={handleAprobar}
                  disabled={loading}
                  className={`flex-1 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors ${
                    userRole === "administrador" 
                      ? "bg-emerald-600 hover:bg-emerald-700" 
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle size={18} />
                  )}
                  Aprobar
                </button>
                <button
                  onClick={handleRechazar}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <XCircle size={18} />
                  )}
                  Rechazar
                </button>
              </>
            ) : (
              <div className="text-sm text-gray-600 text-center flex-1">
                Esta devolución ya ha sido gestionada
              </div>
            )}
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};
