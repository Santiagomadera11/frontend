import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Clock, ShoppingCart, Plus,
  AlertCircle, CheckCircle, Package, ArrowRight,
} from "lucide-react";
import { apiClient } from "../../shared/utils/apiClient";
import { turnService } from "../sales/services/turnService";
import { OpenShiftModal } from "../sales/components/OpenShiftModal";

const API = "/api";
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${sessionStorage.getItem("syspharma_token")}` },
});

const LOW_STOCK_THRESHOLD = 15;

const parseToMinutes = (hhmm) => {
  if (!hhmm) return Infinity;
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const DashboardEmpleado = () => {
  const navigate = useNavigate();
  const currentUser = useMemo(
    () => JSON.parse(sessionStorage.getItem("syspharma_user") || '{"nombre":"Empleado"}'), []);

  const [citas, setCitas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [citasRes, productosRes, ventasRes] = await Promise.allSettled([
        apiClient.get(`${API}/Cita`, getAuthHeaders()),
        apiClient.get(`${API}/Producto`, getAuthHeaders()),
        apiClient.get(`${API}/Venta`, getAuthHeaders()),
      ]);
      if (citasRes.status === "fulfilled") setCitas(citasRes.value.data || []);
      if (productosRes.status === "fulfilled") setProductos(productosRes.value.data || []);
      if (ventasRes.status === "fulfilled") setVentas(ventasRes.value.data || []);
    } catch {
      console.warn('Error loading dashboard data');
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    turnService.getActiveTurn(currentUser?.id).then(turno => {
      if (!turno) setShowOpenShiftModal(true);
    });
  }, [currentUser?.id]);

  // Citas de hoy
  const todayStr = new Date().toISOString().split("T")[0];
  const citasHoy = useMemo(() =>
    citas.filter(c => c.fecha === todayStr && (c.estadoNombre || "").toLowerCase() !== "cancelada")
      .sort((a, b) => a.hora.localeCompare(b.hora)),
    [citas, todayStr]);

  const pendingConfirmations = citasHoy.filter(c =>
    (c.estadoNombre || "").toLowerCase().includes("confirmar")).length;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nextAppointment = citasHoy.find(c =>
    parseToMinutes(c.hora) >= nowMinutes && (c.estadoNombre || "").toLowerCase() !== "completada");

  // Stock bajo
  const lowStockProducts = useMemo(() =>
    productos.filter(p => Number(p.stock) < LOW_STOCK_THRESHOLD).slice(0, 4), [productos]);

  // Ventas de hoy (excluye anuladas: si no, el monto y el conteo quedan inflados con
  // dinero que en realidad se revirtió)
  const ventasHoy = useMemo(() =>
    ventas.filter(v => v.estadoId !== 3 && v.fechaVenta && new Date(v.fechaVenta).toISOString().split("T")[0] === todayStr),
    [ventas, todayStr]);

  const getEstadoColor = (estado) => {
    const lower = (estado || "").toLowerCase();
    if (lower === "completada") return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (lower.includes("consulta")) return "bg-employee-50 text-employee-700 border-employee-100";
    return "bg-amber-50 text-amber-700 border-amber-100";
  };

  return (
    <>
      <div className="p-6 bg-[#f8fafc] min-h-screen font-sans space-y-5">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 border-l-4 border-l-employee-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Hola, {currentUser.nombre?.split(" ")[0]}
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">Resumen de tu jornada de hoy.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/employee/ventas")}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 hover:shadow-sm transition-all">
              <ShoppingCart size={16} /> Nueva Venta
            </button>
            <button onClick={() => navigate("/employee/citas")}
              className="flex items-center gap-2 bg-employee-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm hover:bg-employee-600 hover:shadow-md transition-all">
              <Plus size={16} /> Agendar Cita
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Citas Hoy", value: citasHoy.length, sub: `${citasHoy.filter(c => (c.estadoNombre||"").toLowerCase()==="completada").length} atendidas`, icon: Calendar, bg: "bg-employee-50", color: "text-employee-600", accent: "before:bg-employee-500" },
            { label: "Por Confirmar", value: pendingConfirmations, sub: "Requieren llamada", icon: AlertCircle, bg: "bg-amber-50", color: "text-amber-600", accent: "before:bg-amber-500" },
            { label: "Ventas Hoy", value: ventasHoy.length, sub: `$${ventasHoy.reduce((s,v)=>s+(v.total||0),0).toLocaleString("es-CO")}`, icon: ShoppingCart, bg: "bg-emerald-50", color: "text-emerald-600", accent: "before:bg-emerald-500" },
            { label: "Stock Bajo", value: lowStockProducts.length, sub: "Productos por agotarse", icon: Package, bg: "bg-red-50", color: "text-red-600", accent: "before:bg-red-500" },
          ].map(({ label, value, sub, icon: Icon, bg, color, accent }) => (
            <div key={label}
              className={`group relative overflow-hidden p-5 rounded-xl border border-gray-100 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 before:absolute before:inset-x-0 before:top-0 before:h-1 ${accent}`}>
              <div className={`inline-flex p-2.5 rounded-lg mb-3 ${bg} ${color} group-hover:scale-110 transition-transform duration-200`}><Icon size={18} /></div>
              <p className="text-xs text-gray-400">{label}</p>
              <h3 className="text-2xl font-semibold text-gray-900 mt-0.5">{value}</h3>
              <p className={`text-[11px] font-medium mt-1 ${color}`}>{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Próxima cita */}
            {nextAppointment ? (
              <div className="bg-gradient-to-r from-employee-600 to-employee-500 rounded-xl p-5 text-white shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 opacity-90">
                      <Clock size={14} />
                      <span className="text-xs font-medium">Siguiente turno · {nextAppointment.hora}</span>
                    </div>
                    <h2 className="text-lg font-semibold truncate">{nextAppointment.pacienteNombre}</h2>
                    <p className="opacity-90 text-xs mt-0.5">{nextAppointment.servicioNombre || "-"}</p>
                  </div>
                  <button onClick={() => navigate("/employee/citas")}
                    className="bg-white text-employee-600 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm hover:bg-gray-50 hover:shadow-md active:scale-95 transition-all flex-shrink-0">
                    Gestionar
                  </button>
                </div>
                <Calendar className="absolute -bottom-4 -right-4 text-white opacity-10" size={96} />
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-emerald-800">¡Todo al día!</h3>
                  <p className="text-xs text-emerald-600">No hay más citas pendientes por hoy.</p>
                </div>
              </div>
            )}

            {/* Agenda */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-medium text-gray-800 text-sm">Agenda de Hoy</h3>
                <button onClick={() => navigate("/employee/citas")}
                  className="text-employee-600 text-xs font-medium hover:underline">Ver todo</button>
              </div>
              <div className="divide-y divide-gray-50">
                {loading ? (
                  <div className="p-5 text-center text-sm text-gray-400">Cargando citas...</div>
                ) : citasHoy.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">No hay citas programadas para hoy.</div>
                ) : (
                  citasHoy.map(apt => {
                    const isPast = parseToMinutes(apt.hora) < nowMinutes &&
                      (apt.estadoNombre || "").toLowerCase() !== "en curso";
                    return (
                      <div key={apt.id} className="group px-5 py-3.5 flex items-center gap-3.5 hover:bg-gray-50 transition-colors">
                        <span className={`w-12 flex-shrink-0 text-xs font-semibold ${isPast ? "text-gray-300" : "text-employee-600"}`}>
                          {apt.hora}
                        </span>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors ${
                          isPast ? "bg-gray-100 text-gray-400" : "bg-employee-50 text-employee-600 group-hover:bg-employee-100"
                        }`}>
                          {apt.pacienteNombre?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-medium text-gray-800 truncate">{apt.pacienteNombre}</h4>
                          <p className="text-xs text-gray-400 truncate">{apt.servicioNombre || apt.medicoNombre || "-"}</p>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-1 rounded-full border flex-shrink-0 ${getEstadoColor(apt.estadoNombre)}`}>
                          {apt.estadoNombre}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-medium text-gray-800 mb-4 text-sm">Accesos Rápidos</h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickAction icon={ShoppingCart} label="Ventas" onClick={() => navigate("/employee/ventas")} color="employee" />
                <QuickAction icon={Calendar} label="Citas" onClick={() => navigate("/employee/citas")} color="employee" />
                <QuickAction icon={Package} label="Inventario" onClick={() => navigate("/employee/productos")} color="orange" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={16} className="text-red-500" />
                <h3 className="font-medium text-gray-800 text-sm">Bajo Stock</h3>
              </div>
              <div className="space-y-1">
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map(p => (
                    <div key={p.id} className="flex justify-between items-center text-sm px-2 -mx-2 py-2 rounded-lg border-b border-gray-50 last:border-0 hover:bg-red-50/50 transition-colors">
                      <span className="text-gray-600 truncate max-w-[120px]">{p.nombre}</span>
                      <span className="font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-md text-xs">{p.stock} un.</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">Inventario saludable ✅</p>
                )}
              </div>
              {lowStockProducts.length > 0 && (
                <button onClick={() => navigate("/employee/productos")}
                  className="w-full mt-4 text-xs text-center text-employee-600 hover:text-employee-800 font-medium flex items-center justify-center gap-1 group">
                  Ver inventario <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <OpenShiftModal isOpen={showOpenShiftModal} onShiftOpened={() => setShowOpenShiftModal(false)}
        user={currentUser} canClose={(currentUser?.rol || "").toLowerCase().trim() === "administrador"}
        onCancel={() => setShowOpenShiftModal(false)} />
    </>
  );
};

const QuickAction = ({ icon: Icon, label, onClick, color }) => {
  const colors = {
    employee: "bg-employee-50 text-employee-600 hover:bg-employee-100",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
  };
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 ${colors[color]}`}>
      <Icon size={20} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

export default DashboardEmpleado;
