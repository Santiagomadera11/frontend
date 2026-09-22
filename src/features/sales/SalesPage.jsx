import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search, Plus, DollarSign, Eye, ChevronLeft, ChevronRight,
  ShoppingCart, TrendingUp, Receipt, Package, Globe, User, TrendingDown, RotateCcw, X,
  Calendar as CalendarIcon
} from "lucide-react";
import { salesService } from "./services/salesService";
import { expensesService } from "./services/expensesService";
import { SaleDetailModal } from "./components/SaleDetailModal";
import ExpenseFormModal from "../services/appointments/components/ExpenseFormModal";
import { ToastNotification } from "/src/shared/ui/ToastNotification";
import { ConfirmDialog } from "/src/shared/ui/ConfirmDialog";
import { serviciosMontoDe, productosMontoDe } from "/src/shared/utils/ventaCalculations";

const ESTADO_CONFIG = {
  completada: { label: "Completada", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  devolucion: { label: "Devolución", bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"  },
  anulada:    { label: "Anulada",    bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500"    },
  pendiente:  { label: "Pendiente",  bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"   },
};

const normalizeText = (str) => {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

const toLocalDateStr = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const todayStr = () => toLocalDateStr(new Date());

const KPICard = ({ icon: Icon, label, value, bg, text, accent }) => (
  <div className={`group relative overflow-hidden p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 before:absolute before:inset-x-0 before:top-0 before:h-1 ${accent}`}>
    <div className={`inline-flex p-2 rounded-lg mb-2 ${bg} ${text} group-hover:scale-110 transition-transform duration-200`}>
      <Icon size={16} />
    </div>
    <p className="text-xs text-gray-400">{label}</p>
    <h3 className="text-xl font-semibold text-gray-900 mt-0.5">{value}</h3>
  </div>
);

export const SalesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterFecha, setFilterFecha] = useState(todayStr());
  const [currentPage, setCurrentPage] = useState(0);
  const [isSaleDetailOpen, setIsSaleDetailOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [toast, setToast] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [todayExpenses, setTodayExpenses] = useState([]);  
  const [confirmAnular, setConfirmAnular] = useState(null); 
  const isMountedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const itemsPerPage = 10;

  const { currentUser } = useCurrentUser();
  const user = currentUser || {};
  const userRole = (user.rol || "").toLowerCase().trim();
  const userPerms = (user.permisos || []).map((perm) => String(perm || "").toLowerCase().trim());
  const canCreateSale = userRole === "administrador" || userPerms.includes("sales.create");
  const canAccessReturns = userRole === "administrador" || userPerms.includes("sales.view") || userPerms.includes("sales.return");
  const canExportSales = userRole === "administrador" || userPerms.includes("sales.export");

  const fmt = (v) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

  const getOriginBadge = (sale) => {
    const orig = (sale.origen || "").toUpperCase();
    if (orig === "WEB") {
      return (
        <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-fit">
          <Globe size={10} /> Web
        </span>
      );
    }
    const hasProductos = (sale.detalles?.length || 0) > 0;
    const hasServicios = (sale.servicios?.length || 0) > 0;
    if (!hasProductos && hasServicios) {
      return (
        <span className="bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-fit">
          <CalendarIcon size={10} /> Cita
        </span>
      );
    }
    return (
      <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-fit">
        <User size={10} /> Venta
      </span>
    );
  };

  const loadSales = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const data = await salesService.getAll();
      if (!isMountedRef.current) return;
      setSales(Array.isArray(data) ? data : []);
    } catch { if (isMountedRef.current) setSales([]); }
    finally { isLoadingRef.current = false; }
  }, []);

  const loadTodayExpenses = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await expensesService.getTodayExpenses(user.id);
      if (!isMountedRef.current) return;
      setTodayExpenses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error gastos:", e);
      if (isMountedRef.current) setTodayExpenses([]);
    }
  }, [user.id]);

  useEffect(() => {
    if (location.state?.notification) {
      setToast(location.state.notification);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadSales();
    loadTodayExpenses();
    return () => {
      isMountedRef.current = false;
      isLoadingRef.current = false;
    };
  }, [loadSales, loadTodayExpenses, location]);

  const handleSaveExpense = async () => {
    setToast({ message: "Gasto registrado exitosamente", type: "success" });
    loadTodayExpenses();
  };

  const handleAnular = async () => {
    try {
      await salesService.anular(confirmAnular.id);
      setToast({ message: "Venta anulada correctamente", type: "success" });
      setConfirmAnular(null);
      loadSales();
    } catch (ex) {
      setToast({ message: ex.response?.data?.message || "Error al anular", type: "error" });
      setConfirmAnular(null);
    }
  };

  const filteredSales = useMemo(() => {
    return sales
      .filter((s) => {
        const estadoSeleccionado = normalizeText(filterEstado);
        if (estadoSeleccionado === "todos") return true;
        return normalizeText(s?.estadoNombre) === estadoSeleccionado;
      })
      .filter((s) => {
        if (!filterFecha) return true;
        return toLocalDateStr(s?.fechaVenta) === filterFecha;
      })
      .filter((s) => {
        const term = searchTerm.toLowerCase();
        return (
          (s?.clienteNombre || "").toLowerCase().includes(term) ||
          String(s?.numeroVenta || "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.fechaVenta || 0) - new Date(a.fechaVenta || 0));
  }, [sales, searchTerm, filterEstado, filterFecha]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const displayedSales = filteredSales.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const totalGastosHoy = todayExpenses.reduce((sum, g) => sum + (g.monto || g.Monto || 0), 0);

  const ventasHoyValidas = useMemo(() => sales.filter(v =>
    new Date(v.fechaVenta).toDateString() === new Date().toDateString() &&
    !["devolucion", "anulada"].includes(normalizeText(v.estadoNombre))
  ), [sales]);

  const ingresosHoyProductos = useMemo(() =>
    ventasHoyValidas.reduce((s, v) => s + productosMontoDe(v), 0)
  , [ventasHoyValidas]);

  return (
    <div className="h-full flex flex-col gap-4 font-sans p-3 bg-[#f8fafc] overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Ventas</h1>
          <p className="text-xs text-gray-400 mt-0.5">Historial y gestión de ventas</p>
        </div>
        <div className="flex gap-2">
          {canCreateSale && (
            <button onClick={() => navigate("/admin/ventas/nueva")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white rounded-lg font-medium text-xs shadow-sm transition-colors hover:bg-primary-600">
              <Plus size={14} /> Nueva Venta
            </button>
          )}
          {canAccessReturns ? (
            <button onClick={() => navigate(`/${userRole === "administrador" ? "admin" : "employee"}/ventas/devoluciones`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-xs hover:bg-gray-50 transition-colors">
              <RotateCcw size={14} className="text-amber-500" /> Devoluciones
            </button>
          ) : (
            <button disabled
              title="No tienes permisos para ver devoluciones"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 text-gray-300 rounded-lg font-medium text-xs cursor-not-allowed">
              <RotateCcw size={14} /> Devoluciones
            </button>
          )}
          {canExportSales ? (
            <button onClick={() => navigate(`/${userRole === "administrador" ? "admin" : "employee"}/ventas/reporte`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-xs hover:bg-gray-50 transition-colors">
              <TrendingUp size={14} className="text-blue-500" /> Reporte
            </button>
          ) : (
            <button disabled
              title="No tienes permisos para exportar"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 text-gray-300 rounded-lg font-medium text-xs cursor-not-allowed">
              <TrendingUp size={14} /> Reporte
            </button>
          )}
          <button onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-xs hover:bg-gray-50 transition-colors">
            <TrendingDown size={14} className="text-red-500" /> Registrar Gasto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <KPICard icon={DollarSign} label="Ingresos" value={fmt(ingresosHoyProductos - totalGastosHoy)} bg="bg-primary-50" text="text-primary-600" accent="before:bg-primary-500" />
        <KPICard icon={Receipt} label="Ventas Hoy" value={ventasHoyValidas.length} bg="bg-blue-50" text="text-blue-600" accent="before:bg-blue-500" />
        <KPICard icon={TrendingDown} label="Gastos Hoy" value={fmt(totalGastosHoy)} bg="bg-red-50" text="text-red-600" accent="before:bg-red-500" />
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input type="text" placeholder="Buscar venta..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-xs bg-white"
            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }} />
        </div>
        <select value={filterEstado} onChange={(e) => { setFilterEstado(e.target.value); setCurrentPage(0); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white outline-none focus:ring-1 focus:ring-primary-500">
          <option value="todos">Todos</option>
          <option value="completada">Completadas</option>
          <option value="devolucion">Devoluciones</option>
          <option value="anulada">Anuladas</option>
          <option value="pendiente">Pendientes</option>
        </select>
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1">
          <CalendarIcon size={13} className="text-gray-400 flex-shrink-0" />
          <input type="date" value={filterFecha}
            onChange={(e) => { setFilterFecha(e.target.value); setCurrentPage(0); }}
            className="text-xs font-medium text-gray-700 outline-none bg-transparent" />
          {filterFecha && (
            <button onClick={() => { setFilterFecha(""); setCurrentPage(0); }}
              title="Ver todas las fechas"
              className="text-[10px] font-semibold text-primary-600 hover:text-primary-700 px-1.5 border-l border-gray-200">
              Ver todas
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-primary-600 text-white sticky top-0 z-10">
              <tr>
                {["#", "Fecha", "Origen", "Cliente", "Items", "Pago", "Total", "Estado", ""].map(h => (
                  <th key={h} className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider ${h === "" ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayedSales.map((sale) => {
                const estadoNormalizado = normalizeText(sale.estadoNombre);
                const config = ESTADO_CONFIG[estadoNormalizado] || ESTADO_CONFIG.completada;
                const totalItems =
                  (sale.detalles?.length || sale.Detalles?.length || 0) +
                  (sale.servicios?.length || sale.Servicios?.length || 0);
                const serviciosMonto = serviciosMontoDe(sale);
                const productosMonto = productosMontoDe(sale);
                return (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 text-xs font-medium text-gray-500 whitespace-nowrap">{sale.numeroVenta || sale.id}</td>
                    <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{new Date(sale.fechaVenta).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{getOriginBadge(sale)}</td>
                    <td className="px-3 py-2">
                      <span className="text-xs font-medium text-gray-700 truncate block max-w-[120px]">{sale.clienteNombre || "C. Final"}</span>
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span className="bg-primary-50 text-primary-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                        {totalItems} items
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{sale.metodoPagoNombre}</td>
                    <td className="px-3 py-2 text-right text-xs font-semibold text-gray-900 whitespace-nowrap">
                      {fmt(productosMonto)}
                      {serviciosMonto > 0 && (
                        <div className="text-[9px] font-normal text-gray-400">+ {fmt(serviciosMonto)} cita</div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.bg} ${config.text}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelectedSale(sale); setIsSaleDetailOpen(true); }}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Ver detalle">
                          <Eye size={16} />
                        </button>

                        {userRole === "administrador" &&
                         estadoNormalizado !== "anulada" &&
                         estadoNormalizado !== "devolucion" && (
                          <button onClick={() => setConfirmAnular(sale)}
                            className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                            title="Anular venta">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50/50 px-3 py-2 flex items-center justify-between border-t border-gray-100 flex-shrink-0">
          <span className="text-[11px] font-medium text-gray-400">Página {currentPage + 1} de {totalPages || 1}</span>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
              className="p-1 bg-white border border-gray-200 rounded-md shadow-sm disabled:opacity-30 hover:bg-gray-50 transition-colors"><ChevronLeft size={14} /></button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}
              className="p-1 bg-white border border-gray-200 rounded-md shadow-sm disabled:opacity-30 hover:bg-gray-50 transition-colors"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      <SaleDetailModal isOpen={isSaleDetailOpen} onClose={() => { setIsSaleDetailOpen(false); setSelectedSale(null); }} sale={selectedSale} />
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
      />
      
      {confirmAnular && (
        <ConfirmDialog
          open={!!confirmAnular}
          title={`Anular venta "${confirmAnular.numeroVenta}"`}
          message={<>¿Estás seguro? Se devolverá el stock y se descontará <strong>{fmt(confirmAnular.total)}</strong> del turno activo.</>}
          subMessage=""
          confirmText="Anular"
          danger
          onCancel={() => setConfirmAnular(null)}
          onConfirm={handleAnular}
        />
      )}
      
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default SalesPage;