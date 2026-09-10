import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import ClientSidebar from "./Sidebar/ClientSidebar";
import { ClientHeader } from "./Header/ClientHeader";
import { authService } from "../features/auth/authService";
import { ConfirmDialog } from "../shared/ui/ConfirmDialog";

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
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans text-sm flex-col lg:flex-row">
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
        fixed lg:static inset-y-0 left-0 z-50 w-60 h-screen
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
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
        <ConfirmDialog
          open={showConfirmLogout}
          title="¿Cerrar sesión?"
          message="¿Estás seguro de que quieres cerrar sesión?"
          subMessage="Serás redirigido a la página principal."
          confirmText="Salir"
          danger
          onCancel={() => setShowConfirmLogout(false)}
          onConfirm={handleConfirmLogout}
        />
      )}
    </div>
  );
};

export default ClientLayout;
