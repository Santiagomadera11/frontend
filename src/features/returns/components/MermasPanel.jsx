import React, { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { returnService } from "../services/returnService";

const fmt = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
    v || 0
  );

export const MermasPanel = ({ colorClass = "emerald" }) => {
  const [mermas, setMermas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMermas = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await returnService.getMermas();
      setMermas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo cargar el reporte de mermas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMermas();
  }, []);

  const totalUnidades = mermas.reduce((sum, m) => sum + m.cantidadPerdida, 0);
  const totalValor = mermas.reduce((sum, m) => sum + m.valorPerdida, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div
          className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
            colorClass === "emerald" ? "border-emerald-600" : "border-blue-600"
          }`}
        ></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-xs font-medium text-gray-500 mb-1">Unidades perdidas</div>
          <div className="text-2xl font-black text-gray-900">{totalUnidades}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-xs font-medium text-gray-500 mb-1">Valor total perdido</div>
          <div className="text-2xl font-black text-red-600">{fmt(totalValor)}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            Productos dañados / vencidos que no reingresaron al inventario
          </h3>
          <button
            onClick={fetchMermas}
            className="text-gray-400 hover:text-gray-600"
            title="Actualizar"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</div>
        )}

        {mermas.length === 0 && !error ? (
          <div className="p-8 text-center">
            <AlertTriangle size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No hay mermas registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">N° Venta</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Producto</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Cant.</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Valor perdido</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Motivo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Gestionó</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mermas.map((m) => (
                  <tr key={m.detalleDevolucionId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {m.fechaGestion ? new Date(m.fechaGestion).toLocaleDateString("es-CO") : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.numeroVenta}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{m.productoNombre}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">{m.cantidadPerdida}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                      {fmt(m.valorPerdida)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{m.motivo}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.usuarioGestionNombre || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
