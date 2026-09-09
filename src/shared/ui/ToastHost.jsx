import React, { useEffect, useState, useCallback } from "react";
import { ToastNotification } from "./ToastNotification";

export const ToastHost = () => {
  const [toast, setToast] = useState(null);

  const handleEvent = useCallback((e) => {
    const detail = e?.detail || {};
    const message = detail.message || detail;
    const type = detail.type || "success";
    const title = detail.title;
    setToast({ message, type, title });
  }, []);

  useEffect(() => {
    window.addEventListener("app:toast", handleEvent);
    return () => window.removeEventListener("app:toast", handleEvent);
  }, [handleEvent]);

  if (!toast) return null;

  return (
    <ToastNotification
      message={toast.message}
      type={toast.type}
      title={toast.title}
      onClose={() => setToast(null)}
    />
  );
};

export default ToastHost;
