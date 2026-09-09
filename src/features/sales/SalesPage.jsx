import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search, Plus, DollarSign, Eye, ChevronLeft, ChevronRight,
  ShoppingCart, TrendingUp, Receipt, Package, Globe, User, TrendingDown, RotateCcw, X
} from "lucide-react";
import { salesService } from "./services/salesService";
import { expensesService } from "./services/expensesService";
import { SaleDetailModal } from "./components/SaleDetailModal";
import ExpenseFormModal from "../services/appointments/components/ExpenseFormModal";
import { ToastNotification } from "/src/shared/ui/ToastNotification";

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

const KPICard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color} bg-opacity-20`}>
      <Icon size={16} className={color.replace("bg-", "text-")} />
    </div>
    <div>
      <div className="text-lg font-black text-gray-900 leading-none">{value}</div>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">{label}</div>
    </div>
  </div>
);

export const SalesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [currentPage, setCurrentPage] = useState(0);
  const [isSaleDetailOpen, setIsSaleDetailOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [toast, setToast] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [todayExpenses, setTodayExpenses] = useState([]);  
  const [confirmAnular, setConfirmAnular] = useState(null); 
  const isMountedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const itemsPerPage = 8; 

  const { currentUser } = useCurrentUser();
  const user = currentUser || {};
  const userRole = (user.rol || "").toLowerCase().trim();
  const userPerms = (user.permisos || []).map((perm) => String(perm || "").toLowerCase().trim());
  const canCreateSale = userRole === "administrador" || userPerms.includes("sales.create");
  const canAccessReturns = userRole === "administrador" || userPerms.includes("sales.view") || userPerms.includes("sales.return");
  const canExportSales = userRole === "administrador" || userPerms.includes("sales.export");

  const fmt = (v) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

  const getOriginBadge = (origen) => {
    const orig = (origen || "").toUpperCase();
    if (orig === "WEB") {
      return (
        <span className="bg-purple-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 w-fit">
          <Globe size={10} /> WEB
        </span>
      );
    }
    return (
      <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 w-fit">
        <User size={10} /> CAJA
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
    finally { if (isMountedRef.current) setLoading(false); isLoadingRef.current = false; }
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
        const term = searchTerm.toLowerCase();
        return (
          (s?.clienteNombre || "").toLowerCase().includes(term) ||
          String(s?.numeroVenta || "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.fechaVenta || 0) - new Date(a.fechaVenta || 0));
  }, [sales, searchTerm, filterEstado]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const displayedSales = filteredSales.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const totalGastosHoy = todayExpenses.reduce((sum, g) => sum + (g.monto || g.Monto || 0), 0);

  return (
    <div className="h-full flex flex-col gap-3 font-sans p-2 bg-[#f8fafc] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Ventas</h1>
        </div>
        <div className="flex gap-2">
          {canCreateSale && (
            <button onClick={() => navigate("/admin/ventas/nueva")}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[11px] shadow-md transition-all active:scale-95 hover:bg-emerald-700">
              <Plus size={14} /> NUEVA VENTA
            </button>
          )}
          {canAccessReturns ? (
            <button onClick={() => navigate(`/${userRole === "administrador" ? "admin" : "employee"}/ventas/devoluciones`)}
              className={`flex items-center gap-2 px-3 py-1.5 text-white rounded-lg font-bold text-[11px] shadow-md transition-all active:scale-95 ${
                userRole === "administrador" 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-blue-600 hover:bg-blue-700"
              }`}>
              <RotateCcw size={14} /> DEVOLUCIONES
            </button>
          ) : (
            <button disabled
              title="No tienes permisos para ver devoluciones"
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-300 text-gray-500 rounded-lg font-bold text-[11px] shadow-md cursor-not-allowed opacity-60">
              <RotateCcw size={14} /> DEVOLUCIONES
            </button>
          )}
          {canExportSales ? (
            <button onClick={() => navigate(`/${userRole === "administrador" ? "admin" : "employee"}/ventas/reporte`)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-[11px] shadow-md transition-all active:scale-95 hover:bg-blue-700">
              <TrendingUp size={14} /> REPORTE
            </button>
          ) : (
            <button disabled
              title="No tienes permisos para exportar"
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-300 text-gray-500 rounded-lg font-bold text-[11px] shadow-md cursor-not-allowed opacity-60">
              <TrendingUp size={14} /> REPORTE
            </button>
          )}
          <button onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold text-[11px] shadow-md transition-all active:scale-95 hover:bg-red-700">
            <TrendingDown size={14} /> REGISTRAR GASTO
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <KPICard icon={DollarSign} label="Ingresos" value={fmt(sales.filter(v => !["devolucion", "anulada"].includes(normalizeText(v.estadoNombre))).reduce((s, v) => s + (v.total || 0), 0) - totalGastosHoy)} color="bg-blue-500" />
        <KPICard icon={Receipt} label="Ventas Hoy" value={sales.filter(s => new Date(s.fechaVenta).toDateString() === new Date().toDateString() && !["devolucion", "anulada"].includes(normalizeText(s.estadoNombre))).length} color="bg-emerald-500" />
        <KPICard icon={TrendingDown} label="Gastos Hoy" value={fmt(totalGastosHoy)} color="bg-red-500" />
      </div>

      {/* Buscador y Filtro */}
      <div className="flex gap-2 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input type="text" placeholder="Buscar venta..."
            className="w-full pl-9 pr-3 py-1.5 border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 text-[11px] bg-white font-medium outline-none"
            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }} />
        </div>
        <select value={filterEstado} onChange={(e) => { setFilterEstado(e.target.value); setCurrentPage(0); }}
          className="px-2 py-1.5 border border-gray-100 rounded-xl shadow-sm text-[11px] bg-white font-bold text-gray-600 outline-none">
          <option value="todos">Todos</option>
          <option value="completada">Completadas</option>
          <option value="devolucion">Devoluciones</option>
          <option value="anulada">Anuladas</option>
          <option value="pendiente">Pendientes</option>
        </select>
      </div>

      {/* Tabla Adaptativa */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
        {/* Contenedor del scroll de la tabla */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                {["#", "Fecha", "Origen", "Cliente", "Items", "Pago", "Total", "Estado", ""].map(h => (
                  <th key={h} className={`px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest ${h === "" ? "text-right" : ""}`}>
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
                return (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 text-[10px] font-bold text-gray-400">{sale.numeroVenta?.split('-')[1] || sale.numeroVenta || sale.id}</td>
                    <td className="px-3 py-2 text-[10px] text-gray-500">{new Date(sale.fechaVenta).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{getOriginBadge(sale.origen)}</td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] font-bold text-gray-700 truncate block max-w-[100px]">{sale.clienteNombre || "C. Final"}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="bg-blue-50 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-blue-100">
                        {totalItems} ITEMS
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[10px] text-gray-400 font-bold uppercase">{sale.metodoPagoNombre?.substring(0, 8)}</td>
                    <td className="px-3 py-2 text-right text-[11px] font-black text-gray-900">{fmt(sale.total)}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${config.bg} ${config.text}`}>
                        {config.label}
                      </span>
                    </td>
                    {/* Acciones */}
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
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

        {/* Paginación fijada en la parte inferior */}
        <div className="bg-gray-50/50 px-3 py-2 flex items-center justify-between border-t border-gray-100 flex-shrink-0">
          <span className="text-[9px] font-bold text-gray-400 uppercase">Pág {currentPage + 1} de {totalPages || 1}</span>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
              className="p-1 bg-white border rounded shadow-sm disabled:opacity-30"><ChevronLeft size={14} /></button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}
              className="p-1 bg-white border rounded shadow-sm disabled:opacity-30"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* Modales */}
      <SaleDetailModal isOpen={isSaleDetailOpen} onClose={() => { setIsSaleDetailOpen(false); setSelectedSale(null); }} sale={selectedSale} />
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
      />
      
      {/* Modal de confirmación de anulación */}
      {confirmAnular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Anular venta {confirmAnular.numeroVenta}</h2>
              <button onClick={() => setConfirmAnular(null)} className="text-white hover:bg-red-700 p-1 rounded">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                ¿Estás seguro? Se devolverá el stock y se descontará <span className="font-bold">{fmt(confirmAnular.total)}</span> del turno activo.
              </p>
            </div>

            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button onClick={() => setConfirmAnular(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-[11px] font-bold text-gray-500 hover:bg-gray-50">
                CANCELAR
              </button>
              <button onClick={handleAnular}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-[11px] font-bold hover:bg-red-700">
                ANULAR
              </button>
            </div>
          </div>
        </div>
      )}
      
      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default SalesPage;