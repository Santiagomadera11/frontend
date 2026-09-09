import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp, DollarSign, Package, AlertCircle,
  Download, Award, Stethoscope,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { apiClient } from "../../../shared/utils/apiClient";

const API = "/api";
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${sessionStorage.getItem("syspharma_token")}` },
});
const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
const fmt = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

export const SalesPerformanceReportsPage = () => {
  const [activeTab, setActiveTab] = useState("empleados");
  const [turnos, setTurnos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [turnosRes, citasRes] = await Promise.allSettled([
        apiClient.get(`${API}/Turno`, getAuthHeaders()),
        apiClient.get(`${API}/Cita`, getAuthHeaders()),
      ]);
      if (turnosRes.status === "fulfilled") setTurnos(turnosRes.value.data || []);
      if (citasRes.status === "fulfilled") setCitas(citasRes.value.data || []);
    } catch {
      // Error loading data
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Resumen por empleado desde turnos
  const employeesSummary = useMemo(() => {
    const map = new Map();
    turnos.filter(t => t.estado === "cerrado").forEach(t => {
      if (!map.has(t.usuarioId)) {
        map.set(t.usuarioId, {
          userId: t.usuarioId,
          userName: t.usuarioNombre,
          totalVentas: 0,
          totalGastos: 0,
          totalTurnos: 0,
        });
      }
      const emp = map.get(t.usuarioId);
      emp.totalVentas += t.totalVentas || 0;
      emp.totalGastos += t.totalGastos || 0;
      emp.totalTurnos += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.totalVentas - a.totalVentas);
  }, [turnos]);

  // Resumen por médico desde citas completadas
  const medicosSummary = useMemo(() => {
    const map = new Map();
    citas.filter(c => (c.estadoNombre || "").toLowerCase() === "completada").forEach(c => {
      const id = c.medicoId;
      const nombre = c.medicoNombre || "Médico";
      if (!map.has(id)) map.set(id, { medicoId: id, nombreMedico: nombre, totalServicios: 0, totalIngresos: 0 });
      const m = map.get(id);
      m.totalServicios += 1;
      m.totalIngresos += Number(c.precio) || 0;
    });
    return Array.from(map.values()).sort((a, b) => b.totalServicios - a.totalServicios);
  }, [citas]);

  const handleDownloadCSV = () => {
    if (activeTab === "empleados") {
      if (!employeesSummary.length) {
        alert("No hay datos para exportar");
        return;
      }
      const headers = ["Empleado", "Total Ventas", "Total Gastos", "Total Turnos"];
      const rows = employeesSummary.map(e => [
        e.userName || "",
        e.totalVentas || 0,
        e.totalGastos || 0,
        e.totalTurnos || 0
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `rendimiento_empleados_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (!medicosSummary.length) {
        alert("No hay datos para exportar");
        return;
      }
      const headers = ["Médico", "Total Servicios", "Total Ingresos"];
      const rows = medicosSummary.map(m => [
        m.nombreMedico || "",
        m.totalServicios || 0,
        m.totalIngresos || 0
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `productividad_medica_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const topSeller = employeesSummary[0] || null;
  const totalVentasGrupo = employeesSummary.reduce((s, e) => s + e.totalVentas, 0);
  const META_VENTAS = 5000000;
  const metaGroupal = (totalVentasGrupo / META_VENTAS) * 100;

  const chartData = employeesSummary.map(e => ({
    nombre: e.userName, ventas: e.totalVentas, turnos: e.totalTurnos,
  }));

  const medicosPieData = medicosSummary.map(m => ({
    name: m.nombreMedico, value: m.totalServicios, ingresos: m.totalIngresos,
  }));

  const getMedal = (i) => ["🥇", "🥈", "🥉"][i] || null;

  return (
    <div className="h-full flex flex-col gap-4 font-sans text-gray-800 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard de Rendimiento</h1>
          <p className="text-sm text-gray-500 mt-1">Análisis de desempeño de empleados y médicos</p>
        </div>
        <button onClick={handleDownloadCSV} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
          <Download size={16} /> Descargar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
        {[
          { id: "empleados", label: "Desempeño de Empleados" },
          { id: "medicos", label: "Productividad Médica", icon: Stethoscope },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
              activeTab === tab.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}>
            {tab.icon && <tab.icon size={14} />} {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-8 text-gray-400">Cargando datos...</div>}

      {/* Tab Empleados */}
      {!loading && activeTab === "empleados" && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-yellow-700 font-semibold mb-1">⭐ Empleado Estrella</p>
                  <p className="text-lg font-bold text-yellow-900">{topSeller?.userName || "—"}</p>
                  <p className="text-sm text-yellow-700 font-semibold mt-2">{fmt(topSeller?.totalVentas || 0)}</p>
                  <p className="text-xs text-yellow-600">en ventas</p>
                </div>
                <Award className="text-yellow-600" size={36} />
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-700 font-semibold mb-1">📊 Total Grupo</p>
                  <p className="text-lg font-bold text-blue-900">{fmt(totalVentasGrupo)}</p>
                  <p className="text-xs text-blue-600 mt-2">{employeesSummary.length} empleados</p>
                </div>
                <TrendingUp className="text-blue-600" size={36} />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-700 font-semibold mb-1">📊 Meta Grupal</p>
                  <p className="text-lg font-bold text-green-900">{metaGroupal.toFixed(1)}%</p>
                  <p className="text-xs text-green-600 mt-2">{fmt(totalVentasGrupo)} / {fmt(META_VENTAS)}</p>
                </div>
                <DollarSign className="text-green-600" size={36} />
              </div>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Ventas por Empleado</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Legend />
                  <Bar dataKey="ventas" fill="#10b981" name="Ventas (COP)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                  <tr>
                    {["Pos.", "Empleado", "Turnos", "Total Ventas", "Total Gastos", "Promedio/Turno"].map(h => (
                      <th key={h} className="py-3 px-4 text-xs font-bold text-gray-700 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employeesSummary.length === 0 ? (
                    <tr><td colSpan={6} className="py-6 text-center text-gray-500 text-sm">No hay datos de empleados</td></tr>
                  ) : (
                    employeesSummary.map((emp, i) => (
                      <tr key={emp.userId} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 text-center text-lg">{getMedal(i) || (i + 1)}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-700">{emp.userName}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{emp.totalTurnos}</td>
                        <td className="py-3 px-4 text-sm font-bold text-green-600">{fmt(emp.totalVentas)}</td>
                        <td className="py-3 px-4 text-sm font-bold text-red-600">{fmt(emp.totalGastos)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{fmt(emp.totalTurnos > 0 ? emp.totalVentas / emp.totalTurnos : 0)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab Médicos */}
      {!loading && activeTab === "medicos" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Distribución de Servicios por Médico</h3>
              {medicosPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={medicosPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                      label={e => `${e.name}: ${e.value}`} labelLine={false}>
                      {medicosPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n, p) => [v, p.payload.name]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800">Ranking de Médicos</h3>
              {medicosSummary.length === 0 ? (
                <div className="text-gray-400 text-sm flex items-center gap-2"><AlertCircle size={14} /> Sin datos de médicos</div>
              ) : (
                medicosSummary.map((m, i) => (
                  <div key={m.medicoId} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{getMedal(i) || (i + 1)}. {m.nombreMedico}</p>
                        <p className="text-xs text-gray-500">{m.totalServicios} servicios</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">{fmt(m.totalIngresos)}</p>
                        <p className="text-xs text-gray-500">ingresos</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${(m.totalServicios / (medicosSummary[0]?.totalServicios || 1)) * 100}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                  <tr>
                    {["Pos.", "Médico", "Citas Realizadas", "Ingresos", "Promedio/Cita"].map(h => (
                      <th key={h} className="py-3 px-4 text-xs font-bold text-gray-700 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {medicosSummary.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 text-center text-gray-500 text-sm">No hay datos</td></tr>
                  ) : (
                    medicosSummary.map((m, i) => (
                      <tr key={m.medicoId} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 text-center font-bold">{getMedal(i) || (i + 1)}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-700">{m.nombreMedico}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{m.totalServicios}</td>
                        <td className="py-3 px-4 text-sm font-bold text-green-600">{fmt(m.totalIngresos)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{fmt(m.totalServicios > 0 ? m.totalIngresos / m.totalServicios : 0)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesPerformanceReportsPage;