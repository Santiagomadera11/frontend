import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Clock, Users, ShoppingCart, Plus,
  AlertCircle, CheckCircle, Package, ArrowRight, Stethoscope,
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

  // Ventas de hoy
  const ventasHoy = useMemo(() =>
    ventas.filter(v => v.fechaVenta && new Date(v.fechaVenta).toISOString().split("T")[0] === todayStr),
    [ventas, todayStr]);

  const getEstadoColor = (estado) => {
    const lower = (estado || "").toLowerCase();
    if (lower === "completada") return "bg-green-50 text-green-700 border-green-100";
    if (lower.includes("consulta")) return "bg-blue-50 text-blue-700 border-blue-100";
    return "bg-yellow-50 text-yellow-700 border-yellow-100";
  };

  return (
    <>
      <div className="p-4 font-sans bg-gray-50">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Hola, {currentUser.nombre?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-500 text-sm">Aquí tienes el resumen de tu jornada hoy.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/employee/ventas")}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-gray-50 shadow-sm">
              <ShoppingCart size={18} /> Nueva Venta
            </button>
            <button onClick={() => navigate("/employee/citas")}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md">
              <Plus size={18} /> Agendar Cita
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Citas Hoy", value: citasHoy.length, sub: `${citasHoy.filter(c => (c.estadoNombre||"").toLowerCase()==="completada").length} atendidas`, icon: Calendar, bg: "bg-blue-50", color: "text-blue-600" },
            { label: "Por Confirmar", value: pendingConfirmations, sub: "Requieren llamada", icon: AlertCircle, bg: "bg-orange-50", color: "text-orange-600" },
            { label: "Ventas Hoy", value: ventasHoy.length, sub: `$${ventasHoy.reduce((s,v)=>s+(v.total||0),0).toLocaleString("es-CO")}`, icon: ShoppingCart, bg: "bg-green-50", color: "text-green-600" },
            { label: "Stock Bajo", value: lowStockProducts.length, sub: "Productos por agotarse", icon: AlertCircle, bg: "bg-red-50", color: "text-red-600" },
          ].map(({ label, value, sub, bg, color }) => (
            <div key={label} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
                <p className={`text-xs font-medium mt-1 ${color}`}>{sub}</p>
              </div>
              <div className={`p-2 ${bg} rounded-lg ${color}`}></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Próxima cita */}
            {nextAppointment ? (
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-4 text-white shadow relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1 opacity-90">
                      <Clock size={16} />
                      <span className="text-sm font-medium">Siguiente turno: {nextAppointment.hora}</span>
                    </div>
                    <h2 className="text-xl font-bold">{nextAppointment.pacienteNombre}</h2>
                    <p className="opacity-90 text-sm mt-1">{nextAppointment.servicioNombre || "-"}</p>
                  </div>
                  <button onClick={() => navigate("/employee/citas")}
                    className="bg-white text-blue-600 px-3 py-1 rounded-md text-sm font-bold shadow hover:bg-gray-100">
                    Gestionar
                  </button>
                </div>
                <Stethoscope className="absolute -bottom-4 -right-4 text-white opacity-10" size={96} />
              </div>
            ) : (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                <h3 className="text-green-800 font-bold">¡Todo al día!</h3>
                <p className="text-green-600 text-sm">No hay más citas pendientes por hoy.</p>
              </div>
            )}

            {/* Agenda */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Agenda de Hoy</h3>
                <button onClick={() => navigate("/employee/citas")}
                  className="text-blue-600 text-xs font-bold hover:underline">Ver todo</button>
              </div>
              <div className="divide-y divide-gray-50">
                {loading ? (
                  <div className="p-3 text-center text-sm text-gray-400">Cargando citas...</div>
                ) : citasHoy.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">No hay citas programadas para hoy.</div>
                ) : (
                  citasHoy.map(apt => (
                    <div key={apt.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-50 text-blue-700 font-bold text-xs px-2 py-1 rounded-md">{apt.hora}</div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">{apt.pacienteNombre}</h4>
                          <p className="text-xs text-gray-500">{apt.servicioNombre || apt.medicoNombre || "-"}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getEstadoColor(apt.estadoNombre)}`}>
                        {apt.estadoNombre}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
              <h3 className="font-bold text-gray-800 mb-3 text-sm">Accesos Rápidos</h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickAction icon={ShoppingCart} label="Ventas" onClick={() => navigate("/employee/ventas")} color="blue" />
                <QuickAction icon={Calendar} label="Citas" onClick={() => navigate("/employee/citas")} color="blue" />
                <QuickAction icon={Users} label="Pedidos" onClick={() => navigate("/employee/pedidos")} color="purple" />
                <QuickAction icon={Package} label="Inventario" onClick={() => navigate("/employee/productos")} color="orange" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500" /> Bajo Stock
                </h3>
              </div>
              <div className="space-y-3">
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map(p => (
                    <div key={p.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                      <span className="text-gray-600 truncate max-w-[120px]">{p.nombre}</span>
                      <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md text-xs">{p.stock} un.</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">Inventario saludable ✅</p>
                )}
              </div>
              {lowStockProducts.length > 0 && (
                <button onClick={() => navigate("/employee/productos")}
                  className="w-full mt-4 text-xs text-center text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1">
                  Ver inventario <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <OpenShiftModal isOpen={showOpenShiftModal} onShiftOpened={() => setShowOpenShiftModal(false)}
        user={currentUser} canClose={currentUser.rol === "Administrador"}
        onCancel={() => setShowOpenShiftModal(false)} />
    </>
  );
};

const QuickAction = ({ label, onClick, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    emerald: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
  };
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${colors[color]}`}>
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
};

export default DashboardEmpleado;