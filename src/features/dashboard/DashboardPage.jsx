import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign, ShoppingBag, Activity, TrendingUp,
  CreditCard, Package, AlertCircle, Calendar as CalendarIcon,
  Wallet, Filter, Users, ArrowRight, Clock, PlusCircle
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { apiClient } from "../../shared/utils/apiClient";

const ACCENT = "#10B981"; // primary-500 — verde de marca de SysPharma

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const user = currentUser || {};

  // --- 1. ESTADO DE RANGO DE FECHAS (EL CALENDARIO) ---
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [range, setRange] = useState({ start: firstDayOfMonth, end: todayStr });

  const [data, setData] = useState({ ventas: [], compras: [], citas: [], productos: [] });
  const [loading, setLoading] = useState(true);
  const hasLoadedDataRef = useRef(false);

  const loadData = useCallback(async () => {
    if (hasLoadedDataRef.current) return;
    hasLoadedDataRef.current = true;

    setLoading(true);
    try {
      const [vRes, cRes, ciRes, pRes] = await Promise.allSettled([
        apiClient.get("Venta"),
        apiClient.get("Compra"),
        apiClient.get("Cita"),
        apiClient.get("Producto"),
      ]);
      setData({
        ventas: vRes.status === "fulfilled" ? (vRes.value.data || []) : [],
        compras: cRes.status === "fulfilled" ? (cRes.value.data || []) : [],
        citas: ciRes.status === "fulfilled" ? (ciRes.value.data || []) : [],
        productos: pRes.status === "fulfilled" ? (pRes.value.data || []) : []
      });
    } catch (err) {
      console.error("Error cargando dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // --- 2. LÓGICA DE FILTRADO POR RANGO (MAGIA) ---
  const filtered = useMemo(() => {
    const start = new Date(range.start + "T00:00:00");
    const end = new Date(range.end + "T23:59:59");

    const inRange = (dateStr) => {
      const d = new Date(dateStr);
      return d >= start && d <= end;
    };

    // Se excluyen las ventas anuladas (estadoId 3): antes se sumaban igual que cualquier
    // venta válida, inflando Ingresos, Utilidad, la tendencia y el top de productos con
    // dinero y unidades que en realidad se revirtieron.
    const vF = data.ventas.filter(v => v.estadoId !== 3 && inRange(v.fechaVenta || v.fechaCreacion));
    // Igual que con las ventas: una compra Cancelada no representa un gasto real.
    const cF = data.compras.filter(c =>
      (c.estadoNombre || "").toLowerCase() !== "cancelada" && inRange(c.fechaCompra || c.fechaCreacion)
    );
    const ciF = data.citas.filter(ci => inRange(ci.fecha));

    // KPIs
    const ingresos = vF.reduce((s, v) => s + (v.total || 0), 0);
    const gastos = cF.reduce((s, c) => s + (c.total || 0), 0);
    const utilidad = ingresos - gastos;

    // Gráfica Tendencia (Días)
    const mapTrend = {};
    vF.forEach(v => {
      const key = new Date(v.fechaVenta).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      mapTrend[key] = (mapTrend[key] || 0) + v.total;
    });

    // Top Productos
    const mapProds = {};
    vF.forEach(v => {
      v.detalles?.forEach(d => {
        mapProds[d.productoNombre || "Producto"] = (mapProds[d.productoNombre || "Producto"] || 0) + d.cantidad;
      });
    });

    // Top Servicios
    const mapServs = {};
    ciF.forEach(ci => {
      mapServs[ci.servicioNombre || "Consulta"] = (mapServs[ci.servicioNombre || "Consulta"] || 0) + 1;
    });

    return {
      vF, ciF, ingresos, utilidad,
      trend: Object.entries(mapTrend).map(([name, total]) => ({ name, total })),
      prods: Object.entries(mapProds).map(([name, qty]) => ({ name, qty })).sort((a,b) => b.qty - a.qty).slice(0, 5),
      servs: Object.entries(mapServs).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 5)
    };
  }, [range, data]);

  const fmt = (v) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

  if (loading) return <div className="p-20 text-center font-medium text-gray-400">Analizando periodo...</div>;

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen font-sans space-y-5">

      {/* Banner de Bienvenida */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 border-l-4 border-l-primary-500">
        <h1 className="text-xl font-semibold text-gray-900">Hola, {user.nombre}</h1>
        <p className="text-gray-400 text-sm mt-0.5">Visualización de desempeño parametrizada.</p>
      </div>

      {/* --- SELECTOR DE RANGO --- */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-primary-600">
          <Filter size={16} />
          <span className="font-medium text-sm">Rango de análisis</span>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
          <div className="px-1">
            <span className="text-[10px] text-gray-400 block">Desde</span>
            <input type="date" value={range.start} onChange={(e) => setRange(p => ({...p, start: e.target.value}))} className="bg-transparent text-xs font-medium text-gray-700 outline-none" />
          </div>
          <div className="h-6 w-px bg-gray-200"></div>
          <div className="px-1">
            <span className="text-[10px] text-gray-400 block">Hasta</span>
            <input type="date" value={range.end} onChange={(e) => setRange(p => ({...p, end: e.target.value}))} className="bg-transparent text-xs font-medium text-gray-700 outline-none" />
          </div>
        </div>
      </div>

      {/* KPIs de Desempeño */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Ventas Totales" value={fmt(filtered.ingresos)} icon={DollarSign} suffix={`${filtered.vF.length} ventas`} />
        <StatCard title="Utilidad Bruta" value={fmt(filtered.utilidad)} icon={Wallet} suffix="Balance neto" />
        <StatCard title="Citas del Rango" value={filtered.ciF.length} icon={CalendarIcon} suffix="Consultas" />
        <StatCard title="Stock Crítico" value={data.productos.filter(p => p.stock <= 5).length} icon={AlertCircle} suffix="Alertas de stock" />
      </div>

      {/* Gráficas Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Tendencia de Ventas Diarias/Mensuales */}
        <ChartCard title="Tendencia de ingresos" subtitle="Basado en el rango seleccionado" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={filtered.trend}>
              <defs><linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ACCENT} stopOpacity={0.15}/><stop offset="95%" stopColor={ACCENT} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <Tooltip formatter={v => fmt(v)} />
              <Area type="monotone" dataKey="total" stroke={ACCENT} strokeWidth={2} fillOpacity={1} fill="url(#colorV)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Productos más Vendidos */}
        <ChartCard title="Top 5 productos" subtitle="Los más vendidos en este periodo" icon={Package}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={filtered.prods} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 9, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="qty" fill={ACCENT} radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Servicios más Solicitados */}
        <ChartCard title="Servicios populares" subtitle="Mayor demanda médica" icon={Users}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={filtered.servs}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fontSize: 9, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill={ACCENT} radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Agenda de Citas Diarias (Hoy) */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-medium text-gray-800 text-sm flex items-center gap-2 mb-4">
            <Clock className="text-primary-500" size={16} /> Agenda de hoy
          </h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {filtered.ciF.filter(c => c.fecha === todayStr).map(c => (
              <div key={c.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center hover:bg-primary-50 transition-colors">
                <div>
                    <p className="font-medium text-gray-800 text-xs">{c.pacienteNombre}</p>
                    <p className="text-[10px] text-gray-400">{c.servicioNombre}</p>
                </div>
                <p className="text-xs font-semibold text-primary-600">{c.hora}</p>
              </div>
            ))}
            {filtered.ciF.filter(c => c.fecha === todayStr).length === 0 && <p className="text-gray-400 text-xs text-center p-10">No hay citas para hoy.</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

// Componentes Auxiliares
const StatCard = ({ title, value, icon: Icon, suffix }) => {
  return (
    <div className="p-5 rounded-xl border border-gray-100 bg-white">
      <div className="inline-flex p-2 rounded-lg mb-3 bg-primary-50 text-primary-600"><Icon size={18} /></div>
      <p className="text-xs text-gray-400">{title}</p>
      <h3 className="text-xl font-semibold text-gray-900 mt-0.5">{value}</h3>
      <p className="text-[11px] text-gray-400 mt-1">{suffix}</p>
    </div>
  );
};

const ChartCard = ({ title, subtitle, icon: Icon, children }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-100">
    <div className="flex items-center gap-2.5 mb-5">
      <div className="p-1.5 rounded-md bg-primary-50 text-primary-600"><Icon size={14} /></div>
      <div>
        <h3 className="font-medium text-gray-800 text-sm">{title}</h3>
        <p className="text-[11px] text-gray-400">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);

export default DashboardPage;
