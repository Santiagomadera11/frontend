import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar, TrendingUp, TrendingDown, DollarSign,
  Eye, Download, ArrowUp, ArrowDown, Lock,
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
  const isAdmin = currentUser?.rol === "Administrador";

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

    const csvContent = "data:text/csv;charset=utf-8," 
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
    <div className="h-full flex flex-col gap-4 font-sans text-gray-800 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Histórico de Turnos</h1>
          <p className="text-xs text-gray-500 mt-0.5">Reportes de cajas con desglose de ingresos</p>
        </div>
        <button onClick={handleDownloadCSV} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
          <Download size={16} /> Descargar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Desde</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Hasta</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none" />
        </div>
        <div className="flex items-end">
          <button onClick={() => { setStartDate(""); setEndDate(""); }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-semibold">
            Limpiar
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Turnos Cerrados", value: cerrados.length, icon: Calendar, color: "text-blue-600" },
          { label: "Ingresos Totales", value: fmt(totalVentas), icon: TrendingUp, color: "text-green-600" },
          { label: "Gastos Totales", value: fmt(totalGastos), icon: TrendingDown, color: "text-red-600" },
          { label: "Balance Neto", value: fmt(totalVentas - totalGastos), icon: DollarSign, color: "text-indigo-600" },
        ].map(({ label, value, icon: IconComponent, color }) => (
          <div key={label} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
              <IconComponent className={color} size={28} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
              <tr>
                {["ID", "Usuario", "Fecha Apertura", "Cierre", "Monto Base", "Ventas", "Gastos", "Saldo", "Estado"].concat(isAdmin ? ["Acciones"] : []).map(h => (
                  h === "Fecha Apertura" ? (
                    <th key={h} className="py-3 px-4 text-xs font-bold text-gray-700 uppercase cursor-pointer hover:bg-gray-100">
                      <button onClick={() => setSortOrder(s => s === "desc" ? "asc" : "desc")} className="flex items-center gap-1 hover:text-blue-600">
                        {h} {sortOrder === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                      </button>
                    </th>
                  ) : (
                    <th key={h} className="py-3 px-4 text-xs font-bold text-gray-700 uppercase">{h}</th>
                  )
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin ? 10 : 9} className="py-8 text-center text-gray-400">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={isAdmin ? 10 : 9} className="py-6 text-center text-gray-500 text-sm">No hay turnos en el período</td></tr>
              ) : (
                filtered.map(t => {
                  const saldo = (t.montoBase || 0) + (t.totalVentas || 0) - (t.totalGastos || 0);
                  const activo = t.estado === "activo";
                  return (
                    <tr key={t.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${activo ? "bg-green-50 border-l-4 border-l-green-500" : ""}`}>
                      <td className="py-3 px-4 text-xs font-mono text-gray-600">{t.id}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-gray-700">{t.usuarioNombre}</td>
                      <td className="py-3 px-4 text-xs text-gray-600">{formatDate(t.fechaApertura)} {formatTime(t.fechaApertura)}</td>
                      <td className="py-3 px-4 text-xs">
                        {activo ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Abierto
                          </span>
                        ) : formatTime(t.fechaCierre)}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-gray-700">{fmt(t.montoBase)}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-green-600">{fmt(t.totalVentas)}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-red-600">{fmt(t.totalGastos)}</td>
                      <td className="py-3 px-4 text-xs font-bold text-indigo-600">{fmt(saldo)}</td>
                      <td className="py-3 px-4 text-xs">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                          {activo ? "ACTIVO" : "CERRADO"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-xs flex gap-2">
                          <button onClick={() => setSelectedShift(t)}
                            className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                            <Eye size={12} /> Ver
                          </button>
                          {activo && (
                            <button onClick={() => setForceCloseShift(t)}
                              className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                              <Lock size={12} /> Cerrar
                            </button>
                          )}
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

      {/* Modal detalle */}
      {selectedShift && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Detalle — {selectedShift.usuarioNombre}</h2>
              <button onClick={() => setSelectedShift(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              {[
                { label: "Monto Base", value: fmt(selectedShift.montoBase), color: "text-gray-800" },
                { label: "Total Ventas", value: fmt(selectedShift.totalVentas), color: "text-green-600" },
                { label: "Total Gastos", value: fmt(selectedShift.totalGastos), color: "text-red-600" },
                { label: "Saldo Esperado", value: fmt((selectedShift.montoBase || 0) + (selectedShift.totalVentas || 0) - (selectedShift.totalGastos || 0)), color: "text-indigo-600" },
                { label: "Diferencia", value: fmt(selectedShift.diferencia), color: selectedShift.diferencia >= 0 ? "text-green-600" : "text-red-600" },
                { label: "Ventas", value: selectedShift.resumenVentas + " ventas", color: "text-blue-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            {selectedShift.notas && (
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mb-4">
                <p className="text-xs font-bold text-amber-700">Notas:</p>
                <p className="text-xs text-gray-700 mt-1">{selectedShift.notas}</p>
              </div>
            )}
            <button onClick={() => setSelectedShift(null)}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold">
              Cerrar
            </button>
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