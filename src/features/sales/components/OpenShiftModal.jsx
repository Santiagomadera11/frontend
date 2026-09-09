import React, { useState } from "react";
import { AlertCircle, DollarSign, X } from "lucide-react";
import { turnService } from "../services/turnService";

export const OpenShiftModal = ({
  isOpen,
  onShiftOpened,
  user,
  canClose = false,
  onCancel = null,
}) => {
  const [montoBase, setMontoBase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleOpenShift = async (e) => {
    e.preventDefault();
    setError("");

    if (!user?.id) { setError("Usuario no identificado. Por favor recarga la página e inicia sesión nuevamente."); return; }
    if (!montoBase || montoBase === "") { setError("El monto base es obligatorio"); return; }
    const amount = parseFloat(montoBase);
    if (isNaN(amount) || amount < 0) { setError("Ingresa un monto válido (número positivo)"); return; }

    try {
      setLoading(true);
      const userData = { userId: user.id, userName: user?.nombre || "Usuario" };
      const newTurn = await turnService.openTurn(userData, amount);
      setMontoBase("");
      setError("");
      if (onShiftOpened) onShiftOpened(newTurn);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Error al abrir turno");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-200 relative">
        {canClose && (
          <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg">
            <DollarSign className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Abrir Caja</h2>
            <p className="text-xs text-gray-500">Inicia tu turno de hoy</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
          <p className="text-xs text-gray-600 font-medium mb-1">Usuario</p>
          <p className="text-sm font-bold text-gray-800">{user?.nombre || "Usuario"}</p>
          <p className="text-xs text-gray-500">Hora: {new Date().toLocaleTimeString()}</p>
        </div>

        <form onSubmit={handleOpenShift} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Monto Base (Dinero Inicial)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
              <input type="number" value={montoBase} onChange={e => setMontoBase(e.target.value)}
                placeholder="0" step="0.01" min="0"
                className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:bg-white text-gray-900 font-semibold"
                disabled={loading} />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">Ingresa el dinero inicial para dar vueltas</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 flex gap-2">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-blue-800">
              <strong>Nota:</strong> No podrás realizar ventas sin tener un turno activo.
            </p>
          </div>

          <button type="submit" disabled={loading}
            className={`w-full py-2.5 rounded-lg font-bold text-white transition-all ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"
            }`}>
            {loading ? "Abriendo caja..." : "Abrir Caja"}
          </button>

          {canClose && (
            <button type="button" onClick={onCancel}
              className="w-full mt-2 py-2.5 rounded-lg font-bold text-gray-700 bg-gray-200 hover:bg-gray-300">
              Cancelar
            </button>
          )}
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">📌 Este modal es obligatorio para iniciar el día</p>
        </div>
      </div>
    </div>
  );
};