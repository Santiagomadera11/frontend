import React from "react";
import { X, User, CreditCard, DollarSign, Package, Stethoscope, CheckCircle, RotateCcw, XCircle, Receipt, Clock } from "lucide-react";

const ESTADO_CONFIG = {
  completada:  { label: "Completada",  icon: CheckCircle, bg: "bg-emerald-100", text: "text-emerald-700" },
  devolucion:  { label: "Devolución",  icon: RotateCcw,   bg: "bg-amber-100",   text: "text-amber-700"   },
  anulada:     { label: "Anulada",     icon: XCircle,     bg: "bg-red-100",     text: "text-red-700"     },
  pendiente:   { label: "Pendiente",   icon: Clock,       bg: "bg-blue-100",    text: "text-blue-700"    },
};

const fmt = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

export const SaleDetailModal = ({ isOpen, onClose, sale, accentColor = "emerald" }) => {
  if (!isOpen || !sale) return null;

  const accent = accentColor === "blue"
    ? { header: "bg-blue-50 border-blue-200", text: "text-blue-600", iconBg: "bg-blue-100" }
    : { header: "bg-emerald-50 border-emerald-200", text: "text-emerald-600", iconBg: "bg-emerald-100" };

  const estadoKey = (sale.estadoNombre || sale.estado || "completada").toLowerCase();
  const estado = ESTADO_CONFIG[estadoKey] || ESTADO_CONFIG.completada;
  const EstadoIcon = estado.icon;

  const porcentajeIva = sale.porcentajeIva || sale.PorcentajeIva || 0;
  const subtotalBackend = sale.subtotal || sale.Subtotal || null;
  const ivaBackend = sale.iva || sale.Iva || null;
  const totalBackend = sale.total || sale.Total || null;

  const productos = (sale.detalles || []).map((d) => ({
    nombre: d.productoNombre || d.producto?.nombre || "Producto",
    cantidad: d.cantidad,
    precio: d.precioUnitario,
    subtotal: d.subtotal || (d.cantidad * d.precioUnitario),
  }));

  const servicios = (sale.servicios || []).map((s) => ({
    nombre: s.servicioNombre || s.servicio?.nombre || "Servicio",
    cantidad: s.cantidad,
    precio: s.precioUnitario,
    subtotal: s.subtotal || (s.cantidad * s.precioUnitario),
  }));

  const subtotalCalculado = productos.reduce((s, item) => s + item.subtotal, 0) + servicios.reduce((s, item) => s + item.subtotal, 0);
  const subtotal = subtotalBackend !== null ? subtotalBackend : subtotalCalculado;
  const iva = ivaBackend !== null ? ivaBackend : (subtotal * (porcentajeIva / 100));
  const total = totalBackend !== null ? totalBackend : (subtotal + iva);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${accent.header} flex-shrink-0`}>
          <h2 className={`text-lg font-semibold ${accent.text}`}>Detalle de Venta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Encabezado: número, cliente, estado */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-lg ${accent.iconBg} ${accent.text} flex-shrink-0`}>
                <Receipt size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900">{sale.numeroVenta || `Venta #${sale.id}`}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {sale.clienteNombre || "Consumidor Final"} · {sale.fechaVenta ? new Date(sale.fechaVenta).toLocaleDateString() : "-"}
                </p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-2 ${estado.bg} ${estado.text}`}>
                  <EstadoIcon size={11} /> {estado.label}
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-gray-100">
                <div className={`inline-flex p-1.5 rounded-md mb-1.5 ${accent.iconBg} ${accent.text}`}><DollarSign size={13} /></div>
                <p className="text-[10px] text-gray-400">Total</p>
                <p className={`text-sm font-bold ${accent.text}`}>{fmt(total)}</p>
              </div>
              <div className="p-3 rounded-lg border border-gray-100">
                <div className={`inline-flex p-1.5 rounded-md mb-1.5 ${accent.iconBg} ${accent.text}`}><CreditCard size={13} /></div>
                <p className="text-[10px] text-gray-400">Método de Pago</p>
                <p className="text-xs font-semibold text-gray-900 truncate">{sale.metodoPagoNombre || "Efectivo"}</p>
              </div>
              <div className="p-3 rounded-lg border border-gray-100">
                <div className={`inline-flex p-1.5 rounded-md mb-1.5 ${accent.iconBg} ${accent.text}`}><User size={13} /></div>
                <p className="text-[10px] text-gray-400">Atendido por</p>
                <p className="text-xs font-semibold text-gray-900 truncate">{sale.usuarioNombre?.split(' ')[0] || "Admin"}</p>
              </div>
            </div>

            {sale.referenciasPago && (
              <div className="p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Referencia de Pago</p>
                <p className="text-xs font-medium text-gray-800">{sale.referenciasPago}</p>
              </div>
            )}

            {/* Productos */}
            {productos.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Package size={12} /> Productos ({productos.length})
                </p>
                <div className="space-y-1.5">
                  {productos.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.nombre}</p>
                        <p className="text-[10px] text-gray-400">Cant: {item.cantidad} x {fmt(item.precio)}</p>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 ml-2 flex-shrink-0">{fmt(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Servicios */}
            {servicios.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Stethoscope size={12} /> Servicios ({servicios.length})
                </p>
                <div className="space-y-1.5">
                  {servicios.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.nombre}</p>
                        <p className="text-[10px] text-gray-400">Cant: {item.cantidad} x {fmt(item.precio)}</p>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 ml-2 flex-shrink-0">{fmt(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {productos.length === 0 && servicios.length === 0 && (
              <p className="text-xs text-center text-gray-400 py-4 italic">No hay productos ni servicios registrados</p>
            )}

            {/* Resumen */}
            <div className={`rounded-lg border ${accent.header} p-3 space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500">Subtotal</span>
                <span className="text-xs font-medium text-gray-700">{fmt(subtotal)}</span>
              </div>
              {porcentajeIva > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">IVA ({porcentajeIva}%)</span>
                  <span className="text-xs font-medium text-gray-700">{fmt(iva)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1.5 border-t border-white/60">
                <span className={`text-[10px] font-bold uppercase ${accent.text}`}>Total</span>
                <span className={`text-base font-bold ${accent.text}`}>{fmt(total)}</span>
              </div>
            </div>

            {/* Notas */}
            {sale.notas && (
              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                <p className="text-[9px] font-semibold text-amber-600 uppercase mb-1">Notas</p>
                <p className="text-xs text-gray-600 leading-relaxed">{sale.notas}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default SaleDetailModal;
