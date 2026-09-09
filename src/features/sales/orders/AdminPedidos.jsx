import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Search, Eye, ChevronLeft, ChevronRight, Calendar,
  Plus, Download, Edit, Trash2, CheckCircle, Globe, User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ordersService } from "./services/ordersService";
import { OrderDetailModal } from "./components/OrderDetailModal";
import { ToastNotification } from "../../../shared/ui/ToastNotification";

export const AdminPedidos = () => {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const user = currentUser || {};
  const userRole = (user.rol || "").toLowerCase().trim();
  const userPerms = (user.permisos || []).map((p) => String(p || "").toLowerCase().trim());
  const isAdmin = userRole === "administrador";
  const isEmployeePanel = userRole !== "administrador";
  const hasPerm = (p) => isAdmin || userPerms.includes(p);
  const canCreateOrder  = hasPerm("orders.create");
  const canEditOrder    = hasPerm("orders.edit");
  const canDeleteOrder  = hasPerm("orders.delete");
  const canChangeStatus = hasPerm("orders.status");
  const canExport       = hasPerm("orders.export");

  const theme = isEmployeePanel
    ? { main: "bg-blue-600", hover: "hover:bg-blue-700", text: "text-blue-600", light: "bg-blue-50", border: "border-blue-200" }
    : { main: "bg-emerald-600", hover: "hover:bg-emerald-700", text: "text-emerald-600", light: "bg-emerald-50", border: "border-emerald-200" };

  const [orders, setOrders]                   = useState([]);
  const [estados, setEstados]                 = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [searchTerm, setSearchTerm]           = useState("");
  const [statusFilter, setStatusFilter]       = useState("Todos");
  const [originFilter, setOriginFilter]       = useState("Todos");
  const [startDate, setStartDate]             = useState("");
  const [endDate, setEndDate]                 = useState("");
  const [currentPage, setCurrentPage]         = useState(0);
  const [notification, setNotification]       = useState(null);
  const [isDetailOpen, setIsDetailOpen]       = useState(false);
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen]         = useState(false);
  const [orderToChangeStatus, setOrderToChangeStatus]     = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen]         = useState(false);
  const [orderToDelete, setOrderToDelete]     = useState(null);
  const [tooltipOrderId, setTooltipOrderId]   = useState(null);

  // ── NUEVO: ocultar pedidos Entregados por default ────────────────────────
  const [showEntregados, setShowEntregados]   = useState(false);

  const itemsPerPage = 6;
  const isMountedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const loadOrders = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      setLoading(true);
      const data = await ordersService.getAll();
      if (!isMountedRef.current) return;
      setOrders(Array.isArray(data) ? data : []);
    } catch { if (isMountedRef.current) setOrders([]); }
    finally { if (isMountedRef.current) setLoading(false); isLoadingRef.current = false; }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadOrders();
    ordersService.getEstados().then((data) => { if (isMountedRef.current) setEstados(Array.isArray(data)?data:[]); }).catch(() => { if (isMountedRef.current) setEstados([]); });
    const handleSync = () => loadOrders();
    window.addEventListener("syspharma_orders_updated", handleSync);
    window.addEventListener("orders:changed", handleSync);
    return () => {
      isMountedRef.current = false;
      isLoadingRef.current = false;
      window.removeEventListener("syspharma_orders_updated", handleSync);
      window.removeEventListener("orders:changed", handleSync);
    };
  }, [loadOrders]);

  const formatCurrency = (v) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

  const getStatusColor = (estado) => {
    const s = (estado || "").toLowerCase();
    if (s === "pendiente")  return "bg-yellow-100 text-yellow-700";
    if (s === "en proceso") return "bg-blue-100 text-blue-700";
    if (s === "listo")      return "bg-indigo-100 text-indigo-700";
    if (s === "entregado")  return "bg-green-100 text-green-700";
    if (s === "cancelado")  return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const getOriginBadge = (origen) => {
    if ((origen || "").toLowerCase() === "empleado")
      return <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><User size={11} /> Empleado</span>;
    return <span className="bg-purple-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Globe size={11} /> Web</span>;
  };

  const stats = useMemo(() => ({
    total:        orders.length,
    pendientes:   orders.filter(o => (o.estadoNombre || "").toLowerCase() === "pendiente").length,
    entregados:   orders.filter(o => (o.estadoNombre || "").toLowerCase() === "entregado").length,
    totalCartera: orders.reduce((s, o) => s + (o.total || 0), 0),
    empleado:     orders.filter(o => (o.origen || "").toLowerCase() === "empleado").length,
    web:          orders.filter(o => (o.origen || "").toLowerCase() === "web").length,
    hoy:          orders.filter(o => o.fechaCreacion && new Date(o.fechaCreacion).toLocaleDateString("es-CO") === new Date().toLocaleDateString("es-CO")).length,
  }), [orders]);

  const filteredOrders = useMemo(() => orders.filter(o => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (o.numeroPedido     || "").toLowerCase().includes(term) ||
      (o.clienteNombre    || "").toLowerCase().includes(term) ||
      (o.clienteDocumento || "").includes(term);
    const matchStatus = statusFilter === "Todos" || (o.estadoNombre || "").toLowerCase() === statusFilter.toLowerCase();
    const matchOrigin = originFilter === "Todos" || (o.origen || "").toLowerCase() === originFilter.toLowerCase();

    // ── Ocultar entregados salvo que el toggle esté activo ──────────────
    const isEntregado = (o.estadoNombre || "").toLowerCase() === "entregado";
    if (isEntregado && !showEntregados && statusFilter === "Todos") return false;

    if (!matchSearch || !matchStatus || !matchOrigin) return false;
    if (startDate && o.fechaCreacion && new Date(o.fechaCreacion) < new Date(startDate)) return false;
    if (endDate   && o.fechaCreacion && new Date(o.fechaCreacion) > new Date(endDate))   return false;
    return true;
  }), [orders, searchTerm, statusFilter, originFilter, startDate, endDate, showEntregados]);

  const totalPages     = Math.ceil(filteredOrders.length / itemsPerPage);
  const displayedOrders = filteredOrders.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  // ── Cambiar estado ───────────────────────────────────────────────────────
  const confirmStatusChange = async (estadoId) => {
    if (!orderToChangeStatus) return;
    if (!canChangeStatus) {
      setNotification({ message: "No tenés permiso para cambiar estados", type: "error", zIndex: 1000 });
      setIsStatusModalOpen(false);
      setOrderToChangeStatus(null);
      return;
    }

    // ¿El admin está marcando como Entregado?
    const estadoSeleccionado = estados.find(e => e.id === estadoId);
    const esEntregado = (estadoSeleccionado?.nombre || "").toLowerCase() === "entregado";

    try {
      await ordersService.updateStatus(orderToChangeStatus.id, estadoId);

      if (esEntregado) {
        // Mensaje especial: se creó una venta automáticamente
        setNotification({
          message: "✅ Pedido entregado — se generó la venta automáticamente en el módulo de Ventas",
          type: "success",
          zIndex: 1000,
        });
      } else {
        setNotification({ message: "Estado actualizado correctamente", type: "success", zIndex: 1000 });
      }

      await loadOrders();
    } catch (err) {
      // El backend devuelve mensajes descriptivos (ej: "No hay turno activo")
      setNotification({
        message: err?.response?.data?.message || "Error al cambiar estado",
        type: "error",
        zIndex: 1000,
      });
    }
    setIsStatusModalOpen(false);
    setOrderToChangeStatus(null);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete || !canDeleteOrder) {
      setNotification({ message: "No tenés permiso para eliminar pedidos", type: "error", zIndex: 1000 });
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
      return;
    }
    try {
      await ordersService.delete(orderToDelete.id);
      setNotification({ message: "Pedido eliminado correctamente", type: "success", zIndex: 1000 });
      await loadOrders();
    } catch (err) {
      setNotification({ message: err?.response?.data?.message || "Error al eliminar", type: "error", zIndex: 1000 });
    }
    setIsDeleteModalOpen(false);
    setOrderToDelete(null);
  };

  const handleEditOrder = (order) => {
    if (!canEditOrder) return;
    sessionStorage.setItem("syspharma_edit_order", JSON.stringify(order));
    navigate(isEmployeePanel ? "/employee/pedidos/crear" : "/admin/pedidos/crear");
  };

  const exportCSV = () => {
    if (!canExport) return;
    const csv = "data:text/csv;charset=utf-8,Código,Cliente,Documento,Fecha,Total,Estado\n" +
      filteredOrders.map(o =>
        `${o.numeroPedido},${o.clienteNombre},${o.clienteDocumento || ""},${o.fechaCreacion ? new Date(o.fechaCreacion).toLocaleDateString("es-CO") : ""},${o.total},${o.estadoNombre}`
      ).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "pedidos_syspharma.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col gap-4 font-sans">

      {/* Header */}
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Pedidos</h1>
          <p className="text-gray-500 text-xs mt-0.5">Control administrativo de todos los pedidos</p>
        </div>
        {canCreateOrder && (
          <button
            onClick={() => navigate(isEmployeePanel ? "/employee/pedidos/crear" : "/admin/pedidos/crear")}
            className={`${theme.main} ${theme.hover} text-white px-4 py-2 rounded-lg font-bold shadow-sm text-xs flex items-center gap-2`}>
            <Plus size={16} /> Crear pedido
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 flex-shrink-0">
        {[
          { label: "Total",      value: stats.total,      sub: formatCurrency(stats.totalCartera), color: "border-gray-100" },
          { label: "Empleados",  value: stats.empleado,   color: "border-blue-200 from-blue-50",    textColor: "text-blue-700" },
          { label: "Web",        value: stats.web,        color: "border-purple-200 from-purple-50", textColor: "text-purple-700" },
          { label: "Pendientes", value: stats.pendientes, color: "border-yellow-200 from-yellow-50", textColor: "text-yellow-700" },
          { label: "Hoy",        value: stats.hoy,        color: "border-indigo-200 from-indigo-50", textColor: "text-indigo-700" },
        ].map(({ label, value, sub, color, textColor }) => (
          <div key={label} className={`bg-white rounded-xl shadow-sm border ${color} bg-gradient-to-br p-4`}>
            <p className={`text-xs font-semibold mb-1 ${textColor || "text-gray-500"}`}>{label}</p>
            <p className={`text-2xl font-bold ${textColor || "text-gray-800"}`}>{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-shrink-0 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Buscar por código, cliente, documento..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none text-xs bg-white"
            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }} />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none">
          <option value="Todos">Todos los estados</option>
          {estados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
        </select>
        <select value={originFilter} onChange={(e) => { setOriginFilter(e.target.value); setCurrentPage(0); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none">
          <option value="Todos">Todos los orígenes</option>
          <option value="empleado">Empleados</option>
          <option value="web">Web</option>
        </select>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Calendar size={14} className="text-gray-400" />
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(0); }}
            className="text-xs focus:outline-none w-32 bg-transparent" />
          <span className="text-gray-300">-</span>
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(0); }}
            className="text-xs focus:outline-none w-32 bg-transparent" />
        </div>

        {/* ── NUEVO: toggle Entregados ─────────────────────────────────────── */}
        <button
          onClick={() => { setShowEntregados(v => !v); setCurrentPage(0); }}
          className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
            showEntregados
              ? "bg-green-100 text-green-700 border-green-300"
              : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
          }`}
          title="Mostrar/ocultar pedidos ya entregados (ya tienen su venta generada)">
          {showEntregados ? "✓ Mostrando entregados" : "Entregados"}
          {!showEntregados && stats.entregados > 0 && (
            <span className="ml-1.5 bg-green-500 text-white rounded-full px-1.5 py-0.5 text-[9px]">
              {stats.entregados}
            </span>
          )}
        </button>

        {canExport && (
          <button onClick={exportCSV} className={`${theme.main} ${theme.hover} text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2`}>
            <Download size={14} /> Exportar
          </button>
        )}
        {(searchTerm || statusFilter !== "Todos" || originFilter !== "Todos" || startDate || endDate) && (
          <button onClick={() => { setSearchTerm(""); setStatusFilter("Todos"); setOriginFilter("Todos"); setStartDate(""); setEndDate(""); setCurrentPage(0); }}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium">
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className={`${theme.main} text-white text-xs uppercase tracking-wider sticky top-0 z-10`}>
              <tr>
                {["Código", "Cliente", "Origen", "Documento", "Fecha", "Productos", "Total", "Estado", "Acciones"].map(h => (
                  <th key={h} className="px-3 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">Cargando pedidos...</td></tr>
              ) : displayedOrders.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">No hay pedidos para mostrar</td></tr>
              ) : (
                displayedOrders.map(order => {
                  const esEntregado = (order.estadoNombre || "").toLowerCase() === "entregado";
                  return (
                    <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${esEntregado ? "opacity-60" : ""}`}>
                      <td className="px-3 py-2.5 font-mono font-semibold text-gray-700">{order.numeroPedido}</td>
                      <td className="px-3 py-2.5 font-medium">{order.clienteNombre}</td>
                      <td className="px-3 py-2.5">{getOriginBadge(order.origen)}</td>
                      <td className="px-3 py-2.5 text-gray-600">{order.clienteDocumento || "-"}</td>
                      <td className="px-3 py-2.5 text-gray-600">
                        {order.fechaCreacion ? new Date(order.fechaCreacion).toLocaleDateString("es-CO") : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-center font-semibold relative">
                        <div className="cursor-help inline-block"
                          onMouseEnter={() => setTooltipOrderId(order.id)}
                          onMouseLeave={() => setTooltipOrderId(null)}>
                          {(order.detalles || []).reduce((s, d) => s + d.cantidad, 0)}
                        </div>
                        {tooltipOrderId === order.id && (order.detalles || []).length > 0 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-gray-800 text-white text-xs py-2 px-3 rounded-lg whitespace-nowrap shadow-lg">
                            {order.detalles.map((d, i) => <div key={i}>{d.nombre}</div>)}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                          </div>
                        )}
                      </td>
                      <td className={`px-3 py-2.5 font-bold ${theme.text} text-right`}>{formatCurrency(order.total)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusColor(order.estadoNombre)}`}>
                          {order.estadoNombre}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}
                            className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors" title="Ver detalle">
                            <Eye size={16} />
                          </button>
                          {/* No mostrar cambio de estado si ya fue entregado */}
                          {canChangeStatus && !esEntregado && (
                            <button onClick={() => { setOrderToChangeStatus(order); setIsStatusModalOpen(true); }}
                              className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors" title="Cambiar estado">
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {(order.estadoNombre || "").toLowerCase() === "pendiente" && canEditOrder && (
                            <button onClick={() => handleEditOrder(order)}
                              className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors" title="Editar">
                              <Edit size={16} />
                            </button>
                          )}
                          {canDeleteOrder && (
                            <button onClick={() => { setOrderToDelete(order); setIsDeleteModalOpen(true); }}
                              className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredOrders.length > 0 && (
          <div className="border-t border-gray-100 p-3 bg-gray-50 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] text-gray-500">
              Página {currentPage + 1} de {totalPages} ({filteredOrders.length} pedidos)
              {!showEntregados && stats.entregados > 0 && (
                <span className="ml-2 text-green-600">· {stats.entregados} entregados ocultos</span>
              )}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
                className="p-1 rounded bg-white border border-gray-200 disabled:opacity-50"><ChevronLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}
                className="p-1 rounded bg-white border border-gray-200 disabled:opacity-50"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {notification && (
        <ToastNotification message={notification.message} type={notification.type} zIndex={notification.zIndex} onClose={() => setNotification(null)} />
      )}

      <OrderDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} order={selectedOrder} />

      {/* Modal cambio de estado */}
      {isStatusModalOpen && orderToChangeStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Cambiar Estado</h3>
            <p className="text-sm text-gray-600 mb-4">Pedido: <span className="font-semibold">{orderToChangeStatus.numeroPedido}</span></p>
            {/* Aviso especial si van a marcar como Entregado */}
            {estados.find(e => (e.nombre || "").toLowerCase() === "entregado") && (
              <div className="mb-4 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-2">
                Al marcar como <b>Entregado</b> se creará automáticamente una venta en el módulo de Ventas.
              </div>
            )}
            <div className="space-y-2 mb-6">
              {estados.map(e => (
                <button key={e.id} onClick={() => confirmStatusChange(e.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    orderToChangeStatus.estadoId === e.id
                      ? `${theme.light} ${theme.border} ${theme.text}`
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}>
                  {e.nombre}
                </button>
              ))}
            </div>
            <button onClick={() => setIsStatusModalOpen(false)}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium">Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {isDeleteModalOpen && orderToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-red-600 mb-4">Confirmar Eliminación</h3>
            <p className="text-sm text-gray-600 mb-2">¿Eliminar el pedido <span className="font-semibold">{orderToDelete.numeroPedido}</span>?</p>
            <p className="text-xs text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium">Cancelar</button>
              <button onClick={confirmDeleteOrder}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPedidos;