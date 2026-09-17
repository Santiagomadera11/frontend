import React, { useEffect } from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

const STYLES = {
  success: { icon: CheckCircle, iconColor: "text-emerald-500", border: "border-emerald-200" },
  error: { icon: AlertCircle, iconColor: "text-red-500", border: "border-red-200" },
  warning: { icon: AlertTriangle, iconColor: "text-amber-500", border: "border-amber-200" },
  info: { icon: Info, iconColor: "text-blue-500", border: "border-blue-200" },
};

export const StatusNotification = ({
  message,
  onClose,
  type = "success",
  duration = 3000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const { icon: Icon, iconColor, border } = STYLES[type] || STYLES.success;

  return (
    <div className="fixed bottom-4 right-4 max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300 z-50">
      <div className={`bg-white rounded-lg shadow-lg p-4 flex items-start gap-3 border ${border}`}>
        <Icon size={18} className={`${iconColor} flex-shrink-0 mt-0.5`} />
        <p className="text-xs font-bold text-gray-800">{message}</p>
      </div>
    </div>
  );
};

export default StatusNotification;
