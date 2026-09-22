import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp, DollarSign, Package, AlertCircle,
  Download, Award, Stethoscope, BarChart3, Pencil, Check, X as XIcon, Eye, History,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { apiClient } from "../../../shared/utils/apiClient";

const API = "/api";
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${sessionStorage.getItem("syspharma_token")}` },
});
const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
const fmt = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);
const fmtCompact = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", notation: "compact", maximumFractionDigits: 1 }).format(v || 0);

const getEstadoCitaStyle = (estadoNombre) => {
  const est = (estadoNombre || "").toLowerCase();
  if (est.includes("pagada")) return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (est.includes("completada")) return "bg-blue-50 text-blue-700 border-blue-100";
  if (est.includes("cancelada")) return "bg-red-50 text-red-700 border-red-100";
  if (est.includes("pendiente") || est.includes("asistencia")) return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-gray-50 text-gray-700 border-gray-100";
};

export const SalesPerformanceReportsPage = () => {
  const [activeTab, setActiveTab] = useState("empleados");
  const [turnos, setTurnos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metaVentas, setMetaVentas] = useState(5000000);
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaInput, setMetaInput] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [historialMedico, setHistorialMedico] = useState(null);

  const currentUser = JSON.parse(sessionStorage.getItem("syspharma_user") || '{"rol":""}');
  const isAdmin = (currentUser?.rol || "").toLowerCase().trim() === "administrador";
  const theme = isAdmin
    ? { icon: "bg-emerald-50 text-emerald-600", button: "bg-emerald-600 hover:bg-emerald-700", tabActive: "bg-emerald-600 text-white", thead: "bg-emerald-600", chartHex: "#059669", chartHexStrong: "#047857" }
    : { icon: "bg-blue-50 text-blue-600", button: "bg-blue-600 hover:bg-blue-700", tabActive: "bg-blue-600 text-white", thead: "bg-blue-600", chartHex: "#2563eb", chartHexStrong: "#1d4ed8" };

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
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const cargarMeta = async () => {
      try {
        const res = await apiClient.get(`${API}/Configuracion/meta_ventas_grupal`, getAuthHeaders());
        const valor = parseFloat(res.data?.valor);
        if (!Number.isNaN(valor)) setMetaVentas(valor);
      } catch {
      }
    };
    cargarMeta();
  }, []);

  const iniciarEdicionMeta = () => {
    setMetaInput(String(metaVentas));
    setEditingMeta(true);
  };

  const cancelarEdicionMeta = () => {
    setEditingMeta(false);
    setMetaInput("");
  };

  const guardarMeta = async () => {
    const valor = parseFloat(metaInput);
    if (Number.isNaN(valor) || valor <= 0) return;
    setSavingMeta(true);
    try {
      await apiClient.put(`${API}/Configuracion/meta_ventas_grupal`, JSON.stringify(String(valor)), getAuthHeaders());
      setMetaVentas(valor);
      setEditingMeta(false);
    } catch {
    } finally {
      setSavingMeta(false);
    }
  };

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

  const medicosSummary = useMemo(() => {
    const map = new Map();
    citas.filter(c => (c.estadoNombre || "").toLowerCase() === "pagada").forEach(c => {
      const id = c.medicoId;
      const nombre = c.medicoNombre || "Médico";
      if (!map.has(id)) map.set(id, { medicoId: id, nombreMedico: nombre, totalServicios: 0, totalIngresos: 0 });
      const m = map.get(id);
      m.totalServicios += 1;
      m.totalIngresos += Number(c.precio) || 0;
    });
    return Array.from(map.values()).sort((a, b) => b.totalServicios - a.totalServicios);
  }, [citas]);

  const historialCitas = useMemo(() => {
    if (!historialMedico) return [];
    return citas
      .filter(c => c.medicoId === historialMedico.medicoId)
      .sort((a, b) => `${b.fecha || ""}${b.hora || ""}`.localeCompare(`${a.fecha || ""}${a.hora || ""}`));
  }, [citas, historialMedico]);

  const handleDownloadHistorialCSV = () => {
    if (!historialMedico || !historialCitas.length) return;
    const headers = ["Fecha", "Hora", "Paciente", "Servicio", "Precio", "Estado"];
    const rows = historialCitas.map(c => [
      c.fecha ? c.fecha.substring(0, 10) : "",
      c.hora || "",
      c.pacienteNombre || "",
      c.servicioNombre || "",
      c.precio || 0,
      c.estadoNombre || "",
    ]);
    const csvContent = "data:text/csv;charset=utf-8,﻿"
      + [headers.join(","), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `historial_${(historialMedico.nombreMedico || "medico").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

      const csvContent = "data:text/csv;charset=utf-8,﻿"
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

      const csvContent = "data:text/csv;charset=utf-8,﻿"
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
  const metaGroupal = metaVentas > 0 ? (totalVentasGrupo / metaVentas) * 100 : 0;

  const chartData = employeesSummary.map(e => ({
    nombre: e.userName, ventas: e.totalVentas, turnos: e.totalTurnos,
  }));

  const medicosPieData = medicosSummary.map(m => ({
    name: m.nombreMedico, value: m.totalServicios, ingresos: m.totalIngresos,
  }));

  const getMedal = (i) => ["🥇", "🥈", "🥉"][i] || null;

  return (
    <div className="h-full flex flex-col gap-4 font-sans text-gray-800 p-4 bg-[#f8fafc]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${theme.icon} p-2.5 rounded-xl`}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard de Rendimiento</h1>
            <p className="text-xs text-gray-500 mt-0.5">Análisis de desempeño de empleados y médicos</p>
          </div>
        </div>
        <button onClick={handleDownloadCSV} className={`flex items-center gap-1.5 ${theme.button} text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors`}>
          <Download size={15} /> Descargar CSV
        </button>
      </div>

      <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
        {[
          { id: "empleados", label: "Desempeño de Empleados" },
          { id: "medicos", label: "Productividad Médica", icon: Stethoscope },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id ? theme.tabActive : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {tab.icon && <tab.icon size={14} />} {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-8 text-gray-400">Cargando datos...</div>}

      {!loading && activeTab === "empleados" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="group relative overflow-hidden bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-amber-400">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wide">Empleado Estrella</p>
                  <p className="text-base font-bold text-gray-900 mt-1 truncate">{topSeller?.userName || "—"}</p>
                  <p className="text-sm font-bold text-amber-600 mt-1">{fmt(topSeller?.totalVentas || 0)}</p>
                  <p className="text-[10px] text-gray-400">en ventas</p>
                </div>
                <div className="bg-amber-50 text-amber-500 p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-200 shrink-0">
                  <Award size={18} />
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-blue-500">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wide">Total Grupo</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{fmt(totalVentasGrupo)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{employeesSummary.length} empleados</p>
                </div>
                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-200 shrink-0">
                  <TrendingUp size={18} />
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-emerald-500">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wide">Meta Grupal</p>
                    {isAdmin && !editingMeta && (
                      <button onClick={iniciarEdicionMeta} title="Editar meta grupal"
                        className="text-gray-300 hover:text-emerald-600 transition-colors">
                        <Pencil size={11} />
                      </button>
                    )}
                  </div>
                  <p className="text-lg font-bold text-gray-900 mt-1">{metaGroupal.toFixed(1)}%</p>
                  {editingMeta ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input type="number" min="1" autoFocus value={metaInput}
                        onChange={(e) => setMetaInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") guardarMeta(); if (e.key === "Escape") cancelarEdicionMeta(); }}
                        className="w-24 text-[11px] px-1.5 py-0.5 border border-gray-200 rounded outline-none focus:ring-1 focus:ring-emerald-500" />
                      <button onClick={guardarMeta} disabled={savingMeta} title="Guardar"
                        className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50">
                        <Check size={13} />
                      </button>
                      <button onClick={cancelarEdicionMeta} title="Cancelar"
                        className="p-1 rounded text-gray-400 hover:bg-gray-50 transition-colors">
                        <XIcon size={13} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-1">{fmt(totalVentasGrupo)} / {fmt(metaVentas)}</p>
                  )}
                </div>
                <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-200 shrink-0">
                  <DollarSign size={18} />
                </div>
              </div>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-md ${theme.icon}`}><TrendingUp size={14} /></div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Ventas por Empleado</h3>
                    <p className="text-[11px] text-gray-400">Turnos cerrados en el período</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: theme.chartHexStrong }} />
                  Mejor del grupo
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 24, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={fmtCompact} width={56} />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    formatter={v => [fmt(v), "Ventas"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    labelStyle={{ fontWeight: 600, color: "#1e293b", marginBottom: 2 }}
                  />
                  <Bar dataKey="ventas" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, i) => (
                      <Cell key={entry.nombre} fill={i === 0 ? theme.chartHexStrong : theme.chartHex} />
                    ))}
                    <LabelList dataKey="ventas" position="top" formatter={fmtCompact} style={{ fontSize: 10, fontWeight: 600, fill: "#475569" }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className={`${theme.thead} text-white sticky top-0`}>
                  <tr>
                    {["Pos.", "Empleado", "Turnos", "Total Ventas", "Total Gastos", "Promedio/Turno"].map(h => (
                      <th key={h} className="py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employeesSummary.length === 0 ? (
                    <tr><td colSpan={6} className="py-6 text-center text-gray-400 text-sm">No hay datos de empleados</td></tr>
                  ) : (
                    employeesSummary.map((emp, i) => (
                      <tr key={emp.userId} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-3 text-center text-sm">{getMedal(i) || (i + 1)}</td>
                        <td className="py-2 px-3 text-xs font-semibold text-gray-700">{emp.userName}</td>
                        <td className="py-2 px-3 text-xs text-gray-600">{emp.totalTurnos}</td>
                        <td className="py-2 px-3 text-xs font-bold text-emerald-600">{fmt(emp.totalVentas)}</td>
                        <td className="py-2 px-3 text-xs font-bold text-red-600">{fmt(emp.totalGastos)}</td>
                        <td className="py-2 px-3 text-xs text-gray-600">{fmt(emp.totalTurnos > 0 ? emp.totalVentas / emp.totalTurnos : 0)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && activeTab === "medicos" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2.5 mb-4">
                <div className={`p-1.5 rounded-md ${theme.icon}`}><Stethoscope size={14} /></div>
                <h3 className="text-sm font-semibold text-gray-800">Distribución de Servicios por Médico</h3>
              </div>
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

            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-gray-800">Ranking de Médicos</h3>
              {medicosSummary.length === 0 ? (
                <div className="text-gray-400 text-sm flex items-center gap-2 bg-white p-4 rounded-xl border border-gray-100"><AlertCircle size={14} /> Sin datos de médicos</div>
              ) : (
                medicosSummary.map((m, i) => (
                  <div key={m.medicoId} className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{getMedal(i) || `${i + 1}.`} {m.nombreMedico}</p>
                        <p className="text-[11px] text-gray-400">{m.totalServicios} servicios</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 pl-2">
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600">{fmt(m.totalIngresos)}</p>
                          <p className="text-[10px] text-gray-400">ingresos</p>
                        </div>
                        <button onClick={() => setHistorialMedico({ medicoId: m.medicoId, nombreMedico: m.nombreMedico })}
                          title="Ver historial de pacientes"
                          className={`p-1.5 rounded-lg ${theme.icon} hover:opacity-80 transition-opacity`}>
                          <History size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${theme.thead}`}
                        style={{ width: `${(m.totalServicios / (medicosSummary[0]?.totalServicios || 1)) * 100}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className={`${theme.thead} text-white sticky top-0`}>
                  <tr>
                    {["Pos.", "Médico", "Citas Realizadas", "Ingresos", "Promedio/Cita", ""].map(h => (
                      <th key={h} className="py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {medicosSummary.length === 0 ? (
                    <tr><td colSpan={6} className="py-6 text-center text-gray-400 text-sm">No hay datos</td></tr>
                  ) : (
                    medicosSummary.map((m, i) => (
                      <tr key={m.medicoId} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-3 text-center text-sm">{getMedal(i) || (i + 1)}</td>
                        <td className="py-2 px-3 text-xs font-semibold text-gray-700">{m.nombreMedico}</td>
                        <td className="py-2 px-3 text-xs text-gray-600">{m.totalServicios}</td>
                        <td className="py-2 px-3 text-xs font-bold text-emerald-600">{fmt(m.totalIngresos)}</td>
                        <td className="py-2 px-3 text-xs text-gray-600">{fmt(m.totalServicios > 0 ? m.totalIngresos / m.totalServicios : 0)}</td>
                        <td className="py-2 px-3 text-right">
                          <button onClick={() => setHistorialMedico({ medicoId: m.medicoId, nombreMedico: m.nombreMedico })}
                            title="Ver historial de pacientes"
                            className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors">
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {historialMedico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className={`px-6 py-4 flex items-center justify-between border-b ${isAdmin ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200"} flex-shrink-0`}>
              <div>
                <h2 className={`text-lg font-semibold ${isAdmin ? "text-emerald-700" : "text-blue-700"}`}>Historial de {historialMedico.nombreMedico}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{historialCitas.length} cita{historialCitas.length !== 1 ? "s" : ""} registrada{historialCitas.length !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setHistorialMedico(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XIcon size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {["Fecha", "Hora", "Paciente", "Servicio", "Precio", "Estado"].map(h => (
                      <th key={h} className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {historialCitas.length === 0 ? (
                    <tr><td colSpan={6} className="py-6 text-center text-gray-400 text-sm">Sin citas registradas</td></tr>
                  ) : (
                    historialCitas.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-3 text-xs text-gray-600 whitespace-nowrap">{c.fecha ? c.fecha.substring(0, 10) : "—"}</td>
                        <td className="py-2 px-3 text-xs text-gray-600 whitespace-nowrap">{c.hora || "—"}</td>
                        <td className="py-2 px-3 text-xs font-semibold text-gray-700">{c.pacienteNombre || "—"}</td>
                        <td className="py-2 px-3 text-xs text-gray-600">{c.servicioNombre || "—"}</td>
                        <td className="py-2 px-3 text-xs font-bold text-gray-800 whitespace-nowrap">{fmt(c.precio)}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getEstadoCitaStyle(c.estadoNombre)}`}>
                            {c.estadoNombre || "—"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
              <button onClick={handleDownloadHistorialCSV} disabled={!historialCitas.length}
                className={`flex items-center gap-1.5 ${theme.button} text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}>
                <Download size={13} /> Descargar CSV
              </button>
              <button onClick={() => setHistorialMedico(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPerformanceReportsPage;