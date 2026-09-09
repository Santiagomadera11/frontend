import React from "react";

export const ConfirmDialog = ({
  open,
  title = "Confirmar eliminación",
  message = "¿Estás seguro de eliminar este elemento? Esta acción no se puede deshacer.",
  onCancel,
  onConfirm,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  danger = true,
}) => {
  if (!open) return null;
  const headerColor = danger ? "bg-red-100" : "bg-emerald-100";
  const icon = danger ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-0 overflow-hidden">
        {/* colored header estilo ejemplo */}
        <div className={`${headerColor} px-6 py-3 flex items-center gap-2 border-b border-red-200`}> 
          {icon}
          <h2 className="text-base font-bold text-gray-800">{title}</h2>
          <button onClick={onCancel} className="ml-auto text-gray-400 hover:text-red-500 text-xl font-bold px-2">×</button>
        </div>
        <div className="p-6">
          <div className="text-gray-800 text-base mb-2">{message}</div>
          <div className="text-gray-500 text-xs mb-6">Esta acción no se puede deshacer.</div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-100 text-base"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-5 py-2 rounded-lg font-bold text-base text-white ${
                danger
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-primary-500 hover:bg-primary-600"
              } flex items-center gap-2`}
            >
              {danger && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v2H7V5a2 2 0 012-2zm0 0V3m0 0a2 2 0 00-2 2v2h8V5a2 2 0 00-2-2zm0 0V3" />
                </svg>
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

