import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingBag, DollarSign, Search, ChevronLeft, ChevronRight,
  Clock, Eye, X, Package, FileText, Printer, AlertCircle,
} from "lucide-react";
import { ordersService } from "../sales/orders/services/ordersService";

// ─────────────────────────────────────────────────────────────
//  IDs de estados_pedido  (mismos que el back)
//  1=Pendiente  2=En proceso  3=Listo  4=Entregado  5=Cancelado
// ─────────────────────────────────────────────────────────────
const ESTADO = {
  PENDIENTE:  1,
  EN_PROCESO: 2,
  LISTO:      3,
  ENTREGADO:  4,
  CANCELADO:  5,
};

const getEstadoStyle = (estadoId) => {
  switch (estadoId) {
    case ESTADO.ENTREGADO:  return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case ESTADO.CANCELADO:  return "bg-red-50 text-red-700 border-red-100";
    case ESTADO.LISTO:      return "bg-yellow-50 text-yellow-700 border-yellow-100";
    case ESTADO.EN_PROCESO: return "bg-emerald-50 text-emerald-700 border-emerald-100";
    default:                return "bg-gray-50 text-gray-700 border-gray-100";   // Pendiente y resto
  }
};

// ─────────────────────────────────────────────────────────────
//  Componente de factura (solo visual / impresión)
// ─────────────────────────────────────────────────────────────
const FacturaModal = ({ order, onClose }) => {
  const facturaRef = useRef(null);

  const fmt = (v) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency", currency: "COP", maximumFractionDigits: 0,
    }).format(v || 0);

  const handleImprimir = () => {
    const contenido = facturaRef.current.innerHTML;
    const ventana = window.open("", "_blank");
    ventana.document.write(`
      <html>
        <head>
          <title>Factura ${order.numeroPedido}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1   { font-size: 20px; font-weight: 900; margin-bottom: 4px; }
            p    { margin: 2px 0; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th    { background: #f1f5f9; text-align: left; padding: 8px; font-size: 12px; }
            td    { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .total-row td { font-weight: 900; font-size: 15px; border-top: 2px solid #111; }
            .right { text-align: right; }
          </style>
        </head>
        <body>${contenido}</body>
      </html>
    `);
    ventana.document.close();
    ventana.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <h2 className="font-black text-gray-900 text-lg flex items-center gap-2">
            <FileText size={18} /> Factura de pedido
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleImprimir}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700">
              <Printer size={13} /> Imprimir / PDF
            </button>
            <button onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Contenido imprimible */}
        <div className="overflow-auto p-5" ref={facturaRef}>
          {/* Encabezado empresa */}
          <div className="mb-5">
            <h1 className="text-2xl font-black text-gray-900">SysPharma</h1>
            <p className="text-xs text-gray-400">Farmacia y servicios de salud</p>
          </div>

          <div className="flex justify-between text-sm mb-5">
            <div>
              <p className="font-bold text-gray-700">Factura N°</p>
              <p className="font-black text-gray-900">{order.numeroPedido}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-700">Fecha</p>
              <p className="text-gray-900">
                {new Date(order.fechaCreacion).toLocaleDateString("es-CO", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Datos del cliente */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5 text-sm space-y-1">
            <p className="font-black text-gray-700 text-xs uppercase tracking-wider mb-2">Cliente</p>
            <p><span className="font-bold">Nombre:</span> {order.clienteNombre || "—"}</p>
            {order.clienteDocumento && (
              <p><span className="font-bold">Documento:</span> {order.clienteDocumento}</p>
            )}
            {order.clienteTelefono && (
              <p><span className="font-bold">Teléfono:</span> {order.clienteTelefono}</p>
            )}
            {order.clienteEmail && (
              <p><span className="font-bold">Email:</span> {order.clienteEmail}</p>
            )}
            {order.metodoPagoNombre && (
              <p><span className="font-bold">Método de pago:</span> {order.metodoPagoNombre}</p>
            )}
          </div>

          {/* Tabla de productos */}
          <table className="w-full text-sm mb-5">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-2 px-3 text-xs font-black text-gray-500 uppercase">Producto</th>
                <th className="text-center py-2 px-3 text-xs font-black text-gray-500 uppercase">Cant.</th>
                <th className="text-right py-2 px-3 text-xs font-black text-gray-500 uppercase">Precio</th>
                <th className="text-right py-2 px-3 text-xs font-black text-gray-500 uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(order.detalles || []).map((d, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 px-3 font-semibold text-gray-800">{d.nombre}</td>
                  <td className="py-2 px-3 text-center text-gray-600">{d.cantidad}</td>
                  <td className="py-2 px-3 text-right text-gray-600">{fmt(d.precioUnitario)}</td>
                  <td className="py-2 px-3 text-right font-bold text-gray-900">
                    {fmt(d.subtotal || d.cantidad * d.precioUnitario)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{fmt(order.subtotal)}</span>
            </div>
            {(order.iva || 0) > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>IVA</span>
                <span>{fmt(order.iva)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-gray-900 text-base pt-2 border-t border-gray-200">
              <span>TOTAL</span>
              <span className="text-emerald-600">{fmt(order.total)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            ¡Gracias por tu compra en SysPharma!
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Vista principal de Mis Pedidos (cliente)
// ─────────────────────────────────────────────────────────────
export const ClientMisPedidos = () => {
  const { currentUser } = useCurrentUser();
  const [orders, setOrders]               = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filterStatus, setFilterStatus]   = useState("Todos");
  const [searchTerm, setSearchTerm]       = useState("");
  const [loading, setLoading]             = useState(true);
  const [currentPage, setCurrentPage]     = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [facturaOrder, setFacturaOrder]   = useState(null);
  const [cancellingId, setCancellingId]   = useState(null);
  const [notification, setNotification]   = useState(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  const recordsPerPage = 4;

  const showNotif = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // 1. CARGAR PEDIDOS
  useEffect(() => {
    if (!currentUser) return;
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await ordersService.getAll();
        const data = Array.isArray(response) ? response : (response.data || []);

        const myOrders = data
          .filter(o => {
            const matchId     = o.usuarioId && Number(o.usuarioId) === Number(currentUser.id);
            const matchEmail  = o.clienteEmail && o.clienteEmail.toLowerCase() === currentUser.email?.toLowerCase();
            const matchNombre = o.clienteNombre && o.clienteNombre.toLowerCase()
              .includes(currentUser.nombre?.toLowerCase().split(" ")[0]);
            return matchId || matchEmail || matchNombre;
          })
          .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));

        setOrders(myOrders);
        setFilteredOrders(myOrders);
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [currentUser]);

  // 2. FILTRADO
  useEffect(() => {
    let result = [...orders];

    if (filterStatus === "En Proceso") {
      // Pendiente (1) y En proceso (2)
      result = result.filter(o =>
        o.estadoId === ESTADO.PENDIENTE || o.estadoId === ESTADO.EN_PROCESO
      );
    } else if (filterStatus === "Entregados") {
      result = result.filter(o => o.estadoId === ESTADO.ENTREGADO);
    }

    if (searchTerm) {
      result = result.filter(o =>
        (o.numeroPedido || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(result);
    setCurrentPage(1);
  }, [filterStatus, searchTerm, orders]);

  // 3. CANCELAR PEDIDO
  const handleCancelar = async (order) => {
    setOrderToCancel(order);
    setShowConfirmCancel(true);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    
    setCancellingId(orderToCancel.id);
    try {
      await ordersService.updateStatus(orderToCancel.id, ESTADO.CANCELADO);

      setOrders(prev =>
        prev.map(o =>
          o.id === orderToCancel.id
            ? { ...o, estadoId: ESTADO.CANCELADO, estadoNombre: "Cancelado" }
            : o
        )
      );
      showNotif("Pedido cancelado correctamente");
      setShowConfirmCancel(false);
      setOrderToCancel(null);
    } catch (err) {
      showNotif(err?.response?.data?.message || "No se pudo cancelar el pedido", "error");
    } finally {
      setCancellingId(null);
    }
  };

  // Paginación
  const indexOfLast    = currentPage * recordsPerPage;
  const indexOfFirst   = indexOfLast - recordsPerPage;
  const currentRecords = filteredOrders.slice(indexOfFirst, indexOfLast);
  const totalPages     = Math.ceil(filteredOrders.length / recordsPerPage);

  if (loading) return (
    <div className="p-20 text-center font-bold text-emerald-600">Cargando tu historial...</div>
  );

  return (
    <div className="h-full flex flex-col gap-4 font-sans p-6 bg-white">

      {/* Notificación temporal */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${
          notification.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
        }`}>
          {notification.message}
        </div>
      )}

      <h1 className="text-3xl font-black text-gray-900">Mis Pedidos</h1>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><ShoppingBag size={24} /></div>
          <div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Total Pedidos</p>
            <p className="text-2xl font-black text-gray-900">{orders.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><DollarSign size={24} /></div>
          <div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Inversión Total</p>
            <p className="text-2xl font-black text-emerald-600">
              ${orders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Buscador y filtros */}
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="Buscar por número de pedido..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["Todos", "En Proceso", "Entregados"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterStatus === s
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="flex-1 flex flex-col gap-3">
        {currentRecords.length === 0 ? (
          <div className="p-10 text-center text-gray-400 border-2 border-dashed rounded-2xl">
            No hay pedidos con el filtro <b>{filterStatus}</b>.
          </div>
        ) : (
          currentRecords.map(o => (
            <div key={o.id}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-200 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <p className="font-black text-gray-900 tracking-tight">{o.numeroPedido}</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                    <Clock size={12} /> {new Date(o.fechaCreacion).toLocaleDateString()}
                  </div>
                  {(o.detalles || []).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(o.detalles || []).slice(0, 3).map((d, i) => (
                        <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {d.nombre} ×{d.cantidad}
                        </span>
                      ))}
                      {(o.detalles || []).length > 3 && (
                        <span className="text-[10px] text-gray-400">
                          +{(o.detalles || []).length - 3} más
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                  <span className={`px-3 py-0.5 rounded-lg text-[10px] font-black uppercase border ${getEstadoStyle(o.estadoId)}`}>
                    {o.estadoNombre}
                  </span>
                  <p className="text-xl font-black text-gray-900 tracking-tighter">
                    ${(o.total || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 justify-end">
                <button
                  onClick={() => setSelectedOrder(o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors">
                  <Eye size={13} /> Ver detalle
                </button>

                {/* Factura — solo si está entregado */}
                {o.estadoId === ESTADO.ENTREGADO && (
                  <button
                    onClick={() => setFacturaOrder(o)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors">
                    <FileText size={13} /> Ver factura
                  </button>
                )}

                {/* Cancelar — solo si está pendiente */}
                {o.estadoId === ESTADO.PENDIENTE && (
                  <button
                    onClick={() => handleCancelar(o)}
                    disabled={cancellingId === o.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50">
                    <X size={13} />
                    {cancellingId === o.id ? "Cancelando..." : "Cancelar pedido"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 border rounded-xl hover:bg-gray-50 disabled:opacity-20">
              <ChevronLeft size={18} />
            </button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 border rounded-xl hover:bg-gray-50 disabled:opacity-20">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="font-black text-gray-900 text-lg">{selectedOrder.numeroPedido}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(selectedOrder.fechaCreacion).toLocaleDateString("es-CO", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${getEstadoStyle(selectedOrder.estadoId)}`}>
                  {selectedOrder.estadoNombre}
                </span>
                <button onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Package size={13} /> Productos
              </p>
              {(selectedOrder.detalles || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin productos registrados</p>
              ) : (
                <div className="space-y-2">
                  {(selectedOrder.detalles || []).map((d, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{d.nombre}</p>
                        <p className="text-[11px] text-gray-400">
                          {d.cantidad} × ${(d.precioUnitario || 0).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        ${(d.subtotal || d.cantidad * d.precioUnitario || 0).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mx-5 mb-5 bg-gray-50 rounded-xl p-4 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span>
                <span>${(selectedOrder.subtotal || 0).toLocaleString()}</span>
              </div>
              {(selectedOrder.iva || 0) > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>IVA</span>
                  <span>${(selectedOrder.iva || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-gray-900 pt-1.5 border-t border-gray-200">
                <span>Total</span>
                <span className="text-emerald-600">${(selectedOrder.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal factura */}
      {facturaOrder && (
        <FacturaModal order={facturaOrder} onClose={() => setFacturaOrder(null)} />
      )}

      {/* Modal de confirmación de cancelación */}
      {showConfirmCancel && orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="bg-red-50 px-5 py-3 border-b border-red-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <AlertCircle size={18} className="text-red-600" />
                ¿Cancelar pedido?
              </h3>
              <button
                onClick={() => {
                  setShowConfirmCancel(false);
                  setOrderToCancel(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              <p className="text-sm text-gray-700">
                ¿Estás seguro de que deseas cancelar el pedido <strong>{orderToCancel.numeroPedido}</strong>?
              </p>
              <p className="text-xs text-gray-500 mt-3">
                Esta acción no se puede deshacer y se registrará en tu historial de pedidos.
              </p>
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total a cancelar</p>
                <p className="text-xl font-black text-gray-900">
                  ${(orderToCancel.total || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-red-50 px-5 py-3 border-t border-red-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowConfirmCancel(false);
                  setOrderToCancel(null);
                }}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
              >
                No, mantener
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancellingId === orderToCancel.id}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancellingId === orderToCancel.id ? "Cancelando..." : "Sí, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientMisPedidos;