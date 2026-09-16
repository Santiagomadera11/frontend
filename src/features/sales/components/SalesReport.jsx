// src/features/sales/components/SalesReport.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Download, Calendar, Filter, 
  TrendingUp, DollarSign, Package, Users 
} from "lucide-react";
import { salesService } from "../services/salesService";
import { ToastNotification } from "../../../shared/ui/ToastNotification";

export const SalesReport = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const data = await salesService.getAll();
      setSales(Array.isArray(data) ? data : []);
    } catch {
      setNotification({ message: "Error cargando ventas", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (!s.fechaVenta) return false;
      const saleDate = new Date(s.fechaVenta);
      if (startDate && saleDate < new Date(startDate)) return false;
      if (endDate && saleDate > new Date(endDate + "T23:59:59")) return false;
      return true;
    });
  }, [sales, startDate, endDate]);

  // Las ventas anuladas (estadoId 3) siguen en la lista para que se vean en la tabla,
  // pero no deben contar como ingreso real: antes se sumaban igual que cualquier venta
  // válida, inflando Total/Subtotal/IVA/Transacciones/Items con dinero que en realidad
  // se revirtió.
  const validSales = useMemo(() => filteredSales.filter(s => s.estadoId !== 3), [filteredSales]);

  const stats = useMemo(() => {
    const total = validSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const subtotal = validSales.reduce((sum, s) => sum + (s.subtotal || 0), 0);
    const iva = validSales.reduce((sum, s) => sum + (s.iva || 0), 0);
    const count = validSales.length;
    const items = validSales.reduce((sum, s) =>
      sum + (s.detalles || []).reduce((a, d) => a + d.cantidad, 0), 0);

    return { total, subtotal, iva, count, items };
  }, [validSales]);

  const fmt = (v) => new Intl.NumberFormat("es-CO", { 
    style: "currency", currency: "COP", maximumFractionDigits: 0 
  }).format(v || 0);

  const exportCSV = () => {
    const csv = "data:text/csv;charset=utf-8," +
      "Fecha,Numero,Cliente,Documento,Subtotal,IVA,Total,MetodoPago,Items,Estado\n" +
      filteredSales.map(s => {
        const items = (s.detalles || []).reduce((a, d) => a + d.cantidad, 0);
        return `${new Date(s.fechaVenta).toLocaleDateString()},${s.numeroVenta || s.id},${s.clienteNombre},${s.clienteDocumento || ""},${s.subtotal || 0},${s.iva || 0},${s.total || 0},${s.metodoPagoNombre || ""},${items},${s.estadoNombre || ""}`;
      }).join("\n");
    
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col gap-4 font-sans p-4 bg-[#f8fafc]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">Reporte de Ventas</h1>
            <p className="text-xs text-gray-500">Análisis y estadísticas de ventas</p>
          </div>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700">
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Total Ventas</span>
          </div>
          <p className="text-xl font-black text-gray-900">{fmt(stats.total)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-blue-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Subtotal</span>
          </div>
          <p className="text-xl font-black text-gray-900">{fmt(stats.subtotal)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-purple-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">IVA</span>
          </div>
          <p className="text-xl font-black text-gray-900">{fmt(stats.iva)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-orange-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Transacciones</span>
          </div>
          <p className="text-xl font-black text-gray-900">{stats.count}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-pink-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Items Vendidos</span>
          </div>
          <p className="text-xl font-black text-gray-900">{stats.items}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center bg-white p-3 rounded-xl border border-gray-100">
        <Calendar size={16} className="text-gray-400" />
        <div className="flex gap-2 items-center">
          <label className="text-xs font-bold text-gray-500">Desde:</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none"
          />
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-xs font-bold text-gray-500">Hasta:</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none"
          />
        </div>
        {(startDate || endDate) && (
          <button 
            onClick={() => { setStartDate(""); setEndDate(""); }}
            className="text-xs text-red-500 font-bold hover:text-red-700"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Fecha", "Número", "Cliente", "Items", "Subtotal", "IVA", "Total", "Método Pago", "Estado"].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : filteredSales.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">No hay ventas en el período seleccionado</td></tr>
              ) : (
                filteredSales.map(sale => {
                  const items = (sale.detalles || []).reduce((a, d) => a + d.cantidad, 0) +
                    (sale.servicios || []).reduce((a, s) => a + s.cantidad, 0);
                  const anulada = sale.estadoId === 3;
                  return (
                    <tr key={sale.id} className={`hover:bg-gray-50 ${anulada ? "opacity-50" : ""}`}>
                      <td className={`px-4 py-3 text-xs text-gray-600 ${anulada ? "line-through" : ""}`}>
                        {new Date(sale.fechaVenta).toLocaleDateString()}
                      </td>
                      <td className={`px-4 py-3 text-xs font-mono font-bold text-gray-700 ${anulada ? "line-through" : ""}`}>
                        {sale.numeroVenta || sale.id}
                      </td>
                      <td className={`px-4 py-3 text-xs font-medium text-gray-800 ${anulada ? "line-through" : ""}`}>
                        {sale.clienteNombre || "C. Final"}
                      </td>
                      <td className="px-4 py-3 text-xs text-center">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {items}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-xs text-right font-semibold text-gray-600 ${anulada ? "line-through" : ""}`}>
                        {fmt(sale.subtotal)}
                      </td>
                      <td className={`px-4 py-3 text-xs text-right font-semibold text-gray-600 ${anulada ? "line-through" : ""}`}>
                        {fmt(sale.iva)}
                      </td>
                      <td className={`px-4 py-3 text-xs text-right font-black ${anulada ? "text-gray-400 line-through" : "text-emerald-600"}`}>
                        {fmt(sale.total)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {sale.metodoPagoNombre || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {anulada ? (
                          <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold">Anulada</span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">{sale.estadoNombre || "Completada"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {notification && (
        <ToastNotification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
};

export default SalesReport;
