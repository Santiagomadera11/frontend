import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { expensesService } from "../services/expensesService";
import { ToastNotification } from "../../../shared/ui/ToastNotification";

export const ExpensesModal = ({ isOpen, onClose }) => {
  const { currentUser } = useCurrentUser();
  const user = currentUser || {};
  const [expenses, setExpenses] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadExpenses();
    }
  }, [isOpen]);

  const loadExpenses = async () => {
    if (!user.id) return;
    try {
      const todayExpenses = await expensesService.getTodayExpenses(user.id);
      setExpenses(Array.isArray(todayExpenses) ? todayExpenses : []);
    } catch (error) {
      console.error("Error cargando gastos:", error);
      setExpenses([]);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("¿Anular este gasto?")) {
      try {
        await expensesService.delete(id);
        await loadExpenses();
        setToast({ message: "Gasto anulado", type: "success", zIndex: 70 });
      } catch (error) {
        console.error("Error anulando gasto:", error);
        setToast({ message: "Error al anular gasto", type: "error", zIndex: 70 });
      }
    }
  };

  const total = expenses.reduce((sum, e) => sum + (e.monto || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-50 to-red-50">
          <h2 className="text-lg font-bold text-gray-800">Gastos del día</h2>
          <button onClick={onClose} className="text-gray-500 p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-auto">
          {expenses.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              No hay gastos registrados
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-800">
                      {exp.descripcion}
                    </div>
                    <div className="text-xs text-gray-500">
                      {exp.hora} • {exp.categoria}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-orange-600">
                      ${exp.monto.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded border border-red-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4 bg-gray-50 text-right">
          <div className="text-xs text-gray-500">Total gastos:</div>
          <div className="text-2xl font-bold text-orange-600">
            ${total.toLocaleString()}
          </div>
        </div>

        {toast && (
          <ToastNotification
            message={toast.message}
            type={toast.type}
            zIndex={70}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ExpensesModal;
