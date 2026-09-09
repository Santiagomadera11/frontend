import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Search, Eye, ChevronLeft, ChevronRight, Calendar,
  Plus, Edit, CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ordersService } from "../sales/orders/services/ordersService";
import { permissionService } from "../settings/permissionService";
import { turnService } from "../sales/services/turnService";
import { OrderDetailModal } from "../sales/orders/components/OrderDetailModal";
import { OpenShiftModal } from "../sales/components/OpenShiftModal";
import { ToastNotification } from "../../shared/ui/ToastNotification";

const fmt = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

export const EmployeePedidos = () => {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const user = currentUser || {};
  const canEditOrder = permissionService.hasPerm(user.rol, "billing.create");

  const [orders, setOrders] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [notification, setNotification] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [orderToChangeStatus, setOrderToChangeStatus] = useState(null);
  const [viewMode, setViewMode] = useState("activos");
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [tooltipOrderId, setTooltipOrderId] = useState(null);
  const itemsPerPage = 10;
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
    ordersService.getEstados().then((data) => { if (isMountedRef.current) setEstados(Array.isArray(data) ? data : []); }).catch(() => { if (isMountedRef.current) setEstados([]); });
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

  const handleCreatePedido = async () => {
    if (user.rol !== "Administrador") {
      const turno = await turnService.getActiveTurn(user?.id);
      if (!turno) { setShowOpenShiftModal(true); return; }
    }
    navigate("/employee/pedidos/crear");
  };

  const handleShiftOpened = () => {
    setShowOpenShiftModal(false);
    navigate("/employee/pedidos/crear");
  };

  const handleEditOrder = (order) => {
    sessionStorage.setItem("syspharma_edit_order", JSON.stringify(order));
    navigate("/employee/pedidos/crear");
  };

  const confirmStatusChange = async (estadoId) => {
    if (!orderToChangeStatus) return;
    try {
      await ordersService.updateStatus(orderToChangeStatus.id, estadoId);
      setNotification({ message: "Estado actualizado correctamente", type: "success", zIndex: 1000 });
      await loadOrders();
    } catch (err) {
      setNotification({ message: err?.response?.data?.message || "Error al cambiar estado", type: "error", zIndex: 1000 });
    }
    setIsStatusModalOpen(false);
    setOrderToChangeStatus(null);
  };

  const getStatusColor = (estado) => {
    const lower = (estado || "").toLowerCase();
    if (lower === "pendiente") return "bg-yellow-100 text-yellow-700";
    if (lower === "en proceso") return "bg-blue-100 text-blue-700";
    if (lower === "entregado") return "bg-green-100 text-green-700";
    if (lower === "cancelado") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const filteredOrders = useMemo(() => orders.filter(order => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (order.numeroPedido || "").toLowerCase().includes(term) ||
      (order.clienteNombre || "").toLowerCase().includes(term) ||
      (order.clienteDocumento || "").includes(term);
    const matchStatus = statusFilter === "Todos" || (order.estadoNombre || "").toLowerCase() === statusFilter.toLowerCase();

    const estadoLower = (order.estadoNombre || "").toLowerCase();
    const matchView = viewMode === "activos"
      ? ["pendiente", "en proceso"].includes(estadoLower)
      : ["entregado", "cancelado"].includes(estadoLower);

    if (!matchSearch || !matchStatus || !matchView) return false;
    if (startDate && order.fechaCreacion && new Date(order.fechaCreacion) < new Date(startDate)) return false;
    if (endDate && order.fechaCreacion && new Date(order.fechaCreacion) > new Date(endDate)) return false;
    return true;
  }), [orders, searchTerm, statusFilter, startDate, endDate, viewMode]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const displayedOrders = filteredOrders.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <div className="h-full flex flex-col gap-4 font-sans">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Seguimiento de Pedidos</h1>
          <p className="text-gray-500 text-xs mt-0.5">Visualiza y gestiona los pedidos</p>
        </div>
        <button onClick={handleCreatePedido}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm text-xs flex items-center gap-2">
          <Plus size={16} /> Crear pedido
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-shrink-0 border-b border-gray-200">
        {[{ id: "activos", label: "Pendientes y En Proceso" }, { id: "historial", label: "Historial" }].map(tab => (
          <button key={tab.id} onClick={() => { setViewMode(tab.id); setCurrentPage(0); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              viewMode === tab.id ? "text-blue-600 border-blue-600" : "text-gray-600 border-transparent hover:text-gray-800"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-shrink-0 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Buscar por código, cliente, documento..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none text-xs bg-white"
            value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0); }} />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(0); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none">
          <option value="Todos">Todos los estados</option>
          {estados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
        </select>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Calendar size={14} className="text-gray-400" />
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setCurrentPage(0); }}
            className="text-xs focus:outline-none w-32 bg-transparent" />
          <span className="text-gray-300">-</span>
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setCurrentPage(0); }}
            className="text-xs focus:outline-none w-32 bg-transparent" />
        </div>
        {(searchTerm || statusFilter !== "Todos" || startDate || endDate) && (
          <button onClick={() => { setSearchTerm(""); setStatusFilter("Todos"); setStartDate(""); setEndDate(""); setCurrentPage(0); }}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium">
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-blue-600 text-white text-xs uppercase tracking-wider sticky top-0 z-10">
              <tr>
                {["Código", "Cliente", "Documento", "Fecha", "Productos", "Total", "Estado", "Acciones"].map(h => (
                  <th key={h} className="px-3 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">Cargando pedidos...</td></tr>
              ) : displayedOrders.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No hay pedidos</td></tr>
              ) : (
                displayedOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 font-mono font-semibold text-gray-700">{order.numeroPedido}</td>
                    <td className="px-3 py-2.5 font-medium">{order.clienteNombre}</td>
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
                    <td className="px-3 py-2.5 font-bold text-blue-600 text-right">{fmt(order.total)}</td>
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
                        {(order.estadoNombre || "").toLowerCase() === "pendiente" && canEditOrder && (
                          <button onClick={() => handleEditOrder(order)}
                            className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors" title="Editar">
                            <Edit size={16} />
                          </button>
                        )}
                        <button onClick={() => { setOrderToChangeStatus(order); setIsStatusModalOpen(true); }}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors" title="Cambiar estado">
                          <CheckCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredOrders.length > 0 && (
          <div className="border-t border-gray-100 p-3 bg-gray-50 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] text-gray-500">Página {currentPage + 1} de {totalPages} ({filteredOrders.length} pedidos)</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
                className="p-1 rounded bg-white border border-gray-200 disabled:opacity-50"><ChevronLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}
                className="p-1 rounded bg-white border border-gray-200 disabled:opacity-50"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {notification && <ToastNotification message={notification.message} type={notification.type} zIndex={notification.zIndex} onClose={() => setNotification(null)} />}

      <OrderDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} order={selectedOrder} />

      {isStatusModalOpen && orderToChangeStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Cambiar Estado</h3>
            <p className="text-sm text-gray-600 mb-4">Pedido: <span className="font-semibold">{orderToChangeStatus.numeroPedido}</span></p>
            <div className="space-y-2 mb-6">
              {estados.map(e => (
                <button key={e.id} onClick={() => confirmStatusChange(e.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    orderToChangeStatus.estadoId === e.id
                      ? "bg-blue-100 border-blue-300 text-blue-700"
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

      <OpenShiftModal isOpen={showOpenShiftModal} onShiftOpened={handleShiftOpened}
        user={user} canClose={false} onCancel={() => setShowOpenShiftModal(false)} />
    </div>
  );
};

export default EmployeePedidos;