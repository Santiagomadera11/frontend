import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign, ShoppingBag, Activity, TrendingUp,
  CreditCard, Package, AlertCircle, Calendar as CalendarIcon,
  Wallet, Filter, Users, ArrowRight, Clock, PlusCircle, X
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, LabelList,
} from "recharts";
import { apiClient } from "../../shared/utils/apiClient";
import { productosMontoDe } from "../../shared/utils/ventaCalculations";

const ACCENT = "#10B981";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const user = currentUser || {};
  const [showStockModal, setShowStockModal] = useState(false);

  const toLocalDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayStr = toLocalDateStr(new Date());
  const firstDayOfMonth = toLocalDateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [range, setRange] = useState({ start: firstDayOfMonth, end: todayStr });

  const [data, setData] = useState({ ventas: [], compras: [], citas: [], productos: [], devoluciones: [] });
  const [loading, setLoading] = useState(true);
  const hasLoadedDataRef = useRef(false);

  const loadData = useCallback(async () => {
    if (hasLoadedDataRef.current) return;
    hasLoadedDataRef.current = true;

    setLoading(true);
    try {
      const [vRes, cRes, ciRes, pRes, dRes] = await Promise.allSettled([
        apiClient.get("Venta"),
        apiClient.get("Compra"),
        apiClient.get("Cita"),
        apiClient.get("Producto"),
        apiClient.get("Devolucion"),
      ]);
      setData({
        ventas: vRes.status === "fulfilled" ? (vRes.value.data || []) : [],
        compras: cRes.status === "fulfilled" ? (cRes.value.data || []) : [],
        citas: ciRes.status === "fulfilled" ? (ciRes.value.data || []) : [],
        productos: pRes.status === "fulfilled" ? (pRes.value.data || []) : [],
        devoluciones: dRes.status === "fulfilled" ? (dRes.value.data || []) : []
      });
    } catch (err) {
      console.error("Error cargando dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const productosStockCritico = useMemo(() =>
    data.productos.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock)
  , [data.productos]);

  const agendaHoyPendiente = useMemo(() => {
    const finalizadas = ["completada", "pagada", "cancelada", "no asistió"];
    return data.citas.filter(c => c.fecha === todayStr && !finalizadas.includes((c.estadoNombre || "").toLowerCase()));
  }, [data.citas, todayStr]);

  const filtered = useMemo(() => {
    const start = new Date(range.start + "T00:00:00");
    const end = new Date(range.end + "T23:59:59");

    const inRange = (dateStr) => {
      if (!dateStr) return false;
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
      const d = new Date(isDateOnly ? `${dateStr}T00:00:00` : dateStr);
      return d >= start && d <= end;
    };

    const vF = data.ventas.filter(v => v.estadoId !== 3 && inRange(v.fechaVenta || v.fechaCreacion));
    const ciF = data.citas.filter(ci => inRange(ci.fecha));

    const devF = (data.devoluciones || []).filter(dv => dv.estadoId === 2 && inRange(dv.fechaGestion || dv.fechaDevolucion));
    const devueltoIngresos = devF.reduce((s, dv) => s + (dv.totalDevolucion || 0), 0);
    const costoMap = new Map(data.productos.map(p => [p.id, p.precioCompra || 0]));
    const devueltoCosto = devF.reduce((s, dv) =>
      s + (dv.detalles?.reduce((ds, d) => ds + (d.reingresa ? (d.cantidadDevuelta || 0) * (costoMap.get(d.productoId) || 0) : 0), 0) || 0)
    , 0);

    const ingresos = vF.reduce((s, v) => s + productosMontoDe(v), 0) - devueltoIngresos;
    const costoVentas = vF.reduce((s, v) =>
      s + (v.detalles?.reduce((ds, d) => ds + (d.cantidad || 0) * (d.costoUnitario ?? costoMap.get(d.productoId) ?? 0), 0) || 0)
    , 0) - devueltoCosto;
    const utilidad = ingresos - costoVentas;

    const mapTrend = {};
    vF.forEach(v => {
      const key = new Date(v.fechaVenta).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      mapTrend[key] = (mapTrend[key] || 0) + productosMontoDe(v);
    });

    const mapProds = {};
    vF.forEach(v => {
      v.detalles?.forEach(d => {
        mapProds[d.productoNombre || "Producto"] = (mapProds[d.productoNombre || "Producto"] || 0) + d.cantidad;
      });
    });

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
  const fmtCompact = (v) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", notation: "compact", maximumFractionDigits: 1 }).format(v || 0);

  if (loading) return <div className="p-20 text-center font-medium text-gray-400">Analizando periodo...</div>;

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen font-sans space-y-5">

      <div className="bg-white rounded-xl p-6 border border-gray-100 border-l-4 border-l-primary-500">
        <h1 className="text-xl font-semibold text-gray-900">Hola, {user.nombre}</h1>
        <p className="text-gray-400 text-sm mt-0.5">Visualización de desempeño parametrizada.</p>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Ventas Totales" value={fmt(filtered.ingresos)} icon={DollarSign} suffix={`${filtered.vF.length} ventas`}
          bg="bg-primary-50" color="text-primary-600" accent="before:bg-primary-500" />
        <StatCard title="Utilidad Bruta" value={fmt(filtered.utilidad)} icon={Wallet} suffix="Balance neto"
          bg="bg-blue-50" color="text-blue-600" accent="before:bg-blue-500" />
        <StatCard title="Citas del Rango" value={filtered.ciF.length} icon={CalendarIcon} suffix="Consultas"
          bg="bg-violet-50" color="text-violet-600" accent="before:bg-violet-500" />
        <StatCard title="Stock Crítico" value={productosStockCritico.length} icon={AlertCircle} suffix="Alertas de stock — clic para ver cuáles"
          bg="bg-red-50" color="text-red-600" accent="before:bg-red-500" onClick={() => setShowStockModal(true)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <ChartCard title="Tendencia de ingresos" subtitle="Basado en el rango seleccionado" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={filtered.trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs><linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ACCENT} stopOpacity={0.15}/><stop offset="95%" stopColor={ACCENT} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={fmtCompact} width={48} />
              <Tooltip
                cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                formatter={v => [fmt(v), "Ingresos"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                labelStyle={{ fontWeight: 600, color: "#1e293b", marginBottom: 2 }}
              />
              <Area type="monotone" dataKey="total" stroke={ACCENT} strokeWidth={2} fillOpacity={1} fill="url(#colorV)"
                dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }} activeDot={{ r: 5, fill: ACCENT, stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 5 productos" subtitle="Los más vendidos en este periodo" icon={Package}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={filtered.prods} layout="vertical" margin={{ top: 0, right: 28, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                formatter={v => [v, "Unidades"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                labelStyle={{ fontWeight: 600, color: "#1e293b", marginBottom: 2 }}
              />
              <Bar dataKey="qty" fill={ACCENT} radius={[0, 6, 6, 0]} barSize={16}>
                <LabelList dataKey="qty" position="right" style={{ fontSize: 10, fontWeight: 600, fill: "#475569" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Servicios populares" subtitle="Mayor demanda médica" icon={Users}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={filtered.servs} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                formatter={v => [v, "Citas"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                labelStyle={{ fontWeight: 600, color: "#1e293b", marginBottom: 2 }}
              />
              <Bar dataKey="count" fill={ACCENT} radius={[6, 6, 0, 0]} barSize={24}>
                <LabelList dataKey="count" position="top" style={{ fontSize: 10, fontWeight: 600, fill: "#475569" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-medium text-gray-800 text-sm flex items-center gap-2 mb-4">
            <Clock className="text-primary-500" size={16} /> Agenda de hoy
          </h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {agendaHoyPendiente.map(c => (
              <div key={c.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center hover:bg-primary-50 transition-colors">
                <div>
                    <p className="font-medium text-gray-800 text-xs">{c.pacienteNombre}</p>
                    <p className="text-[10px] text-gray-400">{c.servicioNombre}</p>
                </div>
                <p className="text-xs font-semibold text-primary-600">{c.hora}</p>
              </div>
            ))}
            {agendaHoyPendiente.length === 0 && <p className="text-gray-400 text-xs text-center p-10">No hay citas pendientes para hoy.</p>}
          </div>
        </div>

      </div>

      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowStockModal(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-red-50 border-red-200 px-5 py-3 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600" /> Stock Crítico
              </h3>
              <button onClick={() => setShowStockModal(false)} className="text-gray-400 hover:text-red-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto divide-y divide-gray-50">
              {productosStockCritico.length === 0 ? (
                <p className="text-gray-400 text-xs text-center p-8">No hay productos con stock crítico.</p>
              ) : (
                productosStockCritico.map(p => (
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
              <button onClick={() => navigate("/admin/productos")} className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors">
                Ver en Productos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, suffix, bg, color, accent, onClick }) => {
  return (
    <div onClick={onClick} className={`group relative overflow-hidden p-5 rounded-xl border border-gray-100 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 before:absolute before:inset-x-0 before:top-0 before:h-1 ${accent} ${onClick ? "cursor-pointer" : ""}`}>
      <div className={`inline-flex p-2.5 rounded-lg mb-3 ${bg} ${color} group-hover:scale-110 transition-transform duration-200`}><Icon size={18} /></div>
      <p className="text-xs text-gray-400">{title}</p>
      <h3 className="text-2xl font-semibold text-gray-900 mt-0.5">{value}</h3>
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
