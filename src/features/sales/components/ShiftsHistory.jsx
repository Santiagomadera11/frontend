import React, { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { turnService } from "../services/turnService";

/**
 * ShiftsHistory - Modal/Componente para ver auditoría de turnos
 * Muestra tabla con turnos del día y detalle de movimientos por empleado
 */
export const ShiftsHistory = ({ isOpen, onClose }) => {
  const [expandedShiftId, setExpandedShiftId] = useState(null);

  if (!isOpen) return null;

  // Obtener turnos del historial (turnos cerrados del día)
  const turnsHistory = turnService.getTurnsHistory() || [];

  // Filtrar turnos de hoy (en caso de que haya histórico de días anteriores)
  const today = new Date().toLocaleDateString();
  const turnsToday = turnsHistory.filter((turn) => {
    const turnDate = new Date(turn.horaCierre).toLocaleDateString();
    return turnDate === today;
  });

  const handleExpandShift = (shiftId) => {
    setExpandedShiftId(expandedShiftId === shiftId ? null : shiftId);
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        {/* Modal */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-6xl w-full mx-4 border border-gray-200 max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Auditoría de Turnos
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Turnos cerrados del día ({turnsToday.length} turnos)
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              title="Cerrar"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabla de Turnos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-green-600 text-white uppercase sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 font-semibold">Turno ID</th>
                  <th className="px-4 py-3 font-semibold">Empleado</th>
                  <th className="px-4 py-3 font-semibold">Hora Inicio</th>
                  <th className="px-4 py-3 font-semibold">Hora Fin</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Monto Base
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">Ventas</th>
                  <th className="px-4 py-3 font-semibold text-right">Gastos</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Diferencia
                  </th>
                  <th className="px-4 py-3 font-semibold text-center">
                    Estado
                  </th>
                  <th className="px-4 py-3 font-semibold text-center">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {turnsToday.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      No hay turnos cerrados para hoy
                    </td>
                  </tr>
                ) : (
                  turnsToday.map((turn) => (
                    <React.Fragment key={turn.turnId}>
                      {/* Fila principal del turno */}
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-gray-700">
                          {turn.turnId.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {turn.userName || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(turn.horaApertura).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(turn.horaCierre).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 font-bold text-blue-600 text-right">
                          ${turn.montoBase.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-bold text-green-600 text-right">
                          +${turn.totalVentas.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-bold text-orange-600 text-right">
                          -${turn.totalGastos.toLocaleString()}
                        </td>
                        <td
                          className={`px-4 py-3 font-bold text-right ${
                            turn.diferencia === 0
                              ? "text-green-600"
                              : turn.diferencia > 0
                                ? "text-blue-600"
                                : "text-red-600"
                          }`}
                        >
                          {turn.diferencia === 0 ? "✓ " : ""}$
                          {turn.diferencia.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">
                            CERRADO
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleExpandShift(turn.turnId)}
                            className={`p-1.5 rounded transition-colors ${
                              expandedShiftId === turn.turnId
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600"
                            }`}
                            title={
                              expandedShiftId === turn.turnId
                                ? "Contraer detalle"
                                : "Ver detalle"
                            }
                          >
                            {expandedShiftId === turn.turnId ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Fila de detalle expandible */}
                      {expandedShiftId === turn.turnId && (
                        <tr>
                          <td colSpan="10" className="px-4 py-4 bg-blue-50">
                            <div className="space-y-4">
                              {/* Detalles de Movimientos */}
                              <div className="grid grid-cols-2 gap-4">
                                {/* Ventas del turno */}
                                <div>
                                  <h4 className="font-bold text-sm text-gray-800 mb-2 flex items-center gap-2">
                                    📊 Ventas Registradas
                                  </h4>
                                  <div className="bg-white rounded p-3 border border-green-200 space-y-1 max-h-40 overflow-y-auto">
                                    {turn.userSalesCount &&
                                    turn.userSalesCount > 0 ? (
                                      <div>
                                        <p className="text-xs text-gray-600">
                                          <span className="font-bold text-green-600">
                                            {turn.userSalesCount}
                                          </span>{" "}
                                          transacciones
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          Monto Total:{" "}
                                          <span className="font-bold text-green-600">
                                            ${turn.totalVentas.toLocaleString()}
                                          </span>
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                          Promedio por venta: $
                                          {turn.userSalesCount > 0
                                            ? (
                                                turn.totalVentas /
                                                turn.userSalesCount
                                              ).toLocaleString()
                                            : 0}
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-500 italic">
                                        No hay ventas registradas
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Gastos del turno */}
                                <div>
                                  <h4 className="font-bold text-sm text-gray-800 mb-2 flex items-center gap-2">
                                    📉 Gastos Registrados
                                  </h4>
                                  <div className="bg-white rounded p-3 border border-orange-200 space-y-1 max-h-40 overflow-y-auto">
                                    {turn.userExpensesCount &&
                                    turn.userExpensesCount > 0 ? (
                                      <div>
                                        <p className="text-xs text-gray-600">
                                          <span className="font-bold text-orange-600">
                                            {turn.userExpensesCount}
                                          </span>{" "}
                                          gastos
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          Monto Total:{" "}
                                          <span className="font-bold text-orange-600">
                                            ${turn.totalGastos.toLocaleString()}
                                          </span>
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                          Promedio por gasto: $
                                          {turn.userExpensesCount > 0
                                            ? (
                                                turn.totalGastos /
                                                turn.userExpensesCount
                                              ).toLocaleString()
                                            : 0}
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-500 italic">
                                        No hay gastos registrados
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Resumen de Liquidación */}
                              <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                                <h5 className="font-bold text-sm text-gray-800 mb-2">
                                  📋 Resumen de Liquidación
                                </h5>
                                <div className="grid grid-cols-4 gap-2 text-xs">
                                  <div>
                                    <p className="text-gray-600">Monto Base</p>
                                    <p className="font-bold text-blue-600">
                                      ${turn.montoBase.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">+ Ventas</p>
                                    <p className="font-bold text-green-600">
                                      ${turn.totalVentas.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">- Gastos</p>
                                    <p className="font-bold text-orange-600">
                                      ${turn.totalGastos.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Diferencia</p>
                                    <p
                                      className={`font-bold ${
                                        turn.diferencia === 0
                                          ? "text-green-600"
                                          : turn.diferencia > 0
                                            ? "text-blue-600"
                                            : "text-red-600"
                                      }`}
                                    >
                                      ${turn.diferencia.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                {turn.notas && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded border-l-2 border-gray-400">
                                    <p className="text-[10px] font-bold text-gray-700">
                                      Notas:
                                    </p>
                                    <p className="text-[10px] text-gray-600 mt-0.5">
                                      {turn.notas}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer con resumen global */}
          {turnsToday.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Total Turnos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {turnsToday.length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Ventas Totales</p>
                  <p className="text-2xl font-bold text-green-600">
                    $
                    {turnsToday
                      .reduce((sum, t) => sum + (t.totalVentas || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Gastos Totales</p>
                  <p className="text-2xl font-bold text-orange-600">
                    $
                    {turnsToday
                      .reduce((sum, t) => sum + (t.totalGastos || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Diferencia Total</p>
                  <p
                    className={`text-2xl font-bold ${
                      turnsToday.reduce(
                        (sum, t) => sum + (t.diferencia || 0),
                        0,
                      ) === 0
                        ? "text-green-600"
                        : turnsToday.reduce(
                              (sum, t) => sum + (t.diferencia || 0),
                              0,
                            ) > 0
                          ? "text-blue-600"
                          : "text-red-600"
                    }`}
                  >
                    $
                    {turnsToday
                      .reduce((sum, t) => sum + (t.diferencia || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Resultado Neto</p>
                  <p className="text-2xl font-bold text-blue-600">
                    $
                    {(
                      turnsToday.reduce(
                        (sum, t) => sum + (t.totalVentas || 0),
                        0,
                      ) -
                      turnsToday.reduce(
                        (sum, t) => sum + (t.totalGastos || 0),
                        0,
                      )
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ShiftsHistory;
