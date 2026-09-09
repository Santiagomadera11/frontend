import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ordersService } from "./services/ordersService";
import { OrderDetailModal } from "./components/OrderDetailModal";
import { ToastNotification } from "../../../shared/ui/ToastNotification";
import { turnService } from "../sales/services/turnService";
import { authService } from "../../auth/authService";

export const OrdersPage = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const isEmployee = currentUser?.rol === "Empleado";

  const [orders, setOrders] = useState(ordersService.getAll());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [notification, setNotification] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [hasActiveTurn, setHasActiveTurn] = useState(
    turnService.hasActiveTurn(),
  );
  const [showTurnTooltip, setShowTurnTooltip] = useState(false);

  const itemsPerPage = 10;

  // Escuchar cambios en el turno activo
  React.useEffect(() => {
    const handleTurnChange = () => {
      setHasActiveTurn(turnService.hasActiveTurn());
    };

    window.addEventListener("turn:changed", handleTurnChange);
    return () => window.removeEventListener("turn:changed", handleTurnChange);
  }, []);

  const handleDeleteOrder = (id) => {
    if (window.confirm("¿Eliminar pedido?")) {
      const newList = ordersService.delete(id);
      setOrders(newList);
      setNotification({
        message: "Pedido eliminado",
        type: "success",
        zIndex: 50,
      });
      if (newList.length <= currentPage * itemsPerPage && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  // Filtrado
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filtro de búsqueda
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        order.id.toLowerCase().includes(searchLower) ||
        order.cliente.toLowerCase().includes(searchLower) ||
        order.documento.includes(searchLower);

      if (!matchesSearch) return false;

      // Filtro de estado
      if (statusFilter !== "Todos" && order.estado !== statusFilter) {
        return false;
      }

      // Filtro de fecha
      if (startDate || endDate) {
        const orderDate = new Date(order.fecha);
        if (startDate && orderDate < new Date(startDate)) return false;
        if (endDate && orderDate > new Date(endDate)) return false;
      }

      return true;
    });
  }, [orders, searchTerm, statusFilter, startDate, endDate]);

  // Paginación
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const displayedOrders = filteredOrders.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage,
  );

  // Helper para formato moneda
  const formatCurrency = (val) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);

  // Helper para color de estado
  const getStatusColor = (estado) => {
    switch (estado) {
      case "Pendiente":
        return "bg-yellow-100 text-yellow-700";
      case "En proceso":
        return "bg-blue-100 text-blue-700";
      case "Entregado":
        return "bg-green-100 text-green-700";
      case "Cancelado":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Gestión de pedidos
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Administra y realiza seguimiento de todos los pedidos
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => navigate("/admin/pedidos/crear")}
            disabled={isEmployee && !hasActiveTurn}
            onMouseEnter={() =>
              isEmployee && !hasActiveTurn && setShowTurnTooltip(true)
            }
            onMouseLeave={() => setShowTurnTooltip(false)}
            className={`px-4 py-2 rounded-lg font-bold shadow-sm text-xs flex items-center gap-2 transition-all ${
              isEmployee && !hasActiveTurn
                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            }`}
          >
            <Plus size={16} />
            Crear pedido
          </button>
          {showTurnTooltip && isEmployee && !hasActiveTurn && (
            <div className="absolute top-full mt-2 left-0 bg-gray-800 text-white text-xs rounded-md px-3 py-2 whitespace-nowrap shadow-lg z-50 flex items-center gap-1.5">
              <AlertCircle size={14} />
              REGLA DE ORO: Los empleados deben abrir caja primero
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-shrink-0 flex-wrap">
        {/* Búsqueda */}
        <div className="flex-1 min-w-[250px] relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Buscar por código, nombre del cliente, documento, etc"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-300 text-xs bg-white"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(0);
            }}
          />
        </div>

        {/* Filtro Estado */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(0);
          }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary-300"
        >
          <option value="Todos">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En proceso">En proceso</option>
          <option value="Entregado">Entregado</option>
          <option value="Cancelado">Cancelado</option>
        </select>

        {/* Filtro Fecha - Rango */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Calendar size={16} className="text-gray-400" />
          <input
            type="date"
            placeholder="Desde"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(0);
            }}
            className="text-xs focus:outline-none w-32 bg-transparent"
          />
          <span className="text-gray-300">-</span>
          <input
            type="date"
            placeholder="Hasta"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(0);
            }}
            className="text-xs focus:outline-none w-32 bg-transparent"
          />
        </div>

        {/* Botón limpiar filtros */}
        {(searchTerm || statusFilter !== "Todos" || startDate || endDate) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("Todos");
              setStartDate("");
              setEndDate("");
              setCurrentPage(0);
            }}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla de pedidos */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
        <div className="overflow-auto custom-scrollbar no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-emerald-600 text-white text-xs uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 font-semibold">Código</th>
                <th className="px-3 py-3 font-semibold">Cliente</th>
                <th className="px-3 py-3 font-semibold">Documento</th>
                <th className="px-3 py-3 font-semibold">Fecha</th>
                <th className="px-3 py-3 font-semibold text-center">
                  Productos
                </th>
                <th className="px-3 py-3 font-semibold text-right">Total</th>
                <th className="px-3 py-3 font-semibold text-center">Estado</th>
                <th className="px-3 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {displayedOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-3 py-8 text-center text-gray-400"
                  >
                    No hay pedidos registrados
                  </td>
                </tr>
              ) : (
                displayedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-xs font-mono font-semibold text-gray-700">
                      {order.id}
                    </td>
                    <td className="px-3 py-2.5 font-medium">{order.cliente}</td>
                    <td className="px-3 py-2.5 text-gray-600">
                      {order.documento}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">
                      {new Date(order.fecha).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold">
                      {order.cantidadProductos}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-emerald-600 text-right">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusColor(
                          order.estado,
                        )}`}
                      >
                        {order.estado}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(order)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-1.5 rounded-md border border-blue-200"
                          title="Ver detalle"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-md border border-red-200"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {filteredOrders.length > 0 && (
          <div className="border-t border-gray-100 p-3 bg-gray-50 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] text-gray-500 font-medium">
              Mostrando página {currentPage + 1} de {totalPages} (
              {filteredOrders.length} pedidos)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => currentPage > 0 && setCurrentPage((p) => p - 1)}
                disabled={currentPage === 0}
                className="p-1 rounded bg-white border border-gray-200 disabled:opacity-50"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() =>
                  currentPage < totalPages - 1 && setCurrentPage((p) => p + 1)
                }
                disabled={currentPage === totalPages - 1}
                className="p-1 rounded bg-white border border-gray-200 disabled:opacity-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {notification && (
        <ToastNotification
          message={notification.message}
          type={notification.type}
          zIndex={notification.zIndex}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Modal de Detalle */}
      <OrderDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
};

export default OrdersPage;
