import React, { useEffect } from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

const STYLES = {
  success: { icon: CheckCircle, iconColor: "text-emerald-500", border: "border-emerald-200" },
  error: { icon: AlertCircle, iconColor: "text-red-500", border: "border-red-200" },
  warning: { icon: AlertTriangle, iconColor: "text-amber-500", border: "border-amber-200" },
  info: { icon: Info, iconColor: "text-blue-500", border: "border-blue-200" },
};

export const ToastNotification = ({
  message,
  onClose,
  type = "success",
  zIndex = 50,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const { icon: Icon, iconColor, border } = STYLES[type] || STYLES.success;

  return (
    <div style={{ zIndex }} className="fixed bottom-4 left-4 max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className={`bg-white rounded-lg shadow-lg p-4 flex items-start gap-3 border ${border}`}>
        <Icon size={18} className={`${iconColor} flex-shrink-0 mt-0.5`} />
        <p className="text-xs font-bold text-gray-800">{message}</p>
      </div>
    </div>
  );
};

export default ToastNotification;
