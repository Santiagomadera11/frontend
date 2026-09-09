import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState } from "react";
import { X, Search, AlertCircle, ChevronRight, ChevronLeft, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { returnService } from "../services/returnService";
import { ToastNotification } from "/src/shared/ui/ToastNotification";

export const ReturnForm = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [searchVentaId, setSearchVentaId] = useState("");
  const [venta, setVenta] = useState(null);
  const [cantidades, setCantidades] = useState({});
  const [motivo, setMotivo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchError, setSearchError] = useState("");

  const { currentUser } = useCurrentUser();
  const user = currentUser || {};
  const userRole = (user.rol || "").toLowerCase().trim();
  const userPerms = (user.permisos || []).map((perm) => String(perm || "").toLowerCase().trim());
  const canCreateReturn = userRole === "administrador" || userPerms.includes("sales.create") || userPerms.includes("sales.return");

  React.useEffect(() => {
    if (isOpen && !canCreateReturn) {
      setToast({ 
        message: "No tienes permisos para crear devoluciones", 
        type: "error" 
      });
      setTimeout(() => onClose?.(), 1500);
    }
  }, [isOpen, canCreateReturn, onClose]);

  const handleSearchVenta = async () => {
    if (!searchVentaId.trim()) {
      setSearchError("Ingresa un número o ID de venta");
      return;
    }

    try {
      setLoading(true);
      setSearchError("");
      const data = await returnService.getVenta(parseInt(searchVentaId));
      setVenta(data);
      setCantidades({});
      setStep(2);
    } catch (err) {
      console.error("Error completo:", err);
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.detail || 
        err.response?.data?.error ||
        `Error ${err.response?.status}: ${err.message}` ||
        "No se encontró la venta. Verifica el ID.";
      setSearchError(errorMessage);
      setVenta(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCantidadChange = (detalleId, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setCantidades((prev) => ({
      ...prev,
      [detalleId]: numValue,
    }));
  };

  const handleSubmit = async () => {
    if (!motivo.trim()) {
      setToast({ message: "El motivo es requerido", type: "error" });
      return;
    }

    const detallesParaDevolver = venta.detalles
      .filter((d) => (cantidades[d.id] || 0) > 0)
      .map((d) => ({
        detalleVentaId: d.id,
        productoId: d.productoId,
        cantidadDevuelta: cantidades[d.id],
      }));

    if (detallesParaDevolver.length === 0) {
      setToast({
        message: "Debes seleccionar al menos un producto para devolver",
        type: "error",
      });
      return;
    }

    const dtoParaEnviar = {
      ventaId: venta.id,
      usuarioId: user.id,
      motivo,
      observaciones: observaciones || null,
      detalles: detallesParaDevolver,
    };


    try {
      setLoading(true);
      await returnService.create(dtoParaEnviar);

      setToast({ message: "Devolución registrada exitosamente", type: "success" });
      setTimeout(() => {
        resetForm();
        onSuccess?.();
        // ← NUEVO: Navegar de vuelta a ventas después de crear devolución (se refrescará automáticamente)
        const userRole = (user.rol || "").toLowerCase().trim();
        navigate(userRole === "administrador" ? "/admin/ventas" : "/employee/ventas");
      }, 1500);
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      setToast({
        message: err.response?.data?.message || "Error al registrar la devolución",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSearchVentaId("");
    setVenta(null);
    setCantidades({});
    setMotivo("");
    setObservaciones("");
    setSearchError("");
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  if (!isOpen) return null;

  const totalDevolucion =
    venta?.detalles.reduce((sum, d) => {
      const cant = cantidades[d.id] || 0;
      return sum + cant * d.precioUnitario;
    }, 0) || 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className={`px-6 py-4 flex items-center justify-between flex-shrink-0 ${
            userRole === "administrador" ? "bg-emerald-600" : "bg-blue-600"
          }`}>
            <h2 className="text-lg font-bold text-white">Nueva Devolución</h2>
            <button
              onClick={handleClose}
              className={`text-white hover:opacity-75 p-1 rounded transition-colors ${
                userRole === "administrador" ? "hover:bg-emerald-700" : "hover:bg-blue-700"
              }`}
            >
              <X size={24} />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6">
            {step === 1 ? (
              // Paso 1: Búsqueda de venta
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Buscar Venta por ID o Número
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: 5 o 1234"
                      value={searchVentaId}
                      onChange={(e) => setSearchVentaId(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearchVenta()}
                      className={`flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${
                        userRole === "administrador" ? "focus:ring-emerald-500" : "focus:ring-blue-500"
                      }`}
                    />
                    <button
                      onClick={handleSearchVenta}
                      disabled={loading}
                      className={`text-white px-4 py-2 rounded-lg disabled:opacity-50 font-medium flex items-center gap-2 ${
                        userRole === "administrador" 
                          ? "bg-emerald-600 hover:bg-emerald-700" 
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {loading ? (
                        <Loader size={18} className="animate-spin" />
                      ) : (
                        <Search size={18} />
                      )}
                      Buscar
                    </button>
                  </div>
                  {searchError && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-red-700">{searchError}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Paso 2: Detalles de devolución
              <div className="space-y-4">
                {/* Info de venta */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-600 font-medium">Venta N°</div>
                      <div className="text-gray-900 font-bold">{venta.numeroVenta}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 font-medium">Cliente</div>
                      <div className="text-gray-900 font-bold">{venta.clienteNombre}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-gray-600 font-medium">Documento</div>
                      <div className="text-gray-900">{venta.clienteDocumento || "-"}</div>
                    </div>
                  </div>
                </div>

                {/* Productos */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Productos a Devolver
                  </label>
                  <div className="space-y-2">
                    {venta.detalles.map((detalle) => (
                      <div key={detalle.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">
                            {detalle.productoNombre}
                          </div>
                          <div className="text-xs text-gray-600">
                            Vendidos: {detalle.cantidad} × $
                            {detalle.precioUnitario.toLocaleString("es-CO")}
                          </div>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={detalle.cantidad}
                          value={cantidades[detalle.id] || 0}
                          onChange={(e) => handleCantidadChange(detalle.id, e.target.value)}
                          className={`w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 ${
                            userRole === "administrador" ? "focus:ring-emerald-500" : "focus:ring-blue-500"
                          } text-sm`}
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Motivo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Motivo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Producto defectuoso"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${
                        userRole === "administrador" ? "focus:ring-emerald-500" : "focus:ring-blue-500"
                      }`}
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    placeholder="Detalles adicionales..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows="3"
                    className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${
                      userRole === "administrador" ? "focus:ring-emerald-500" : "focus:ring-blue-500"
                    } resize-none`}
                  />
                </div>

                {/* Total */}
                <div className={`border rounded-lg p-4 ${
                  userRole === "administrador" 
                    ? "bg-emerald-50 border-emerald-200" 
                    : "bg-blue-50 border-blue-200"
                }`}>
                  <div className="text-sm text-gray-600 mb-1">Total a Devolver</div>
                  <div className={`text-2xl font-bold ${
                    userRole === "administrador" ? "text-emerald-600" : "text-blue-600"
                  }`}>
                    $
                    {totalDevolucion.toLocaleString("es-CO", {
                      maximumFractionDigits: 0,
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex gap-3 flex-shrink-0">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ChevronLeft size={18} /> Atrás
              </button>
            )}
            <button
              onClick={step === 1 ? handleSearchVenta : handleSubmit}
              disabled={loading}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
                userRole === "administrador" 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? (
                <Loader size={18} className="animate-spin" />
              ) : step === 1 ? (
                <>
                  Siguiente <ChevronRight size={18} />
                </>
              ) : (
                "Confirmar Devolución"
              )}
            </button>
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancelar
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
