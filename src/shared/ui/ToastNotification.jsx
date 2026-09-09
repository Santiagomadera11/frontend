import React, { useEffect } from "react";
import { CheckCircle, X, XCircle } from "lucide-react";

export const ToastNotification = ({
  message,
  onClose,
  type = "success",
  zIndex = 50,
  title,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === "error";
  const bg = isError ? "bg-red-500" : "bg-[#34D399]";
  const icon = isError ? (
    <XCircle size={20} className="text-white" />
  ) : (
    <CheckCircle size={20} className="text-white" />
  );
  const header = title || (isError ? "Error" : "¡Éxito!");

  return (
    <div
      style={{ zIndex }}
      className="fixed bottom-5 left-5 animate-bounce-in-right"
    >
      <div
        className={`${bg} text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-3 min-w-[220px] max-w-xs border-l-4 border-white/30`}
      >
        <div className="bg-white/15 p-1 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{header}</p>
          <p className="text-[12px] opacity-95">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
