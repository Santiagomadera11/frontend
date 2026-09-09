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

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

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

    const vF = data.ventas.filter(v => inRange(v.fechaVenta || v.fechaCreacion));
    const cF = data.compras.filter(c => inRange(c.fechaCompra || c.fechaCreacion));
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

  if (loading) return <div className="p-20 text-center font-bold text-emerald-600">Analizando periodo...</div>;

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen font-sans space-y-6">
      
      {/* Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black">¡Hola, {user.nombre}! 👋</h1>
          <p className="opacity-90 text-sm font-medium">Visualización de desempeño parametrizada.</p>
        </div>
        <TrendingUp size={120} className="absolute right-10 top-1/2 -translate-y-1/2 opacity-20 rotate-12" />
      </div>

      {/* --- SELECTOR DE RANGO (RESTABLECIDO) --- */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600"><Filter size={20} /></div>
          <span className="font-black text-gray-800 text-xs uppercase tracking-widest">Definir Rango de Análisis</span>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
          <div className="px-2">
            <span className="text-[9px] font-black text-gray-400 uppercase block">Fecha Inicio</span>
            <input type="date" value={range.start} onChange={(e) => setRange(p => ({...p, start: e.target.value}))} className="bg-transparent text-xs font-bold outline-none" />
          </div>
          <div className="h-6 w-[1px] bg-gray-300"></div>
          <div className="px-2">
            <span className="text-[9px] font-black text-gray-400 uppercase block">Fecha Fin</span>
            <input type="date" value={range.end} onChange={(e) => setRange(p => ({...p, end: e.target.value}))} className="bg-transparent text-xs font-bold outline-none" />
          </div>
        </div>
      </div>

      {/* KPIs de Desempeño */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Ventas Totales" value={fmt(filtered.ingresos)} icon={DollarSign} color="blue" suffix={`${filtered.vF.length} Ventas`} />
        <StatCard title="Utilidad Bruta" value={fmt(filtered.utilidad)} icon={Wallet} color="emerald" suffix="Balance Neto" />
        <StatCard title="Citas del Rango" value={filtered.ciF.length} icon={CalendarIcon} color="purple" suffix="Consultas" />
        <StatCard title="Stock Crítico" value={data.productos.filter(p => p.stock <= 5).length} icon={AlertCircle} color="red" suffix="Alertas Stock" />
      </div>

      {/* Gráficas Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tendencia de Ventas Diarias/Mensuales */}
        <ChartCard title="Tendencia de Ingresos" subtitle="Basado en el rango seleccionado" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={filtered.trend}>
              <defs><linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
              <Tooltip formatter={v => fmt(v)} />
              <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorV)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Productos más Vendidos */}
        <ChartCard title="Top 5 Productos" subtitle="Los más vendidos en este periodo" icon={Package}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={filtered.prods} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 9, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="qty" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Servicios más Solicitados */}
        <ChartCard title="Servicios Populares" subtitle="Mayor demanda médica" icon={Users}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={filtered.servs}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[10, 10, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Agenda de Citas Diarias (Hoy) */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2 mb-6">
            <Clock className="text-emerald-500" size={16} /> Agenda de Hoy
          </h3>
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {filtered.ciF.filter(c => c.fecha === todayStr).map(c => (
              <div key={c.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center hover:bg-emerald-50 transition-colors">
                <div>
                    <p className="font-bold text-gray-800 text-xs">{c.pacienteNombre}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{c.servicioNombre}</p>
                </div>
                <p className="text-xs font-black text-emerald-600">{c.hora}</p>
              </div>
            ))}
            {filtered.ciF.filter(c => c.fecha === todayStr).length === 0 && <p className="text-gray-400 italic text-xs text-center p-10">No hay citas para hoy.</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

// Componentes Auxiliares
const StatCard = ({ title, value, icon: Icon, color, suffix }) => {
  const styles = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
    red: "bg-red-50 border-red-100 text-red-700",
    orange: "bg-orange-50 border-orange-100 text-orange-700"
  };
  return (
    <div className={`p-6 rounded-3xl border ${styles[color]} shadow-sm`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/50 rounded-xl"><Icon size={20} /></div>
        <span className="text-[10px] font-black uppercase bg-white/50 px-2 py-1 rounded-lg">{suffix}</span>
      </div>
      <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">{title}</p>
      <h3 className="text-2xl font-black mt-1">{value}</h3>
    </div>
  );
};

const ChartCard = ({ title, subtitle, icon: Icon, children }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-gray-50 p-2 rounded-lg text-gray-400"><Icon size={18} /></div>
      <div>
        <h3 className="font-black text-gray-900 text-xs uppercase tracking-tight">{title}</h3>
        <p className="text-[10px] text-gray-400 font-bold uppercase">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);

export default DashboardPage;