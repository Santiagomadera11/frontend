import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Clock, ShoppingCart, Plus,
  AlertCircle, CheckCircle, Package, ArrowRight, X, TrendingUp,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { apiClient } from "../../shared/utils/apiClient";
import { turnService } from "../sales/services/turnService";
import { OpenShiftModal } from "../sales/components/OpenShiftModal";

const EMPLOYEE_ACCENT = "#3B7DDE";

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
  const [showStockModal, setShowStockModal] = useState(false);

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

  const lowStockAll = useMemo(() =>
    productos.filter(p => Number(p.stock) < LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock), [productos]);
  const lowStockProducts = useMemo(() => lowStockAll.slice(0, 4), [lowStockAll]);

  const ventasHoy = useMemo(() =>
    ventas.filter(v => v.estadoId !== 3 && v.fechaVenta && new Date(v.fechaVenta).toISOString().split("T")[0] === todayStr),
    [ventas, todayStr]);

  const ventasTrend = useMemo(() => {
    const dias = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const totalDia = ventas
        .filter(v => v.estadoId !== 3 && v.fechaVenta && new Date(v.fechaVenta).toISOString().split("T")[0] === dateStr)
        .reduce((s, v) => s + (v.total || 0), 0);
      dias.push({ name: d.toLocaleDateString("es-CO", { weekday: "short" }), total: totalDia });
    }
    return dias;
  }, [ventas]);

  const getEstadoColor = (estado) => {
    const lower = (estado || "").toLowerCase();
    if (lower === "completada") return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (lower.includes("consulta")) return "bg-employee-50 text-employee-700 border-employee-100";
    return "bg-amber-50 text-amber-700 border-amber-100";
  };

  return (
    <>
      <div className="p-6 bg-[#f8fafc] min-h-screen font-sans space-y-5">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Citas Hoy", value: citasHoy.length, sub: `${citasHoy.filter(c => (c.estadoNombre||"").toLowerCase()==="completada").length} atendidas`, icon: Calendar, bg: "bg-employee-50", color: "text-employee-600", accent: "before:bg-employee-500", onClick: () => navigate("/employee/citas") },
            { label: "Por Confirmar", value: pendingConfirmations, sub: "Requieren llamada — clic para gestionar", icon: AlertCircle, bg: "bg-amber-50", color: "text-amber-600", accent: "before:bg-amber-500", onClick: () => navigate("/employee/citas") },
            { label: "Ventas Hoy", value: ventasHoy.length, sub: `$${ventasHoy.reduce((s,v)=>s+(v.total||0),0).toLocaleString("es-CO")}`, icon: ShoppingCart, bg: "bg-emerald-50", color: "text-emerald-600", accent: "before:bg-emerald-500", onClick: () => navigate("/employee/ventas") },
            { label: "Stock Bajo", value: lowStockAll.length, sub: "Productos por agotarse — clic para ver cuáles", icon: Package, bg: "bg-red-50", color: "text-red-600", accent: "before:bg-red-500", onClick: () => setShowStockModal(true) },
          ].map(({ label, value, sub, icon: Icon, bg, color, accent, onClick }) => (
            <button key={label} type="button" onClick={onClick}
              className={`group relative overflow-hidden p-5 rounded-xl border border-gray-100 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 before:absolute before:inset-x-0 before:top-0 before:h-1 text-left w-full cursor-pointer ${accent}`}>
              <div className={`inline-flex p-2.5 rounded-lg mb-3 ${bg} ${color} group-hover:scale-110 transition-transform duration-200`}><Icon size={18} /></div>
              <p className="text-xs text-gray-400">{label}</p>
              <h3 className="text-2xl font-semibold text-gray-900 mt-0.5">{value}</h3>
              <p className={`text-[11px] font-medium mt-1 ${color}`}>{sub}</p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-1.5 rounded-md bg-employee-50 text-employee-600"><TrendingUp size={14} /></div>
            <div>
              <h3 className="font-medium text-gray-800 text-sm">Tendencia de ventas</h3>
              <p className="text-[11px] text-gray-400">Últimos 7 días</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ventasTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVentasEmpleado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EMPLOYEE_ACCENT} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={EMPLOYEE_ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={44} />
              <Tooltip
                cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                formatter={(v) => [`$${Number(v).toLocaleString("es-CO")}`, "Ventas"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                labelStyle={{ fontWeight: 600, color: "#1e293b", marginBottom: 2 }}
              />
              <Area type="monotone" dataKey="total" stroke={EMPLOYEE_ACCENT} strokeWidth={2} fillOpacity={1} fill="url(#colorVentasEmpleado)"
                dot={{ r: 3, fill: EMPLOYEE_ACCENT, strokeWidth: 0 }} activeDot={{ r: 5, fill: EMPLOYEE_ACCENT, stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
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

      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowStockModal(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-red-50 border-red-200 px-5 py-3 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600" /> Stock Bajo
              </h3>
              <button onClick={() => setShowStockModal(false)} className="text-gray-400 hover:text-red-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto divide-y divide-gray-50">
              {lowStockAll.length === 0 ? (
                <p className="text-gray-400 text-xs text-center p-8">No hay productos con stock bajo.</p>
              ) : (
                lowStockAll.map(p => (
                  <div key={p.id} className="px-5 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{p.nombre}</p>
                      {p.categoriaNombre && <p className="text-[10px] text-gray-400">{p.categoriaNombre}</p>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${p.stock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {p.stock === 0 ? "Sin stock" : `${p.stock} unid.`}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowStockModal(false)} className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                Cerrar
              </button>
              <button onClick={() => navigate("/employee/productos")} className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors">
                Ver en Productos
              </button>
            </div>
          </div>
        </div>
      )}
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
