import React, { useState, useEffect } from "react";
import { X, Layers, AlertCircle, Calendar, User, ShoppingBag, Loader2 } from "lucide-react";
import { productService } from "../services/productService";
import { ToastNotification } from "../../../../shared/ui/ToastNotification";

export const ProductLotesModal = ({ isOpen, onClose, product }) => {
  const [lotes, setLotes] = useState([]);
  const [selectedLote, setSelectedLote] = useState(null);
  const [consumos, setConsumos] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [loadingConsumos, setLoadingConsumos] = useState(false);
  const [toast, setToast] = useState(null);

  const currentUser = JSON.parse(sessionStorage.getItem("syspharma_user") || "{}");
  const userRole = (currentUser.rol || "Administrador").toLowerCase().trim();
  const isEmployee = userRole === "empleado";

  // Estilos y temas
  const headerBgColor = isEmployee ? "bg-blue-600" : "bg-emerald-600";
  const textThemeColor = isEmployee ? "text-blue-600" : "text-emerald-600";
  const borderThemeColor = isEmployee ? "border-blue-200" : "border-emerald-200";
  const hoverRowColor = isEmployee ? "hover:bg-blue-50/50" : "hover:bg-emerald-50/50";
  const activeRowColor = isEmployee ? "bg-blue-50/80 border-l-4 border-l-blue-600" : "bg-emerald-50/80 border-l-4 border-l-emerald-600";

  useEffect(() => {
    if (isOpen && product?.id) {
      loadLotes();
      setSelectedLote(null);
      setConsumos([]);
    }
  }, [isOpen, product]);

  const loadLotes = async () => {
    setLoadingLotes(true);
    try {
      const data = await productService.getLotes(product.id);
      setLotes(data);
    } catch (error) {
      console.error("Error al cargar lotes:", error);
      setToast({
        message: "No se pudieron cargar los lotes del producto.",
        type: "error"
      });
    } finally {
      setLoadingLotes(false);
    }
  };

  const loadConsumos = async (lote) => {
    setSelectedLote(lote);
    setLoadingConsumos(true);
    try {
      const data = await productService.getLotePedidos(lote.id);
      setConsumos(data);
    } catch (error) {
      console.error("Error al cargar consumos:", error);
      setToast({
        message: "No se pudieron cargar los consumos del lote.",
        type: "error"
      });
    } finally {
      setLoadingConsumos(false);
    }
  };

  if (!isOpen) return null;

  const getStatusBadge = (estado) => {
    switch (estado) {
      case "Vencido":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">⚠️ Vencido</span>;
      case "Agotado":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">Agotado</span>;
      case "Por vencer":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">⌛ Por vencer</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">✓ Vigente</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-5xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between text-white ${headerBgColor}`}>
          <h2 className="text-lg font-black flex items-center gap-2">
            <Layers size={20} />
            Lotes e Historial de Consumo
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col md:flex-row gap-6 min-h-0">
          
          {/* Columna Lotes */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="mb-3">
              <h3 className="text-sm font-black text-gray-900">Listado de Lotes</h3>
              <p className="text-[11px] text-gray-500 font-medium">Producto: {product?.nombre}</p>
            </div>

            <div className="flex-1 border border-gray-100 rounded-2xl overflow-hidden flex flex-col min-h-0 bg-gray-50/50">
              {loadingLotes ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="animate-spin text-gray-400" size={32} />
                </div>
              ) : lotes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
                  <Layers size={36} className="mb-2 text-gray-300" />
                  <p className="text-xs font-semibold">Este producto no cuenta con lotes registrados.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100/80 text-gray-600 sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-4 text-[10px] font-bold uppercase tracking-wider">Lote</th>
                        <th className="py-2 px-4 text-[10px] font-bold uppercase tracking-wider">Vencimiento</th>
                        <th className="py-2 px-4 text-[10px] font-bold uppercase tracking-wider text-center">Disponible</th>
                        <th className="py-2 px-4 text-[10px] font-bold uppercase tracking-wider text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {lotes.map((l) => {
                        const isSelected = selectedLote?.id === l.id;
                        return (
                          <tr
                            key={l.id}
                            onClick={() => loadConsumos(l)}
                            className={`cursor-pointer transition-all ${isSelected ? activeRowColor : `${hoverRowColor} hover:translate-x-1`}`}
                          >
                            <td className="py-3 px-4 text-xs font-bold text-gray-900">{l.numeroLote}</td>
                            <td className="py-3 px-4 text-xs text-gray-600">
                              {l.fechaVencimiento ? new Date(l.fechaVencimiento + "T00:00:00").toLocaleDateString("es-CO") : "-"}
                            </td>
                            <td className="py-3 px-4 text-xs font-black text-center text-gray-900">{l.cantidadDisponible}</td>
                            <td className="py-3 px-4 text-center">{getStatusBadge(l.estado)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Columna Ventas/Pedidos */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="mb-3">
              <h3 className="text-sm font-black text-gray-900">Historial de Ventas / Consumos</h3>
              <p className="text-[11px] text-gray-500 font-medium">
                {selectedLote ? `Consumos del Lote: ${selectedLote.numeroLote}` : "Selecciona un lote para ver los consumos"}
              </p>
            </div>

            <div className="flex-1 border border-gray-100 rounded-2xl overflow-hidden flex flex-col min-h-0 bg-gray-50/50">
              {!selectedLote ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
                  <ShoppingBag size={36} className="mb-2 text-gray-300" />
                  <p className="text-xs font-semibold">Selecciona un lote a la izquierda para visualizar qué ventas consumieron sus unidades.</p>
                </div>
              ) : loadingConsumos ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="animate-spin text-gray-400" size={32} />
                </div>
              ) : consumos.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
                  <ShoppingBag size={36} className="mb-2 text-gray-300" />
                  <p className="text-xs font-semibold">Este lote no registra ninguna venta o consumo asociado.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100/80 text-gray-600 sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-4 text-[10px] font-bold uppercase tracking-wider">Fecha</th>
                        <th className="py-2 px-4 text-[10px] font-bold uppercase tracking-wider">Cliente</th>
                        <th className="py-2 px-4 text-[10px] font-bold uppercase tracking-wider text-center">Cant.</th>
                        <th className="py-2 px-4 text-[10px] font-bold uppercase tracking-wider">Atendió</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {consumos.map((c, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-2.5 px-4 text-[11px] text-gray-600">
                            {c.fecha ? new Date(c.fecha).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : "-"}
                          </td>
                          <td className="py-2.5 px-4 text-xs font-bold text-gray-800 truncate max-w-[130px]" title={c.cliente}>
                            {c.cliente}
                          </td>
                          <td className="py-2.5 px-4 text-xs font-black text-center text-gray-900">{c.cantidadTomada}</td>
                          <td className="py-2.5 px-4 text-[11px] text-gray-500 font-medium truncate max-w-[120px]" title={c.usuario}>
                            {c.usuario}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>

      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
