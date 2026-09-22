import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar, TrendingUp, TrendingDown, DollarSign,
  Eye, Download, ArrowUp, ArrowDown, Lock, History, Filter, X, FileText,
} from "lucide-react";
import { apiClient } from "../../../shared/utils/apiClient";
import { CloseShiftModal } from "../../sales/components/CloseShiftModal";

const API_URL = "/api/Turno";
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${sessionStorage.getItem("syspharma_token")}` },
});

const fmt = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

export const ShiftHistoryReportsPage = () => {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedShift, setSelectedShift] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc");
  const [forceCloseShift, setForceCloseShift] = useState(null);

  const currentUser = JSON.parse(sessionStorage.getItem("syspharma_user") || '{"rol":""}');
  const isAdmin = (currentUser?.rol || "").toLowerCase().trim() === "administrador";

  const theme = isAdmin
    ? { icon: "bg-emerald-50 text-emerald-600", button: "bg-emerald-600 hover:bg-emerald-700", ring: "focus:ring-emerald-200 focus:border-emerald-400", thead: "bg-emerald-600", theadHover: "hover:bg-emerald-700", header: "bg-emerald-50 border-emerald-200", headerIcon: "text-emerald-600", hoverIcon: "hover:text-emerald-600" }
    : { icon: "bg-blue-50 text-blue-600", button: "bg-blue-600 hover:bg-blue-700", ring: "focus:ring-blue-200 focus:border-blue-400", thead: "bg-blue-600", theadHover: "hover:bg-blue-700", header: "bg-blue-50 border-blue-200", headerIcon: "text-blue-600", hoverIcon: "hover:text-blue-600" };

  const loadTurnos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(API_URL, getAuthHeaders());
      setTurnos(Array.isArray(res.data) ? res.data : []);
    } catch { setTurnos([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadTurnos(); }, [loadTurnos]);

  const filtered = turnos
    .filter(t => {
      const d = t.fechaApertura ? t.fechaApertura.split("T")[0] : "";
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    })
    .sort((a, b) => {
      const da = new Date(a.fechaApertura).getTime();
      const db = new Date(b.fechaApertura).getTime();
      return sortOrder === "desc" ? db - da : da - db;
    });

  const cerrados = filtered.filter(t => t.estado === "cerrado");
  const totalVentas = cerrados.reduce((s, t) => s + (t.totalVentas || 0), 0);
  const totalGastos = cerrados.reduce((s, t) => s + (t.totalGastos || 0), 0);

  const handleDownloadCSV = () => {
    if (!filtered.length) {
      alert("No hay datos para exportar");
      return;
    }
    const headers = ["ID", "Apertura", "Cierre", "Empleado", "Base", "Ventas", "Gastos", "Saldo en Caja", "Estado"];
    const rows = filtered.map(t => {
      const saldo = (t.montoBase || 0) + (t.totalVentas || 0) - (t.totalGastos || 0);
      return [
        t.id,
        t.fechaApertura ? new Date(t.fechaApertura).toISOString() : "",
        t.fechaCierre ? new Date(t.fechaCierre).toISOString() : "",
        t.usuarioNombre || "",
        t.montoBase || 0,
        t.totalVentas || 0,
        t.totalGastos || 0,
        saldo,
        t.estado ? t.estado.toUpperCase() : "CERRADO"
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,﻿"
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `historico_turnos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (s) => s ? new Date(s).toLocaleDateString("es-CO") : "—";
  const formatTime = (s) => s ? new Date(s).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="h-full flex flex-col gap-4 font-sans text-gray-800 p-4 bg-[#f8fafc]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${theme.icon} p-2.5 rounded-xl`}>
            <History size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Histórico de Turnos</h1>
            <p className="text-xs text-gray-500 mt-0.5">Reportes de cajas con desglose de ingresos</p>
          </div>
        </div>
        <button onClick={handleDownloadCSV} className={`flex items-center gap-1.5 ${theme.button} text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors`}>
          <Download size={15} /> Descargar CSV
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-end bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 text-gray-400 pb-2 md:pb-0">
          <Filter size={16} />
          <span className="text-[10px] font-bold uppercase tracking-wide hidden md:inline">Filtrar por fecha</span>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Desde</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 ${theme.ring}`} />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Hasta</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 ${theme.ring}`} />
        </div>
        <button onClick={() => { setStartDate(""); setEndDate(""); }}
          className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-medium transition-colors w-full md:w-auto">
          Limpiar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Turnos Cerrados", value: cerrados.length, icon: Calendar, bg: "bg-blue-50", color: "text-blue-600", accent: "before:bg-blue-500" },
          { label: "Ingresos Totales", value: fmt(totalVentas), icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600", accent: "before:bg-emerald-500" },
          { label: "Gastos Totales", value: fmt(totalGastos), icon: TrendingDown, bg: "bg-red-50", color: "text-red-600", accent: "before:bg-red-500" },
          { label: "Balance Neto", value: fmt(totalVentas - totalGastos), icon: DollarSign, bg: "bg-indigo-50", color: "text-indigo-600", accent: "before:bg-indigo-500" },
        ].map(({ label, value, icon: IconComponent, bg, color, accent }) => (
          <div key={label} className={`group relative overflow-hidden bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 before:absolute before:inset-x-0 before:top-0 before:h-1 ${accent}`}>
            <div className={`inline-flex p-2.5 rounded-lg mb-2.5 ${bg} ${color} group-hover:scale-110 transition-transform duration-200`}>
              <IconComponent size={18} />
            </div>
            <p className="text-xs text-gray-400">{label}</p>
            <h3 className="text-xl font-semibold text-gray-900 mt-0.5">{value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className={`${theme.thead} text-white sticky top-0 z-10`}>
              <tr>
                {["ID", "Usuario", "Fecha Apertura", "Cierre", "Monto Base", "Ventas", "Gastos", "Saldo", "Estado"].concat(isAdmin ? ["Acciones"] : []).map(h => (
                  h === "Fecha Apertura" ? (
                    <th key={h} className={`py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wide cursor-pointer ${theme.theadHover} transition-colors`}>
                      <button onClick={() => setSortOrder(s => s === "desc" ? "asc" : "desc")} className="flex items-center gap-1">
                        {h} {sortOrder === "desc" ? <ArrowDown size={11} /> : <ArrowUp size={11} />}
                      </button>
                    </th>
                  ) : (
                    <th key={h} className="py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wide">{h}</th>
                  )
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={isAdmin ? 10 : 9} className="py-8 text-center text-gray-400 text-sm">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={isAdmin ? 10 : 9} className="py-8 text-center text-gray-400 text-sm">No hay turnos en el período</td></tr>
              ) : (
                filtered.map((t, idx) => {
                  const saldo = (t.montoBase || 0) + (t.totalVentas || 0) - (t.totalGastos || 0);
                  const activo = t.estado === "activo";
                  return (
                    <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${activo ? "bg-emerald-50/50 border-l-4 border-l-emerald-500" : ""}`}>
                      <td className="py-2 px-3 text-xs font-mono text-gray-500">{idx + 1}</td>
                      <td className="py-2 px-3 text-xs font-semibold text-gray-700">{t.usuarioNombre}</td>
                      <td className="py-2 px-3 text-xs text-gray-600">{formatDate(t.fechaApertura)} {formatTime(t.fechaApertura)}</td>
                      <td className="py-2 px-3 text-xs">
                        {activo ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Abierto
                          </span>
                        ) : formatTime(t.fechaCierre)}
                      </td>
                      <td className="py-2 px-3 text-xs font-semibold text-gray-700">{fmt(t.montoBase)}</td>
                      <td className="py-2 px-3 text-xs font-semibold text-emerald-600">{fmt(t.totalVentas)}</td>
                      <td className="py-2 px-3 text-xs font-semibold text-red-600">{fmt(t.totalGastos)}</td>
                      <td className="py-2 px-3 text-xs font-bold text-indigo-600">{fmt(saldo)}</td>
                      <td className="py-2 px-3 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                          {activo ? "ACTIVO" : "CERRADO"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-2 px-3 text-xs">
                          <div className="flex gap-1.5">
                            <button onClick={() => setSelectedShift(t)}
                              className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors">
                              <Eye size={12} /> Ver
                            </button>
                            {activo && (
                              <button onClick={() => setForceCloseShift(t)}
                                className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors">
                                <Lock size={12} /> Cerrar
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedShift && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedShift(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className={`${theme.header} px-5 py-3 border-b flex justify-between items-center flex-shrink-0`}>
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <FileText size={16} className={theme.headerIcon} /> Detalle del turno — {selectedShift.usuarioNombre}
              </h3>
              <button onClick={() => setSelectedShift(null)} className={`text-gray-400 ${theme.hoverIcon} transition-colors`}>
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Monto Base", value: fmt(selectedShift.montoBase), color: "text-gray-800" },
                  { label: "Total Ventas", value: fmt(selectedShift.totalVentas), color: "text-emerald-600" },
                  { label: "Total Gastos", value: fmt(selectedShift.totalGastos), color: "text-red-600" },
                  { label: "Saldo Esperado", value: fmt((selectedShift.montoBase || 0) + (selectedShift.totalVentas || 0) - (selectedShift.totalGastos || 0)), color: "text-indigo-600" },
                  { label: "Diferencia", value: fmt(selectedShift.diferencia), color: selectedShift.diferencia >= 0 ? "text-emerald-600" : "text-red-600" },
                  { label: "Ventas", value: selectedShift.resumenVentas + " ventas", color: "text-blue-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wide">{label}</p>
                    <p className={`text-base font-bold mt-0.5 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
              {selectedShift.notas && (
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
                  <p className="text-[10px] font-semibold uppercase text-amber-700 tracking-wide">Notas</p>
                  <p className="text-xs text-gray-700 mt-1 whitespace-pre-line">{selectedShift.notas}</p>
                </div>
              )}
            </div>

            <div className={`${theme.header} px-5 py-3 border-t flex justify-end flex-shrink-0`}>
              <button onClick={() => setSelectedShift(null)}
                className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {forceCloseShift && (
        <CloseShiftModal isOpen={!!forceCloseShift} onCancel={() => setForceCloseShift(null)}
          userData={{ userId: forceCloseShift.usuarioId, userName: forceCloseShift.usuarioNombre }}
          turnData={forceCloseShift} isAdminForcedClose={true}
          onShiftClosed={() => { setForceCloseShift(null); loadTurnos(); }} />
      )}
    </div>
  );
};

export default ShiftHistoryReportsPage;