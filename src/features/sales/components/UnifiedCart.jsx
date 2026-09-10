import React from "react";
import { ShoppingCart, Package, Stethoscope, Minus, Plus, X, Calendar } from "lucide-react";

const fmt = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

export const UnifiedCart = ({
  products = [],
  services = [],
  onUpdateQty,
  onRemoveProduct,
  onRemoveService,
  primary,
  primaryLight,
}) => {
  const totalItems = products.length + services.length;
  const hasItems = totalItems > 0;

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <ShoppingCart size={15} style={{ color: primary }} />
          <h3 className="font-bold text-xs text-gray-900">Carrito</h3>
        </div>
        {hasItems && (
          <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full font-semibold text-gray-600">
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {!hasItems && (
          <div className="h-full flex flex-col items-center justify-center text-gray-300">
            <ShoppingCart size={36} className="opacity-30 mb-2" />
            <p className="text-xs font-semibold text-gray-400">El carrito está vacío</p>
            <p className="text-[10px] text-gray-300 mt-0.5">Busca productos o servicios a la izquierda</p>
          </div>
        )}

        {products.map((item) => {
          const maxStock = item.loteId ? (item.lotes?.find((l) => l.id === item.loteId)?.cantidad ?? item.stock) : item.stock;
          const atMax = maxStock != null && item.cantidad >= maxStock;
          return (
            <div key={`prod-${item.id}-${item.loteId || "no-lote"}`} className="rounded-lg border border-gray-100 bg-gray-50 p-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: primaryLight }}>
                <Package size={15} style={{ color: primary, opacity: 0.6 }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs text-gray-900 truncate">{item.nombre}</p>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  {item.numeroLote && (
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1 py-0.5">
                      Lote: {item.numeroLote}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-500">{fmt(item.precio)} c/u</span>
                </div>
                {atMax && <p className="text-[9px] text-red-500 font-medium mt-0.5">⚠ Stock máximo alcanzado</p>}
              </div>

              <div className="flex items-center gap-0.5 bg-white rounded border border-gray-200 flex-shrink-0">
                <button onClick={() => onUpdateQty(item.id, item.loteId, item.cantidad - 1)} className="w-5 h-5 flex items-center justify-center hover:bg-gray-100">
                  <Minus size={10} />
                </button>
                <span className="w-5 text-center text-[10px] font-bold">{item.cantidad}</span>
                <button
                  onClick={() => onUpdateQty(item.id, item.loteId, item.cantidad + 1)}
                  disabled={atMax}
                  className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={atMax ? "Stock máximo alcanzado" : "Aumentar cantidad"}
                >
                  <Plus size={10} />
                </button>
              </div>

              <p className="font-bold text-xs w-16 text-right flex-shrink-0" style={{ color: primary }}>
                {fmt(item.precio * item.cantidad)}
              </p>

              <button onClick={() => onRemoveProduct(item.id, item.loteId)} className="text-gray-300 hover:text-red-500 flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          );
        })}

        {services.map((service) => (
          <div key={`serv-${service.id}`} className="rounded-lg border border-gray-100 bg-gray-50 p-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50">
              <Stethoscope size={15} className="text-blue-500 opacity-70" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs text-gray-900 truncate">{service.nombre || service.paciente || service.doctorNombre}</p>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[10px] text-gray-500">
                <span>{service.especialidad || service.motivo}</span>
                {service.fecha && (
                  <span className="flex items-center gap-1 text-gray-400">
                    <Calendar size={10} />
                    {new Date(service.fecha).toLocaleDateString("es-CO")} {service.hora}
                  </span>
                )}
              </div>
            </div>

            <p className="font-bold text-xs w-16 text-right flex-shrink-0" style={{ color: primary }}>
              {fmt(service.precio)}
            </p>

            <button onClick={() => onRemoveService(service.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnifiedCart;
