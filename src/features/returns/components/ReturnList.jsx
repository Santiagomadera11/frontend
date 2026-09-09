import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useMemo, useState } from "react";
import { Search, Plus, Eye, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { ReturnDetailModal } from "./ReturnDetailModal";
import { ReturnForm } from "./ReturnForm";

const ESTADO_CONFIG = {
  1: { label: "Pendiente", bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  2: { label: "Aprobada", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  3: { label: "Rechazada", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

const fmt = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
    v || 0
  );

export const ReturnList = ({ devoluciones = [], loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const itemsPerPage = 5;

  // Validar permisos
  const { currentUser } = useCurrentUser();
  const user = currentUser || {};
  const userRole = (user.rol || "").toLowerCase().trim();
  const userPerms = (user.permisos || []).map((perm) => String(perm || "").toLowerCase().trim());
  const canCreateReturn = userRole === "administrador" || userPerms.includes("sales.create") || userPerms.includes("sales.return");
  const canViewReturns = userRole === "administrador" || userPerms.includes("sales.view") || userPerms.includes("sales.return");
  const colorClass = userRole === "administrador" ? "emerald" : "blue";

  const filteredReturns = useMemo(() => {
    return devoluciones.filter((d) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        (d.numeroVenta?.toString().includes(term) || false) ||
        (d.clienteNombre?.toLowerCase().includes(term) || false) ||
        (d.clienteDocumento?.includes(term) || false);

      const matchesEstado =
        filterEstado === "todos" || d.estadoId?.toString() === filterEstado;

      return matchesSearch && matchesEstado;
    });
  }, [devoluciones, searchTerm, filterEstado]);

  const paginatedReturns = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return filteredReturns.slice(start, start + itemsPerPage);
  }, [filteredReturns, currentPage]);

  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);

  const handleViewDetail = (devolucion) => {
    setSelectedReturn(devolucion);
    setIsDetailModalOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    onRefresh?.();
  };

  const handleModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedReturn(null);
  };

  const handleModalRefresh = () => {
    onRefresh?.();
    setIsDetailModalOpen(false);
    setSelectedReturn(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Buscador y Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-4">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por N° venta, cliente o documento..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <button
              onClick={() => {
                if (!canCreateReturn) {
                  alert("No tienes permisos para crear devoluciones. Contacta al administrador.");
                  return;
                }
                setIsFormOpen(true);
              }}
              disabled={!canCreateReturn}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm ${
                canCreateReturn
                  ? userRole === "administrador" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Plus size={18} /> Nueva devolución
            </button>
          </div>

          {/* Filtro por estado */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-600 flex items-center">Estado:</span>
            {["todos", "1", "2", "3"].map((estado) => {
              const isActive = filterEstado === estado;
              const label = estado === "todos" ? "Todos" : ESTADO_CONFIG[estado]?.label;
              return (
                <button
                  key={estado}
                  onClick={() => {
                    setFilterEstado(estado);
                    setCurrentPage(0);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? userRole === "administrador" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredReturns.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No se encontraron devoluciones</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">N° Venta</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Motivo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Total Devolución</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Fecha</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedReturns.map((devolucion) => {
                    const estadoConfig =
                      ESTADO_CONFIG[devolucion.estadoId] || ESTADO_CONFIG[1];
                    const fecha = devolucion.fechaDevolucion
                      ? new Date(devolucion.fechaDevolucion).toLocaleDateString(
                          "es-CO"
                        )
                      : "-";

                    return (
                      <tr key={devolucion.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {devolucion.numeroVenta}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="font-medium">{devolucion.clienteNombre}</div>
                          <div className="text-xs text-gray-500">{devolucion.clienteDocumento}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {devolucion.motivo}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold" style={{
                          color: userRole === "administrador" ? "#059669" : "#2563eb"
                        }}>
                          {fmt(devolucion.totalDevolucion)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${estadoConfig.dot}`}></span>
                            {estadoConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{fecha}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleViewDetail(devolucion)}
                            className={`font-medium text-sm inline-flex items-center gap-1 ${
                              userRole === "administrador" 
                                ? "text-emerald-600 hover:text-emerald-700" 
                                : "text-blue-600 hover:text-blue-700"
                            }`}
                          >
                            <Eye size={16} /> Ver detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="text-xs text-gray-600">
                  Mostrando {currentPage * itemsPerPage + 1} a{" "}
                  {Math.min((currentPage + 1) * itemsPerPage, filteredReturns.length)} de{" "}
                  {filteredReturns.length}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="p-2 hover:bg-white disabled:opacity-50 rounded border border-gray-200 text-gray-600"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="p-2 hover:bg-white disabled:opacity-50 rounded border border-gray-200 text-gray-600"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      <ReturnDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleModalClose}
        devolucion={selectedReturn}
        onRefresh={handleModalRefresh}
      />
      <ReturnForm isOpen={isFormOpen} onClose={handleFormClose} onSuccess={handleFormSuccess} />
    </>
  );
};
