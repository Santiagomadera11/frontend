import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect } from "react";
import {
  Plus, Search, Eye, Edit, Trash2,
  Filter, Building2, Phone, Mail,
  CheckCircle,
} from "lucide-react";
import ProviderFormModal from "./components/ProviderFormModal";
import { providerService } from "./services/providerService";
import { ToastNotification } from "../../../shared/ui/ToastNotification";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { Pagination } from "../../../shared/ui/Pagination";

export const ProvidersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [providerToToggle, setProviderToToggle] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState(null);
  const [notification, setNotification] = useState(null);
  const { currentUser } = useCurrentUser();
  const userRole = (currentUser.rol || "").toLowerCase().trim();
  const userPerms = (currentUser.permisos || []).map((perm) => String(perm || "").toLowerCase().trim());
  const isAdmin = userRole === "administrador";
  const isEmployeePanel = userRole !== "administrador";
  const hasPerm = (perm) => isAdmin || userPerms.includes(perm);

  const canCreate = hasPerm("suppliers.create");
  const canEdit = hasPerm("suppliers.edit");
  const canDelete = hasPerm("suppliers.delete");
  const canToggleStatus = hasPerm("suppliers.status");

  const theme = isEmployeePanel
    ? {
        main: "bg-blue-600",
        mainHover: "hover:bg-blue-700",
        text: "text-blue-600",
        lightBg: "bg-blue-50",
        hoverLight: "hover:bg-blue-50",
        border: "border-blue-200",
        focus: "focus:border-blue-400",
        spinner: "border-blue-600",
        successText: "text-blue-800",
        successIcon: "text-blue-600",
        successBg: "bg-blue-50 border-blue-200",
      }
    : {
        main: "bg-emerald-600",
        mainHover: "hover:bg-emerald-700",
        text: "text-emerald-600",
        lightBg: "bg-emerald-50",
        hoverLight: "hover:bg-emerald-50",
        border: "border-emerald-200",
        focus: "focus:border-emerald-400",
        spinner: "border-emerald-600",
        successText: "text-green-800",
        successIcon: "text-green-600",
        successBg: "bg-green-50 border-green-200",
      };

  const loadProviders = async () => {
    setLoading(true);
    try {
      const data = await providerService.getAll();
      setProviders(data);
    } catch {
      console.error("Error cargando proveedores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const filteredItems = providers.filter((prov) => {
    const texto = searchTerm.toLowerCase();
    const matchTexto =
      prov.nombre?.toLowerCase().includes(texto) ||
      prov.contacto?.toLowerCase().includes(texto);
    const matchEstado =
      statusFilter === "Todos" ||
      (statusFilter === "Activo" && prov.estado) ||
      (statusFilter === "Inactivo" && !prov.estado);
    return matchTexto && matchEstado;
  });

  const currentItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handleView = (prov) => {
    setSelectedProvider(prov);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (prov) => {
    if (!canEdit) return;
    setSelectedProvider(prov);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDelete = (prov) => {
    if (!canDelete) {
      setNotification({ message: "No tienes permiso para eliminar proveedores", type: "error" });
      return;
    }
    setProviderToDelete(prov);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!canDelete) {
      setNotification({ message: "No tienes permiso para eliminar proveedores", type: "error" });
      setIsDeleteConfirmOpen(false);
      setProviderToDelete(null);
      return;
    }

    try {
      await providerService.delete(providerToDelete.id);
      setNotification({
        message: `Proveedor "${providerToDelete.nombre}" eliminado correctamente`,
        type: "success",
      });
      await loadProviders();
    } catch {
      setNotification({ message: "Error al eliminar el proveedor", type: "error" });
    } finally {
      setIsDeleteConfirmOpen(false);
      setProviderToDelete(null);
    }
  };

  const handleSave = async (data) => {
    try {
      if (modalMode === "edit") {
        await providerService.update(data);
        setNotification({
          message: `Proveedor "${data.nombre}" actualizado correctamente`,
          type: "success",
        });
      } else {
        await providerService.create(data);
        setNotification({
          message: `Proveedor "${data.nombre}" creado correctamente`,
          type: "success",
        });
      }
      await loadProviders();
    } catch {
      setNotification({ message: "Error al guardar el proveedor", type: "error" });
    } finally {
      setIsModalOpen(false);
      setSelectedProvider(null);
      setModalMode("create");
    }
  };

  const handleToggleStatus = (prov) => {
    if (!canToggleStatus) return;
    setProviderToToggle(prov);
    setIsStatusConfirmOpen(true);
  };

  const confirmStatusChange = async () => {
    try {
      await providerService.toggleStatus(providerToToggle.id, !providerToToggle.estado);
      setNotification({
        message: `Proveedor "${providerToToggle.nombre}" ${!providerToToggle.estado ? "activado" : "desactivado"} correctamente`,
        type: "success",
      });
      await loadProviders();
    } catch {
      setNotification({ message: "Error al cambiar el estado", type: "error" });
    } finally {
      setIsStatusConfirmOpen(false);
      setProviderToToggle(null);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 font-sans text-gray-800 bg-white md:bg-transparent relative">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Proveedores</h1>
          <p className="text-xs text-gray-500">Gestión de socios comerciales</p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setSelectedProvider(null); setModalMode("create"); setIsModalOpen(true); }}
            className={`flex items-center gap-1.5 ${theme.main} ${theme.mainHover} text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm`}
          >
            <Plus size={16} /> Nuevo
          </button>
        )}
      </div>

      {/* FILTROS */}
      <div className="flex gap-3 mb-3 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar proveedor o contacto..."
            className={`w-full pl-9 pr-3 py-1.5 rounded-md border border-gray-300 focus:outline-none ${theme.focus} text-sm bg-white`}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="relative w-36">
          <select
            className={`w-full pl-3 pr-8 py-1.5 rounded-md border border-gray-300 focus:outline-none ${theme.focus} text-sm bg-white appearance-none cursor-pointer`}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="Todos">Todos</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${theme.spinner}`} />
        </div>
      )}

      {/* TABLA */}
      {!loading && (
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className={`${theme.main} text-white sticky top-0 z-10`}>
                <tr>
                  <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider">ID</th>
                  <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider">Nombre</th>
                  <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider">Contacto</th>
                  <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider">Teléfono / Email</th>
                  <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-center">Estado</th>
                  <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length > 0 ? currentItems.map((prov, idx) => (
                  <tr key={prov.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-1.5 px-3 text-xs font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded ${theme.lightBg} flex items-center justify-center ${theme.text} flex-shrink-0`}>
                          <Building2 size={12} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 truncate max-w-[180px]">{prov.nombre}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-3 text-xs text-gray-600">{prov.contacto}</td>
                    <td className="py-1.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Phone size={10} /> {prov.telefono}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 truncate max-w-[150px]">
                          <Mail size={10} /> {prov.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${prov.estado ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {prov.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleView(prov)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors" title="Ver detalle">
                          <Eye size={16} />
                        </button>
                        {canToggleStatus && (
                          <button onClick={() => handleToggleStatus(prov)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors" title="Cambiar estado">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {canEdit && (
                          <button onClick={() => handleEdit(prov)} className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors" title="Editar">
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(prov)} className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">No hay proveedores registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredItems.length}
            itemsPerPage={itemsPerPage}
            accentColor={isEmployeePanel ? "blue" : "emerald"}
          />
        </div>
      )}

      <ProviderFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedProvider(null); setModalMode("create"); }}
        initialData={selectedProvider}
        mode={modalMode}
        onSave={handleSave}
        onDelete={handleDelete}
        canDelete={canDelete}
        accentColor={isEmployeePanel ? "blue" : "emerald"}
      />

      {/* Modal Estado */}
      <ConfirmDialog
        open={isStatusConfirmOpen && !!providerToToggle}
        title={providerToToggle?.estado ? "Desactivar Proveedor" : "Activar Proveedor"}
        message={providerToToggle ? (providerToToggle.estado ? `¿Desactivar el proveedor "${providerToToggle.nombre}"?` : `¿Activar el proveedor "${providerToToggle.nombre}"?`) : ""}
        subMessage=""
        confirmText={providerToToggle?.estado ? "Desactivar" : "Activar"}
        danger={!!providerToToggle?.estado}
        onCancel={() => setIsStatusConfirmOpen(false)}
        onConfirm={confirmStatusChange}
      />

      {/* Modal Eliminar */}
      <ConfirmDialog
        open={isDeleteConfirmOpen && !!providerToDelete}
        title="Eliminar Proveedor"
        message={providerToDelete ? `¿Estás seguro de eliminar el proveedor "${providerToDelete.nombre}"?` : ""}
        confirmText="Eliminar"
        danger
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
      />

      {/* Notificación */}
      {notification && (
        <ToastNotification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}
    </div>
  );
};

export default ProvidersPage;