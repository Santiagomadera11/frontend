import React from "react";
import { X } from "lucide-react";

export const OrderDetailModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const formatCurrency = (val) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val || 0);

  const getStatusColor = (estado) => {
    const lower = (estado || "").toLowerCase();
    if (lower === "pendiente") return "bg-yellow-100 text-yellow-700";
    if (lower === "en proceso") return "bg-blue-100 text-blue-700";
    if (lower === "entregado") return "bg-green-100 text-green-700";
    if (lower === "cancelado") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  // Normalizar campos — soporta estructura backend y legacy
  const numeroPedido  = order.numeroPedido  || order.id        || "-";
  const clienteNombre = order.clienteNombre  || order.cliente   || "-";
  const clienteDoc    = order.clienteDocumento || order.documento || "-";
  const clienteTel    = order.clienteTelefono  || null;
  const clienteEmail  = order.clienteEmail     || null;
  const clienteDireccion = order.direccion || null;
  const estadoNombre  = order.estadoNombre  || order.estado    || "-";
  const origen        = order.origen        || order.origin    || "web";
  const fechaCreacion = order.fechaCreacion || order.fecha     || null;
  const usuarioNombre = order.usuarioNombre || order.creadoPor || null;
  const metodoPago    = order.metodoPagoNombre || order.metodoPago || null;

  // ============ NUEVO: Extraer subtotal, IVA y porcentaje ============
  const porcentajeIva = order.porcentajeIva || order.PorcentajeIva || 0;
  const subtotalBackend = order.subtotal || order.Subtotal || null;
  const ivaBackend = order.iva || order.Iva || null;
  const totalBackend = order.total || order.Total || null;

  // Detalles normalizados
  const detalles = order.detalles?.length > 0
    ? order.detalles.map(d => ({
        nombre:   d.nombre || d.productoNombre || "Producto",
        cantidad: d.cantidad,
        precio:   d.precioUnitario || d.precio || 0,
        subtotal: d.subtotal || d.cantidad * (d.precioUnitario || d.precio || 0),
        porcentajeIva: d.porcentajeIva ?? 0,
        iva:      d.iva ?? 0,
      }))
    : (order.productos || []).map(p => ({
        nombre:   p.nombre,
        cantidad: p.cantidad,
        precio:   p.precio || 0,
        subtotal: p.precio * p.cantidad,
        porcentajeIva: p.porcentajeIva ?? 0,
        iva:      p.iva ?? 0,
      }));

  // ============ NUEVO: Calcular subtotal e IVA si no vienen del backend ============
  const subtotalCalculado = detalles.reduce((s, d) => s + d.subtotal, 0);
  const subtotal = subtotalBackend !== null ? subtotalBackend : subtotalCalculado;
  const iva = ivaBackend !== null ? ivaBackend : (subtotal * (porcentajeIva / 100));
  const total = totalBackend !== null ? totalBackend : (subtotal + iva);

  const sumaIvasDetalle = detalles.reduce((s, d) => s + (d.iva || 0), 0);
  const ivaConsistente = order.ivaConsistente !== undefined 
    ? order.ivaConsistente 
    : (Math.abs(sumaIvasDetalle - iva) < 1.0);
  
  const totalProductos = detalles.reduce((s, d) => s + d.cantidad, 0);
  const cantidadItems = detalles.length; // ← NUEVO: Cantidad de líneas/items

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50 sticky top-0">
          <div>
            <h2 className="text-sm font-bold text-gray-800">Detalle del Pedido</h2>
            <p className="text-xs text-gray-500 mt-0.5">{numeroPedido}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-1"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Cliente */}
          <div>
            <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">Información del Cliente</h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between"><span className="text-xs text-gray-500">Nombre:</span><span className="text-xs font-semibold">{clienteNombre}</span></div>
              <div className="flex justify-between"><span className="text-xs text-gray-500">Documento:</span><span className="text-xs font-mono">{clienteDoc}</span></div>
              {clienteTel && <div className="flex justify-between"><span className="text-xs text-gray-500">Teléfono:</span><span className="text-xs font-semibold">{clienteTel}</span></div>}
              {clienteEmail && <div className="flex justify-between"><span className="text-xs text-gray-500">Correo:</span><span className="text-xs font-semibold break-all">{clienteEmail}</span></div>}
              {clienteDireccion && <div className="flex justify-between"><span className="text-xs text-gray-500">Dirección:</span><span className="text-xs font-semibold">{clienteDireccion}</span></div>}
            </div>
          </div>

          {/* Fecha, estado, origen */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Fecha</label>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs font-semibold text-gray-800">
                  {fechaCreacion ? new Date(fechaCreacion).toLocaleDateString("es-CO") : "-"}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Estado</label>
              <div className="bg-gray-50 rounded-lg p-2">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusColor(estadoNombre)}`}>
                  {estadoNombre}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Origen</label>
              <div className="bg-gray-50 rounded-lg p-2">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                  origen === "empleado" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                }`}>
                  {origen === "empleado" ? "Empleado" : "Web"}
                </span>
              </div>
            </div>
          </div>

          {/* Método de pago / Atendido por */}
          {(metodoPago || usuarioNombre) && (
            <div className="grid grid-cols-2 gap-3">
              {metodoPago && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Método de Pago</label>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs font-semibold text-gray-800">{metodoPago}</p>
                  </div>
                </div>
              )}
              {usuarioNombre && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Atendido por</label>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs font-semibold text-gray-800">{usuarioNombre}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Productos */}
          <div>
            <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
              {/* ============ NUEVO: Mostrar cantidad de items ============ */}
              Productos ({cantidadItems} items — {totalProductos} unidades)
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-[150px] overflow-y-auto">
              {detalles.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">Sin productos</p>
              ) : (
                detalles.map((d, idx) => (
                  <div key={idx} className="flex justify-between items-start pb-2 border-b border-gray-200 last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{d.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                        <span>Cantidad: {d.cantidad}</span>
                        {d.porcentajeIva > 0 && (
                          <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-medium border border-emerald-100">
                            IVA: {d.porcentajeIva}% ({formatCurrency(d.iva)})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="text-xs font-bold text-emerald-600">{formatCurrency(d.subtotal)}</p>
                      <p className="text-[10px] text-gray-500">{formatCurrency(d.precio)} c/u</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notas */}
          {order.notas && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Notas</label>
              <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                <p className="text-xs text-gray-600">{order.notas}</p>
              </div>
            </div>
          )}

          {/* Alerta de inconsistencia de IVA */}
          {!ivaConsistente && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs leading-relaxed flex gap-2 items-start">
              <span className="text-base">⚠️</span>
              <div>
                <p className="font-semibold text-amber-900">Advertencia de Inconsistencia Fiscal</p>
                <p className="mt-0.5 text-amber-700">
                  La suma del IVA detallado de los ítems ({formatCurrency(sumaIvasDetalle)}) no coincide con el IVA guardado en la cabecera del pedido ({formatCurrency(iva)}). Este es un registro histórico que conserva los valores originales.
                </p>
              </div>
            </div>
          )}

          {/* ============ NUEVO: Subtotal, IVA y Total ============ */}
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Subtotal:</span>
              <span className="text-xs font-semibold text-gray-700">{formatCurrency(subtotal)}</span>
            </div>
            {porcentajeIva > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">IVA ({porcentajeIva}%):</span>
                <span className="text-xs font-semibold text-gray-700">{formatCurrency(iva)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-gray-100 pt-2">
              <span className="text-sm font-bold text-gray-800">Total:</span>
              <span className="text-sm font-bold text-emerald-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 sticky bottom-0">
          <button onClick={onClose}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;