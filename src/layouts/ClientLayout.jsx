import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AlertCircle, X } from "lucide-react";
import ClientSidebar from "./Sidebar/ClientSidebar";
import { ClientHeader } from "./Header/ClientHeader";
import { authService } from "../features/auth/authService";

const ClientLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const navigate = useNavigate();

  const handleConfirmLogout = () => {
    authService.logout();
    setShowConfirmLogout(false);
    navigate("/");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans text-sm flex-col lg:flex-row-reverse">
      {/* Overlay para móvil */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar responsivo */}
      <div
        className={`
        fixed lg:static inset-y-0 right-0 z-50 w-60 h-screen
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        lg:z-10 lg:translate-x-0
      `}
      >
        <ClientSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onShowLogoutModal={() => setShowConfirmLogout(true)}
        />
      </div>

      <div className="flex flex-col flex-1 h-full w-full min-w-0">
        <ClientHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 overflow-hidden relative px-2 sm:px-4 py-2 sm:py-4">
          <div className="h-full w-full bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-y-auto no-scrollbar p-3 sm:p-5">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Modal de Logout - Renderizado a nivel de Layout */}
      {showConfirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="bg-red-50 px-5 py-3 border-b border-red-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <AlertCircle size={18} className="text-red-600" />
                ¿Cerrar sesión?
              </h3>
              <button
                onClick={() => setShowConfirmLogout(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              <p className="text-sm text-gray-700">
                ¿Estás seguro de que quieres cerrar sesión?
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Serás redirigido a la página principal.
              </p>
            </div>

            {/* Footer */}
            <div className="bg-red-50 px-5 py-3 border-t border-red-200 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmLogout(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-sm"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientLayout;
