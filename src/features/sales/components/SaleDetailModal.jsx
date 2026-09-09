import React from "react";
import { X, User, CreditCard, Package, CheckCircle, RotateCcw, XCircle, Receipt, Clock } from "lucide-react";

const ESTADO_CONFIG = {
  completada:  { label: "Completada",  icon: CheckCircle, bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700", iconColor: "text-emerald-500" },
  devolucion:  { label: "Devolución",  icon: RotateCcw,   bg: "bg-amber-50",   border: "border-amber-100",   text: "text-amber-700",   iconColor: "text-amber-500"   },
  anulada:     { label: "Anulada",     icon: XCircle,     bg: "bg-red-50",     border: "border-red-100",     text: "text-red-700",     iconColor: "text-red-500"     },
  pendiente:   { label: "Pendiente",   icon: Clock,       bg: "bg-blue-50",    border: "border-blue-100",    text: "text-blue-700",    iconColor: "text-blue-500"    },
};

const fmt = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

export const SaleDetailModal = ({ isOpen, onClose, sale }) => {
  if (!isOpen || !sale) return null;

  const estadoKey = (sale.estadoNombre || sale.estado || "completada").toLowerCase();
  const estado = ESTADO_CONFIG[estadoKey] || ESTADO_CONFIG.completada;
  const EstadoIcon = estado.icon;

  // ============ NUEVO: Extraer subtotal, IVA y porcentaje ============
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

  // ============ NUEVO: Calcular subtotal e IVA si no vienen del backend ============
  const subtotalCalculado = productos.reduce((s, item) => s + item.subtotal, 0) + servicios.reduce((s, item) => s + item.subtotal, 0);
  const subtotal = subtotalBackend !== null ? subtotalBackend : subtotalCalculado;
  const iva = ivaBackend !== null ? ivaBackend : (subtotal * (porcentajeIva / 100));
  const total = totalBackend !== null ? totalBackend : (subtotal + iva);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header más pequeño */}
        <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-white" />
            <p className="text-white font-black text-xs uppercase tracking-tight">Venta {sale.numeroVenta || sale.id}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Estado badge compacto */}
        <div className={`px-4 py-2 flex items-center justify-between border-b ${estado.bg} ${estado.border}`}>
          <div className="flex items-center gap-1.5">
            <EstadoIcon size={12} className={estado.iconColor} />
            <span className={`text-[10px] font-black uppercase ${estado.text}`}>{estado.label}</span>
          </div>
          <span className="text-[10px] font-bold text-gray-400">
            {sale.fechaVenta ? new Date(sale.fechaVenta).toLocaleDateString() : '-'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Info cliente, pago e ID en una sola columna para ahorrar espacio */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <Receipt size={14} className="text-gray-400" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">ID de Venta</p>
                <p className="text-xs font-bold text-gray-800 truncate">{sale.id || sale.numeroVenta || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <User size={14} className="text-gray-400" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">Cliente</p>
                <p className="text-xs font-bold text-gray-800 truncate">{sale.clienteNombre || "Consumidor Final"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <CreditCard size={14} className="text-gray-400" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">Método de Pago</p>
                <p className="text-xs font-bold text-gray-800 truncate">{sale.metodoPagoNombre || "Efectivo"}</p>
              </div>
            </div>
            {sale.referenciasPago && (
              <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <Receipt size={14} className="text-gray-400" />
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">Referencia de Pago</p>
                  <p className="text-xs font-bold text-gray-800 truncate">{sale.referenciasPago}</p>
                </div>
              </div>
            )}
          </div>

          {/* Listado de Productos */}
          {productos.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 px-1">
                Productos ({productos.length})
              </p>
              <div className="space-y-1.5 mb-4">
                {productos.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-800 truncate">
                        <span className="text-[8px] mr-1.5 px-1 rounded font-black bg-blue-100 text-blue-600">
                          PROD
                        </span>
                        {item.nombre}
                      </p>
                      <p className="text-[9px] text-gray-400">Cant: {item.cantidad} x {fmt(item.precio)}</p>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="text-[11px] font-black text-gray-900">{fmt(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Listado de Servicios */}
          {servicios.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2 px-1">
                Servicios ({servicios.length})
              </p>
              <div className="space-y-1.5 mb-4">
                {servicios.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-800 truncate">
                        <span className="text-[8px] mr-1.5 px-1 rounded font-black bg-purple-100 text-purple-600">
                          SERV
                        </span>
                        {item.nombre}
                      </p>
                      <p className="text-[9px] text-gray-400">Cant: {item.cantidad} x {fmt(item.precio)}</p>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="text-[11px] font-black text-gray-900">{fmt(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {productos.length === 0 && servicios.length === 0 && (
            <p className="text-[10px] text-center text-gray-400 py-4 italic">No hay productos ni servicios registrados</p>
          )}

          {/* Notas compactas */}
          {sale.notas && (
            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
              <p className="text-[9px] font-bold text-amber-600 uppercase mb-1">Notas</p>
              <p className="text-[10px] text-gray-600 leading-tight">{sale.notas}</p>
            </div>
          )}
        </div>

        {/* ============ NUEVO: Footer con Subtotal, IVA y Total ============ */}
        <div className="bg-gray-50 border-t border-gray-100 p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-gray-400 uppercase">Subtotal</span>
            <span className="text-[11px] font-bold text-gray-700">{fmt(subtotal)}</span>
          </div>
          {porcentajeIva > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-gray-400 uppercase">IVA ({porcentajeIva}%)</span>
              <span className="text-[11px] font-bold text-gray-700">{fmt(iva)}</span>
            </div>
          )}
          <div className="flex justify-between items-end border-t border-gray-200 pt-2">
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Total de la venta</p>
              <p className="text-2xl font-black text-emerald-600 leading-none mt-1">{fmt(total)}</p>
            </div>
            <div className="text-right">
                <p className="text-[8px] font-bold text-gray-400 uppercase">Atendido por</p>
                <p className="text-[10px] font-bold text-gray-600">{sale.usuarioNombre?.split(' ')[0] || "Admin"}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-full py-2.5 bg-gray-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md mt-2">
            Cerrar Detalles
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaleDetailModal;