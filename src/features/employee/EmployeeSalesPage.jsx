import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, Eye, ChevronLeft, ChevronRight,
  ShoppingCart, DollarSign, Clock, TrendingDown, Receipt,
  RotateCcw, FileDown, FileText
} from "lucide-react";
import { turnService } from "../sales/services/turnService";
import { salesService } from "../sales/services/salesService";
import { expensesService } from "../sales/services/expensesService";
import { SaleDetailModal } from "../sales/components/SaleDetailModal";
import { OpenShiftModal } from "../sales/components/OpenShiftModal";
import { CloseShiftModal } from "../sales/components/CloseShiftModal";
import ExpenseFormModal from "../services/appointments/components/ExpenseFormModal";
import { ToastNotification } from "../../shared/ui/ToastNotification";

const fmt = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

export const EmployeeSalesPage = () => {
  const navigate = useNavigate();

  const { currentUser } = useCurrentUser();
  const user = currentUser || {};

  // ── Helpers de permisos
  const isAdmin = (user.rol || "").toLowerCase().trim() === "administrador";
  const hasPerm = (perm) =>
    isAdmin || (user.permisos || []).map((p) => String(p || "").toLowerCase().trim()).includes(perm);

  // ── Permisos individuales
  const canViewSales    = hasPerm("sales.view");
  const canCreateSale   = hasPerm("sales.create");
  const canReturnSale   = hasPerm("sales.return");
  const canCancelSale   = hasPerm("sales.cancel");
  const canInvoiceSale  = hasPerm("sales.invoice");
  const canExportSales  = hasPerm("sales.export");

  // ── Estado
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [turnoLoading, setTurnoLoading] = useState(true);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [currentPage, setCurrentPage] = useState(0);
  const [isSaleDetailOpen, setIsSaleDetailOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [todayExpenses, setTodayExpenses] = useState([]);
  const itemsPerPage = 20;

  // ── Carga de datos
  const loadSales = useCallback(async () => {
    if (!canViewSales) { setSales([]); setLoading(false); return; }
    try {
      const data = await salesService.getAll();
      setSales(Array.isArray(data) ? data : []);
    } catch {
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [canViewSales]);

  const loadTurno = useCallback(async () => {
    if (!user?.id) return;
    try {
      const turno = await turnService.getActiveTurn(user?.id);
      setCurrentTurn(turno);
    } catch {
      setCurrentTurn(null);
    } finally {
      setTurnoLoading(false);
    }
  }, [user?.id]);

  const loadTodayExpenses = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await expensesService.getTodayExpenses(user.id);
      setTodayExpenses(Array.isArray(data) ? data : []);
    } catch {
      setTodayExpenses([]);
    }
  }, [user.id]);

  useEffect(() => {
    loadSales();
    loadTurno();
    loadTodayExpenses();
    const handleSync = () => loadSales();
    window.addEventListener("sales:changed", handleSync);
    window.addEventListener("focus", handleSync);
    return () => {
      window.removeEventListener("sales:changed", handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, [loadSales, loadTurno, loadTodayExpenses]);

  // ── Acciones
  const handleNewSale = () => {
    if (!canCreateSale) return;
    if (!currentTurn) { setShowOpenShiftModal(true); return; }
    navigate("/employee/ventas/nueva");
  };

  const handleReturn = () => {
    if (!canReturnSale) return;
    navigate("/employee/ventas/devoluciones");
  };

  const handleExport = async () => {
    if (!canExportSales) return;
    try {
      // Generar CSV desde los datos actuales
      const headers = ["N° Venta", "Fecha", "Cliente", "Productos", "Método Pago", "Total", "Estado"];
      const rows = sales.map(sale => [
        sale.numeroVenta,
        sale.fechaVenta ? new Date(sale.fechaVenta).toLocaleDateString("es-CO") : "-",
        sale.clienteNombre || "Consumidor Final",
        (sale.detalles || []).reduce((s, d) => s + d.cantidad, 0),
        sale.metodoPagoNombre || "-",
        sale.total || 0,
        sale.estadoNombre || "-"
      ]);

      // Crear CSV
      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(","))
        .join("\n");

      // Descargar archivo
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `reporte_ventas_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      setToast({ message: "Reporte exportado correctamente", type: "success" });
    } catch (err) {
      console.error("Error al exportar:", err);
      setToast({ message: "Error al exportar el reporte", type: "error" });
    }
  };

  const handleShiftOpened = (newTurn) => {
    setCurrentTurn(newTurn);
    setShowOpenShiftModal(false);
    setToast({ message: `Turno abierto con ${fmt(newTurn.montoBase)}`, type: "success" });
  };

  const handleShiftClosed = () => {
    setCurrentTurn(null);
    setShowCloseShiftModal(false);
    setToast({ message: "Turno cerrado correctamente", type: "success" });
    setTimeout(() => navigate("/login"), 2000);
  };

  const handleSaveExpense = () => {
    setToast({ message: "Gasto registrado exitosamente", type: "success" });
    loadTodayExpenses();
  };

  // ── Métricas
  const ventasHoy = useMemo(() => {
    const today = new Date().toLocaleDateString("es-CO");
    return sales.filter(s =>
      s.fechaVenta ? new Date(s.fechaVenta).toLocaleDateString("es-CO") === today : false
    );
  }, [sales]);

  const totalVentasHoy = useMemo(() =>
    ventasHoy.reduce((s, v) => s + (v.total || 0), 0), [ventasHoy]);

  const totalGastosHoy = todayExpenses.reduce((sum, g) => sum + (g.monto || g.Monto || 0), 0);

  const filteredSales = useMemo(() => sales.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (s.clienteNombre || "").toLowerCase().includes(term) ||
      (s.numeroVenta || "").toLowerCase().includes(term) ||
      (s.metodoPagoNombre || "").toLowerCase().includes(term);
    const matchEstado = filterEstado === "todos" || (s.estadoNombre || "").toLowerCase() === filterEstado;
    return matchSearch && matchEstado;
  }), [sales, searchTerm, filterEstado]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const displayedSales = filteredSales.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const getEstadoBadge = (estadoNombre) => {
    const lower = (estadoNombre || "").toLowerCase();
    if (lower === "completada") return "bg-green-100 text-green-700";
    if (lower === "devolucion") return "bg-orange-100 text-orange-700";
    if (lower === "anulada") return "bg-red-100 text-red-700";
    return "bg-blue-100 text-blue-700";
  };

  // ── Sin acceso a ventas
  if (!canViewSales && !isAdmin) {
    return (
      <div className="h-full flex items-center justify-center text-center text-gray-400">
        <div>
          <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold text-lg">Sin acceso a Ventas</p>
          <p className="text-sm mt-1">No tienes permiso para ver este módulo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 font-sans">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Ventas</h1>
          <p className="text-gray-500 text-xs mt-0.5">Panel de ventas — {user.nombre}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">

          {/* Registrar Gasto — siempre visible para empleados con turno */}
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-4 py-2 rounded-lg font-bold shadow-sm text-xs flex items-center gap-1.5 transition-all bg-red-600 hover:bg-red-700 text-white"
          >
            <TrendingDown size={16} /> Registrar Gasto
          </button>

          {/* Devoluciones — requiere sales.return */}
          {canReturnSale && (
            <button
              onClick={handleReturn}
              className="px-4 py-2 rounded-lg font-bold shadow-sm text-xs flex items-center gap-1.5 transition-all bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RotateCcw size={16} /> Devoluciones
            </button>
          )}

          {/* Exportar reporte — requiere sales.export */}
          {canExportSales && (
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-lg font-bold shadow-sm text-xs flex items-center gap-1.5 transition-all bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <FileDown size={16} /> Reporte
            </button>
          )}

          {/* Cerrar turno */}
          <button
            onClick={() => setShowCloseShiftModal(true)}
            disabled={!currentTurn}
            className={`px-4 py-2 rounded-lg font-bold shadow-sm text-xs flex items-center gap-1.5 transition-all ${
              currentTurn
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <DollarSign size={16} /> Cerrar Turno
          </button>

          {/* Estado turno */}
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <Clock size={16} className="text-blue-600" />
            <div>
              <p className="text-xs text-gray-600">Estado Turno</p>
              <p className="text-sm font-bold text-blue-600">
                {turnoLoading ? "..." : currentTurn ? `✓ Activo #${currentTurn.id}` : "✗ Cerrado"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-cyan-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="text-cyan-600" size={18} />
            <h3 className="text-sm font-bold text-gray-800">Ventas de hoy</h3>
          </div>
          <div className="text-2xl font-bold text-cyan-600">{fmt(totalVentasHoy)}</div>
          <div className="text-xs text-gray-500 mt-1">{ventasHoy.length} ventas</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="text-blue-600" size={18} />
            <h3 className="text-sm font-bold text-gray-800">Total registros</h3>
          </div>
          <div className="text-2xl font-bold text-blue-600">{sales.length}</div>
          <div className="text-xs text-gray-500 mt-1">{ventasHoy.length} hoy</div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="text-red-600" size={18} />
            <h3 className="text-sm font-bold text-gray-800">Gastos hoy</h3>
          </div>
          <div className="text-2xl font-bold text-red-600">{fmt(totalGastosHoy)}</div>
          <div className="text-xs text-gray-500 mt-1">{todayExpenses.length} gastos</div>
        </div>
      </div>

      {/* ── Filtros y botón nueva venta ── */}
      <div className="flex gap-2 flex-shrink-0 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar cliente, número de venta o método de pago..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 text-xs bg-white"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0); }}
          />
        </div>
        <select
          value={filterEstado}
          onChange={e => { setFilterEstado(e.target.value); setCurrentPage(0); }}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none text-xs bg-white"
        >
          <option value="todos">Todos los estados</option>
          <option value="completada">Completadas</option>
          <option value="devolucion">Devoluciones</option>
          <option value="anulada">Anuladas</option>
        </select>

        {/* Nueva Venta — requiere sales.create */}
        {canCreateSale && (
          <button
            onClick={handleNewSale}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm text-xs flex items-center gap-1.5 transition-all"
          >
            <Plus size={16} /> Nueva venta
          </button>
        )}
      </div>

      {/* ── Tabla ── */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-blue-600 text-white uppercase sticky top-0 z-10">
              <tr>
                {["#", "Fecha", "Cliente", "Productos", "Método", "Total", "Estado", "Ver"].map(h => (
                  <th key={h} className="px-3 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">Cargando ventas...</td></tr>
              ) : displayedSales.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No hay ventas registradas</td></tr>
              ) : (
                displayedSales.map((sale, idx) => {
                  const totalProductos = (sale.detalles || []).reduce((s, d) => s + d.cantidad, 0);
                  return (
                    <tr key={sale?.id ?? idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-gray-700">{sale.numeroVenta}</td>
                      <td className="px-3 py-2.5 text-gray-500">
                        {sale.fechaVenta ? new Date(sale.fechaVenta).toLocaleDateString("es-CO") : "-"}
                      </td>
                      <td className="px-3 py-2.5 font-medium">{sale.clienteNombre || "Consumidor Final"}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold">{totalProductos}</span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{sale.metodoPagoNombre || "-"}</td>
                      <td className="px-3 py-2.5 font-bold text-blue-600 text-right">{fmt(sale.total)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getEstadoBadge(sale.estadoNombre)}`}>
                          {sale.estadoNombre}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => { setSelectedSale(sale); setIsSaleDetailOpen(true); }}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-1.5 rounded-md border border-blue-200"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredSales.length > 0 && (
          <div className="border-t border-gray-100 p-3 bg-gray-50 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] text-gray-500">Página {currentPage + 1} de {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
                className="p-1 rounded bg-white border border-gray-200 disabled:opacity-50"><ChevronLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}
                className="p-1 rounded bg-white border border-gray-200 disabled:opacity-50"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modales ── */}
      <OpenShiftModal isOpen={showOpenShiftModal} onShiftOpened={handleShiftOpened} user={user}
        canClose={isAdmin} onCancel={() => setShowOpenShiftModal(false)} />
      <CloseShiftModal isOpen={showCloseShiftModal} onShiftClosed={handleShiftClosed}
        onCancel={() => setShowCloseShiftModal(false)} user={user} />
      <SaleDetailModal isOpen={isSaleDetailOpen}
        onClose={() => { setIsSaleDetailOpen(false); setSelectedSale(null); }} sale={selectedSale} />
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
      />
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default EmployeeSalesPage;