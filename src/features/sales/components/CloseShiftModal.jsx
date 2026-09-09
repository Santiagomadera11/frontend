import React, { useState, useEffect } from "react";
import { AlertCircle, DollarSign, TrendingUp, TrendingDown, X } from "lucide-react";
import { turnService } from "../services/turnService";

export const CloseShiftModal = ({
  isOpen,
  onShiftClosed,
  onCancel,
  user,
  userData,
  turnData,
  isAdminForcedClose = false,
}) => {
  const [efectivoFisico, setEfectivoFisico] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState({
    montoBase: 0, totalVentas: 0, totalGastos: 0, saldoEsperado: 0,
  });

  useEffect(() => {
    if (!isOpen) return;
    setEfectivoFisico("");
    setError("");

    if (isAdminForcedClose && turnData) {
      setBalance({
        montoBase: turnData.montoBase || 0,
        totalVentas: turnData.totalVentas || 0,
        totalGastos: turnData.totalGastos || 0,
        saldoEsperado: (turnData.montoBase || 0) + (turnData.totalVentas || 0) - (turnData.totalGastos || 0),
      });
      setNotas("Cerrado por el Administrador");
    } else {
      // Cargar balance desde backend
      turnService.calculateExpectedBalance().then(b => setBalance(b)).catch(() => {});
      setNotas("");
    }
  }, [isOpen, isAdminForcedClose, turnData]);

  const handleCloseTurn = async (e) => {
    e.preventDefault();
    setError("");

    if (!efectivoFisico) { setError("Ingresa el efectivo físico en caja"); return; }
    const amount = parseFloat(efectivoFisico);
    if (isNaN(amount) || amount < 0) { setError("Ingresa un monto válido"); return; }

    try {
      setLoading(true);
      const diferencia = amount - balance.saldoEsperado;
      let finalNotas = notas || "";
      if (isAdminForcedClose && !finalNotas.includes("Cerrado por el Administrador"))
        finalNotas = "Cerrado por el Administrador";

      const closedTurn = await turnService.closeTurn({
        montoFinal: amount,
        diferencia,
        notas: finalNotas,
      });

      setEfectivoFisico("");
      setNotas("");
      setError("");
      if (onShiftClosed) onShiftClosed({ ...closedTurn, diferencia });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Error al cerrar turno");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const diferencia = parseFloat(efectivoFisico || 0) - balance.saldoEsperado;
  const diferenciaBuena = diferencia === 0;
  const diferenciaNegativa = diferencia < 0;

  const fmtNum = (v) => Number(v || 0).toLocaleString("es-CO");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-md w-full mx-2 border border-gray-200 max-h-[80vh] overflow-auto no-scrollbar">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`${isAdminForcedClose ? "bg-orange-100" : "bg-red-100"} p-3 rounded-lg`}>
              <DollarSign className={isAdminForcedClose ? "text-orange-600" : "text-red-600"} size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{isAdminForcedClose ? "Cierre Forzado" : "Cerrar Turno"}</h2>
              <p className="text-xs text-gray-500">{isAdminForcedClose ? "Cierre por Administrador" : "Liquidación de caja"}</p>
            </div>
          </div>
          <button onClick={() => { setEfectivoFisico(""); setNotas(""); setError(""); if (onCancel) onCancel(); }}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        {/* Info usuario */}
        <div className={`${isAdminForcedClose ? "bg-orange-50 border-orange-200" : "bg-gray-50"} p-4 rounded-lg mb-6 border border-gray-100`}>
          <p className="text-xs text-gray-600 font-medium mb-1">{isAdminForcedClose ? "Cerrando caja de" : "Usuario"}</p>
          <p className="text-sm font-bold text-gray-800">{userData?.userName || user?.nombre || "Usuario"}</p>
          <p className="text-xs text-gray-500">Hora: {new Date().toLocaleTimeString()}</p>
        </div>

        {/* Resumen */}
        <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-1.5"><DollarSign size={16} className="text-blue-600" /> Monto Base</span>
            <span className="font-bold text-gray-900">${fmtNum(balance.montoBase)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-1.5"><TrendingUp size={16} className="text-green-600" /> Ventas Totales</span>
            <span className="font-bold text-green-600">+${fmtNum(balance.totalVentas)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-1.5"><TrendingDown size={16} className="text-amber-600" /> Gastos Totales</span>
            <span className="font-bold text-amber-600">-${fmtNum(balance.totalGastos)}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-semibold text-gray-700">Saldo Esperado</span>
            <span className="font-bold text-lg text-gray-900">${fmtNum(balance.saldoEsperado)}</span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleCloseTurn} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Efectivo Físico en Caja</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
              <input type="number" value={efectivoFisico} onChange={e => setEfectivoFisico(e.target.value)}
                placeholder="0" step="0.01" min="0"
                className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-400 focus:bg-white text-gray-900 font-semibold"
                disabled={loading} />
            </div>
          </div>

          {efectivoFisico && (
            <div className={`p-4 rounded-lg border-2 flex items-start gap-3 ${
              diferenciaBuena ? "bg-green-50 border-green-200" : diferenciaNegativa ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
            }`}>
              <AlertCircle size={18} className={`flex-shrink-0 mt-0.5 ${diferenciaBuena ? "text-green-600" : diferenciaNegativa ? "text-red-600" : "text-yellow-600"}`} />
              <div>
                <p className={`text-xs font-bold ${diferenciaBuena ? "text-green-800" : diferenciaNegativa ? "text-red-800" : "text-yellow-800"}`}>
                  {diferenciaBuena ? "✓ Caja Cuadrada" : `Diferencia de ${diferenciaNegativa ? "falta" : "sobrante"}: $${fmtNum(Math.abs(diferencia))}`}
                </p>
                <p className={`text-[10px] ${diferenciaBuena ? "text-green-700" : diferenciaNegativa ? "text-red-700" : "text-yellow-700"}`}>
                  Esperado: ${fmtNum(balance.saldoEsperado)} | Físico: ${fmtNum(parseFloat(efectivoFisico || 0))}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notas (Opcional)</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)}
              placeholder="Ej: Hubo un cliente con cambio..."
              rows="2"
              className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-400 text-gray-900 text-sm resize-none"
              disabled={loading} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className={`w-full py-2.5 rounded-lg font-bold text-white transition-all ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 active:scale-95"
            }`}>
            {loading ? "Cerrando turno..." : "Cerrar Turno"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">📌 El cierre será guardado en el historial.</p>
        </div>
      </div>
    </div>
  );
};