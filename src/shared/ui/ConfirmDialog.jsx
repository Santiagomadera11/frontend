import React from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";

export const ConfirmDialog = ({
  open,
  title = "Confirmar",
  message = "¿Estás seguro de realizar esta acción?",
  subMessage = "Esta acción no se puede deshacer.",
  onCancel,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = true,
  confirmDisabled = false,
  children,
}) => {
  if (!open) return null;

  const tint = danger ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200";
  const Icon = danger ? AlertCircle : CheckCircle;
  const iconColor = danger ? "text-red-600" : "text-emerald-600";
  const confirmBtn = danger ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className={`px-5 py-3 border-b flex justify-between items-center ${tint}`}>
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Icon size={18} className={iconColor} />
            {title}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-sm text-gray-700">{message}</p>
          {subMessage && <p className="text-xs text-gray-500 mt-2">{subMessage}</p>}
          {children}
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t flex justify-end gap-2 ${tint}`}>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`px-4 py-2 text-xs font-bold text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
