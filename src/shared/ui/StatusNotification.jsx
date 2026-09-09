import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

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

  const { currentUser } = useCurrentUser();
  const isAdmin = (currentUser.rol || "").toLowerCase().trim() === "administrador";

  const getStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: isAdmin ? "bg-emerald-500" : "bg-blue-500",
          icon: <CheckCircle size={20} className="text-white" />,
          title: "¡Éxito!",
        };
      case "error":
        return {
          bg: "bg-red-500",
          icon: <XCircle size={20} className="text-white" />,
          title: "Error",
        };
      case "warning":
        return {
          bg: "bg-amber-500",
          icon: <AlertCircle size={20} className="text-white" />,
          title: "Advertencia",
        };
      default:
        return {
          bg: "bg-blue-500",
          icon: <AlertCircle size={20} className="text-white" />,
          title: "Información",
        };
    }
  };

  const { bg, icon, title } = getStyles();

  return (
    <div className="fixed bottom-5 left-5 animate-in slide-in-from-left duration-300 z-50">
      <div
        className={`${bg} text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 min-w-[240px] max-w-sm border-l-4 border-white/40`}
      >
        <div className="bg-white/20 p-1 rounded-full flex items-center justify-center flex-shrink-0">
          {React.cloneElement(icon, { size: 16 })}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-xs">{title}</p>
          <p className="text-[11px] opacity-95">{message}</p>
        </div>
      </div>
    </div>
  );
};