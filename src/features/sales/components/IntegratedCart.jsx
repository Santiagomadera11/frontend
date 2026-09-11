import React from "react";
import { ShoppingCart, DollarSign } from "lucide-react";

const fmt = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

export const IntegratedCart = ({ 
  products, 
  services, 
  onConfirm, 
  isLoading, 
  primary, 
  disabled,
  porcentajeIva = 19,
  metodoPagoId,
  paymentMethods = [],
  montoRecibido,
  setMontoRecibido,
  referenciaPago,
  setReferenciaPago,
}) => {
  const productsTotal = products.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  const servicesTotal = services.reduce((sum, s) => sum + s.precio, 0);
  const subtotal = productsTotal + servicesTotal;
  const iva = subtotal * (porcentajeIva / 100);
  const totalGeneral = subtotal + iva;

  const hasItems = products.length > 0 || services.length > 0;

  const nombreMetodo = (paymentMethods.find(m => String(m.id) === String(metodoPagoId))?.value || "").toLowerCase();

  const isEfectivo = nombreMetodo.includes("efectivo");
  const isDaviplata = nombreMetodo.includes("daviplata");
  const isTransferencia = nombreMetodo.includes("transferencia");
  const isTarjeta = nombreMetodo.includes("tarjeta");
  const isRefRequired = isDaviplata || isTransferencia || isTarjeta;

  let placeholderText = "Ej: Referencia";
  if (isDaviplata) placeholderText = "Ej: 3001234567";
  else if (isTransferencia) placeholderText = "Ej: REF-20260629";
  else if (isTarjeta) placeholderText = "Ej: Aprobación 123456";

  const isMontoInsuficiente = isEfectivo && (!montoRecibido || Number(montoRecibido) < totalGeneral);
  const isRefMissing = isRefRequired && (!referenciaPago || !referenciaPago.trim());
  const finishDisabled = disabled || isLoading || isMontoInsuficiente || isRefMissing;

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-fit">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShoppingCart size={14} style={{ color: primary }} />
            <h3 className="font-bold text-xs text-gray-900">Resumen de Venta</h3>
          </div>
          {hasItems && (
            <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full font-semibold text-gray-600">
              {products.length + services.length} items
            </span>
          )}
        </div>
      </div>

      {/* Vacío */}
      {!hasItems && (
        <div className="flex flex-col items-center justify-center py-6 text-gray-400">
          <ShoppingCart size={26} className="opacity-20 mb-1.5" />
          <p className="text-[11px] font-semibold">Carrito vacío</p>
          <p className="text-[10px]">Agregue productos o servicios</p>
        </div>
      )}

      {/* Footer SIEMPRE VISIBLE */}
      {hasItems && (
        <div className="border-t border-gray-100 p-2.5 space-y-1.5 bg-gradient-to-b from-white to-gray-50 flex-shrink-0">
          {/* Subtotal */}
          <div className="flex justify-between text-xs text-gray-600">
            <span>Subtotal:</span>
            <span className="font-semibold">{fmt(subtotal)}</span>
          </div>

          {/* IVA */}
          {porcentajeIva > 0 && (
            <div className="flex justify-between text-xs text-gray-600">
              <span>IVA ({porcentajeIva}%):</span>
              <span className="font-semibold">{fmt(iva)}</span>
            </div>
          )}

          {/* Total destacado */}
          <div
            className="flex justify-between text-xs font-black px-2.5 py-2 rounded-lg mt-1.5"
            style={{
              background: primary + "15",
              color: primary
            }}
          >
            <span>TOTAL:</span>
            <span>{fmt(totalGeneral)}</span>
          </div>

          {/* Campos adicionales contextuales */}
          {isEfectivo && (
            <div className="mt-2 space-y-1.5 border-t border-gray-100 pt-2">
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Monto Recibido</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">$</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-6 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold mt-1">
                <span className="text-gray-500">Cambio a devolver:</span>
                {Number(montoRecibido) >= totalGeneral ? (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg text-[10px] font-black border border-emerald-200">
                    {fmt(Number(montoRecibido) - totalGeneral)}
                  </span>
                ) : (
                  <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-lg text-[10px] font-black border border-red-200">
                    Monto insuficiente
                  </span>
                )}
              </div>
            </div>
          )}

          {isRefRequired && (
            <div className="mt-2 space-y-1.5 border-t border-gray-100 pt-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Referencia / comprobante</label>
                  {isRefMissing && <span className="text-[9px] font-bold text-red-500 uppercase">Requerido</span>}
                </div>
                <input
                  type="text"
                  placeholder={placeholderText}
                  value={referenciaPago}
                  onChange={(e) => setReferenciaPago(e.target.value)}
                  className={`w-full bg-gray-50 border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 transition-all font-medium ${isRefMissing ? 'border-red-300 focus:ring-red-200 focus:bg-white' : 'border-gray-200 focus:ring-gray-200 focus:bg-white'}`}
                />
              </div>
            </div>
          )}

          {/* Botón Finalizar */}
          <button
            onClick={onConfirm}
            disabled={finishDisabled}
            className="w-full py-2 rounded-lg text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-md"
            style={{
              background: finishDisabled ? "#cbd5e1" : primary,
            }}
          >
            <DollarSign size={13} />
            {isLoading ? "Procesando..." : "Finalizar Venta"}
          </button>
        </div>
      )}
    </div>
  );
};

export default IntegratedCart;