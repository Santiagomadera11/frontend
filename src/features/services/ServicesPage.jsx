import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Search, Eye, Edit, Trash2,
  ChevronLeft, ChevronRight, Filter, Stethoscope, Clock,
  CheckCircle,
} from "lucide-react";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog.jsx";
import ServiceFormModal from "./components/ServiceFormModal";
import { apiClient } from "../../shared/utils/apiClient";

const API_URL = "/api/Servicio";
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${sessionStorage.getItem("syspharma_token")}` },
});

export const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState(null);
  const itemsPerPage = 5;
  const { currentUser } = useCurrentUser();
  const userRole = (currentUser.rol || "").toLowerCase().trim();
  const userPerms = (currentUser.permisos || []).map((perm) => String(perm || "").toLowerCase().trim());
  const isAdmin = userRole === "administrador";
  const isEmployeePanel = userRole !== "administrador";
  const hasPerm = (perm) => isAdmin || userPerms.includes(perm);
  const canCreate = hasPerm("services.create");
  const canEdit = hasPerm("services.edit");
  const canDelete = hasPerm("services.delete");
  const canChangeStatus = hasPerm("services.status");
  const theme = isEmployeePanel
    ? { main: "bg-blue-600", hover: "hover:bg-blue-700", text: "text-blue-600", light: "bg-blue-50", hoverLight: "hover:bg-blue-50", border: "border-blue-200", focus: "focus:border-blue-500" }
    : { main: "bg-emerald-600", hover: "hover:bg-emerald-700", text: "text-emerald-600", light: "bg-emerald-50", hoverLight: "hover:bg-emerald-50", border: "border-emerald-200", focus: "focus:border-emerald-500" };

  const [confirmConfig, setConfirmConfig] = useState({
    open: false, title: "", message: "", confirmText: "Confirmar", danger: true, onConfirm: null,
  });

  const isMountedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const loadServices = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      setLoading(true);
      const res = await apiClient.get(API_URL, getAuthHeaders());
      if (!isMountedRef.current) return;
      setServices(Array.isArray(res.data) ? res.data : []);
    } catch { if (isMountedRef.current) setServices([]); }
    finally { if (isMountedRef.current) setLoading(false); isLoadingRef.current = false; }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadServices();
    const onChange = () => loadServices();
    window.addEventListener("services:changed", onChange);
    return () => {
      isMountedRef.current = false;
      isLoadingRef.current = false;
      window.removeEventListener("services:changed", onChange);
    };
  }, [loadServices]);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const handleCreate = () => {
    if (!canCreate) return;
    setEditingItem(null); setIsViewMode(false); setIsModalOpen(true);
  };

  const handleEdit = (srv) => {
    if (!canEdit) return;
    setConfirmConfig({
      open: true, title: "Editar Servicio",
      message: <><b>¿Editar el servicio "{srv.nombre}"?</b></>,
      confirmText: "Editar", danger: false,
      onConfirm: () => { setEditingItem(srv); setIsViewMode(false); setIsModalOpen(true); },
    });
  };

  const handleView = (srv) => { setEditingItem(srv); setIsViewMode(true); setIsModalOpen(true); };

  const handleDelete = (srv) => {
    if (!canDelete) {
      setNotification({ message: "No tienes permiso para eliminar servicios", type: "error" });
      return;
    }
    setConfirmConfig({
      open: true, title: "Eliminar Servicio",
      message: <><b>¿Eliminar el servicio "{srv.nombre}"?</b><br /><span className="text-xs text-gray-500">Esta acción no se puede deshacer.</span></>,
      confirmText: "Eliminar", danger: true,
      onConfirm: async () => {
        try {
          await apiClient.delete(`${API_URL}/${srv.id}`, getAuthHeaders());
          setNotification({ message: "Servicio eliminado correctamente", type: "success" });
          await loadServices();
        } catch (err) {
          setNotification({ message: err?.response?.data?.message || "Error al eliminar", type: "error" });
        }
      },
    });
  };

  const handleToggleEstado = (srv) => {
    if (!canChangeStatus) return;
    const newEstado = !srv.estado;
    setConfirmConfig({
      open: true, title: `Cambiar estado`,
      message: `¿Cambiar el estado de "${srv.nombre}" a ${newEstado ? "Activo" : "Inactivo"}?`,
      confirmText: newEstado ? "Activar" : "Desactivar", danger: false,
      onConfirm: async () => {
        try {
          const config = getAuthHeaders();
          config.headers["Content-Type"] = "application/json";
          await apiClient.patch(`${API_URL}/${srv.id}/estado`, newEstado, config);
          await loadServices();
        } catch (err) {
          setNotification({ message: err?.response?.data?.message || "Error al cambiar estado", type: "error" });
        }
      },
    });
  };

  const handleSave = async (formData) => {
    if (editingItem && !canEdit) {
      setNotification({ message: "No tienes permiso para editar servicios", type: "error" });
      return;
    }
    if (!editingItem && !canCreate) {
      setNotification({ message: "No tienes permiso para crear servicios", type: "error" });
      return;
    }

    try {
      if (editingItem) {
        await apiClient.put(API_URL, { ...formData, id: editingItem.id }, getAuthHeaders());
        setNotification({ message: "Servicio actualizado correctamente", type: "success" });
      } else {
        await apiClient.post(API_URL, formData, getAuthHeaders());
        setNotification({ message: "Servicio creado correctamente", type: "success" });
      }
      await loadServices();
      setIsModalOpen(false);
      setEditingItem(null);
      window.dispatchEvent(new CustomEvent("services:changed"));
    } catch (err) {
      setNotification({ message: err?.response?.data?.message || "Error al guardar", type: "error" });
    }
  };

  const filteredItems = services.filter((srv) => {
    const texto = searchTerm.toLowerCase();
    const matchTexto = (srv.nombre || "").toLowerCase().includes(texto) ||
      (srv.categoriaNombre || "").toLowerCase().includes(texto);
    const matchEstado = statusFilter === "Todos" ||
      (statusFilter === "Activo" ? srv.estado : !srv.estado);
    return matchTexto && matchEstado;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="h-full flex flex-col p-6 font-sans text-gray-800 bg-white md:bg-transparent relative">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Servicios</h1>
          <p className="text-xs text-gray-500">Catálogo de procedimientos</p>
        </div>
        {canCreate && (
          <button onClick={handleCreate}
            className={`flex items-center gap-1.5 ${theme.main} ${theme.hover} text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-sm transition-colors`}>
            <Plus size={16} /> Nuevo
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-3 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Buscar servicio..."
            className={`w-full pl-9 pr-3 py-1.5 rounded-md border border-gray-300 text-sm focus:outline-none ${theme.focus}`}
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="relative w-36">
          <select className={`w-full pl-3 pr-8 py-1.5 rounded-md border border-gray-300 text-sm bg-white appearance-none cursor-pointer focus:outline-none ${theme.focus}`}
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="Todos">Todos</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className={`${theme.main} text-white sticky top-0 z-10`}>
              <tr>
                {["ID", "Nombre", "Categoría", "Precio", "Duración", "Estado", "Acciones"].map(h => (
                  <th key={h} className="py-2 px-3 text-[10px] font-bold uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400 text-xs">Cargando servicios...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400 text-xs">No se encontraron servicios.</td></tr>
              ) : (
                currentItems.map((srv) => (
                  <tr key={srv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-1.5 px-3 text-xs font-medium text-gray-900">{srv.id}</td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center gap-2">
                        <Stethoscope size={12} className={theme.text} />
                        <span className="text-xs font-bold text-gray-700">{srv.nombre}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-3 text-xs text-gray-600">{srv.categoriaNombre}</td>
                    <td className={`py-1.5 px-3 text-xs font-bold ${theme.text} text-right`}>$ {Number(srv.precio).toLocaleString()}</td>
                    <td className="py-1.5 px-3 text-xs text-center text-gray-500">
                      <div className="flex items-center justify-center gap-1"><Clock size={10} /> {srv.duracion} min</div>
                    </td>
                    <td className="py-1.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${srv.estado ? `${theme.light} ${theme.text}` : "bg-gray-100 text-gray-500"}`}>
                        {srv.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleView(srv)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors" title="Ver detalle">
                          <Eye size={16} />
                        </button>
                        {canChangeStatus && (
                          <button onClick={() => handleToggleEstado(srv)} className={`p-1.5 rounded-md ${theme.text} ${theme.hoverLight} transition-colors`} title="Cambiar estado">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {canEdit && (
                          <button onClick={() => handleEdit(srv)} className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors" title="Editar">
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(srv)} className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-3 py-1.5 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] text-gray-500">Pág {currentPage} de {totalPages || 1}</span>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="p-1 rounded border border-gray-300 bg-white disabled:opacity-50"><ChevronLeft size={14} /></button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 rounded border border-gray-300 bg-white disabled:opacity-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      <ServiceFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={handleSave} initialData={editingItem} isViewMode={isViewMode} />

      <ConfirmDialog open={confirmConfig.open} title={confirmConfig.title} message={confirmConfig.message}
        confirmText={confirmConfig.confirmText} danger={confirmConfig.danger}
        onCancel={() => setConfirmConfig(c => ({ ...c, open: false }))}
        onConfirm={() => { confirmConfig.onConfirm && confirmConfig.onConfirm(); setConfirmConfig(c => ({ ...c, open: false })); }} />

      {notification && (
        <div className={`fixed bottom-4 left-4 px-4 py-3 rounded-lg shadow-lg z-50 text-sm font-medium ${notification.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default ServicesPage;