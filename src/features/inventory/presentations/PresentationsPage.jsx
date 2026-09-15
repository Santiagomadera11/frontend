import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect } from "react";
import {
  Plus, Search, Eye, Edit, Trash2,
  Filter, Beaker,
  CheckCircle,
} from "lucide-react";
import PresentationFormModal from "./components/PresentationFormModal";
import { presentationService } from "./services/presentationService";
import { ToastNotification } from "../../../shared/ui/ToastNotification";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { Pagination } from "../../../shared/ui/Pagination";

export const PresentationsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [itemToToggle, setItemToToggle] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [notification, setNotification] = useState(null);
  const { currentUser } = useCurrentUser();
  const userRole = (currentUser.rol || "").toLowerCase().trim();
  const userPerms = (currentUser.permisos || []).map((perm) => String(perm || "").toLowerCase().trim());
  const isAdmin = userRole === "administrador";
  const isEmployeePanel = userRole !== "administrador";
  const hasPerm = (perm) => isAdmin || userPerms.includes(perm);
  const canCreate = hasPerm("presentations.create");
  const canEdit = hasPerm("presentations.edit");
  const canDelete = hasPerm("presentations.delete");
  const canToggleStatus = hasPerm("presentations.status");
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
        successBg: "bg-blue-50 border-blue-200",
        successIcon: "text-blue-600",
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
        successBg: "bg-emerald-50 border-emerald-200",
        successIcon: "text-emerald-600",
      };

  const loadData = async () => {
    try {
      setLoading(true);
      let filterParam = "todos";
      if (statusFilter === "Activo") filterParam = "activo";
      if (statusFilter === "Inactivo") filterParam = "inactivo";

      const pres = await presentationService.getAllIncludingInactive(filterParam);
      const enriched = pres.map((item) => ({
        ...item,
        productos: item.productosCount ?? 0,
      }));
      setPresentations(enriched);
    } catch (err) {
      console.error("Error cargando presentaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("presentations:changed", loadData);
    window.addEventListener("products:changed", loadData);
    return () => {
      window.removeEventListener("presentations:changed", loadData);
      window.removeEventListener("products:changed", loadData);
    };
  }, [statusFilter]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const filteredItems = presentations.filter((item) => {
    const texto = searchTerm.toLowerCase();
    const matchTexto = item.nombre.toLowerCase().includes(texto) || String(item.id).includes(texto);
    const matchEstado = statusFilter === "Todos" ||
      (statusFilter === "Activo" && item.estado) ||
      (statusFilter === "Inactivo" && !item.estado);
    return matchTexto && matchEstado;
  });

  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handleSave = async (data) => {
    try {
      if (modalMode === "edit") {
        await presentationService.update(data.id, data);
        setNotification({ message: `Presentación "${data.nombre}" actualizada correctamente`, type: "success" });
      } else {
        await presentationService.create(data);
        setNotification({ message: `Presentación "${data.nombre}" creada correctamente`, type: "success" });
      }
      setIsModalOpen(false);
      setSelectedItem(null);
      setModalMode("create");
      await loadData();
      window.dispatchEvent(new CustomEvent("presentations:changed"));
    } catch (err) {
      console.error("Error al guardar:", err);
      setNotification({ message: "Error al guardar la presentación.", type: "error" });
    }
  };

  const confirmDelete = async () => {
    if (!canDelete) {
      setNotification({ message: "No tienes permiso para eliminar presentaciones.", type: "error" });
      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
      return;
    }
    try {
      await presentationService.remove(itemToDelete.id);
      setNotification({ message: `Presentación "${itemToDelete.nombre}" eliminada correctamente`, type: "success" });
      await loadData();
      window.dispatchEvent(new CustomEvent("presentations:changed"));
    } catch (err) {
      console.error("Error al eliminar:", err);
      const errorMsg = err.response?.data?.message || "No se puede eliminar la presentación porque está relacionada a un producto.";
      setNotification({ message: errorMsg, type: "error" });
    } finally {
      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const confirmToggleStatus = async () => {
    if (!canToggleStatus) return;
    try {
      const newStatus = !itemToToggle.estado;
      await presentationService.toggleStatus(itemToToggle.id, newStatus);
      setNotification({ message: `Presentación "${itemToToggle.nombre}" ${newStatus ? "activada" : "desactivada"} correctamente`, type: "success" });
      await loadData();
      window.dispatchEvent(new CustomEvent("presentations:changed"));
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      setNotification({ message: "Error al cambiar el estado.", type: "error" });
    } finally {
      setIsStatusConfirmOpen(false);
      setItemToToggle(null);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 font-sans text-gray-800 bg-white md:bg-transparent relative">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Presentaciones</h1>
          <p className="text-xs text-gray-500">Forma farmacéutica de los productos</p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setSelectedItem(null); setModalMode("create"); setIsModalOpen(true); }}
            className={`flex items-center gap-1.5 ${theme.main} ${theme.mainHover} text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm`}
          >
            <Plus size={16} /> Nueva
          </button>
        )}
      </div>

      {/* FILTROS */}
      <div className="flex gap-3 mb-3 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar presentación..."
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
                  <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-center">Productos</th>
                  <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-center">Estado</th>
                  <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length > 0 ? currentItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-1.5 px-3 text-xs font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded ${theme.lightBg} flex items-center justify-center ${theme.text} flex-shrink-0`}>
                          <Beaker size={12} />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{item.nombre}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-3 text-xs text-center font-bold">
                      {item.productos > 0
                        ? <span className={theme.text}>{item.productos}</span>
                        : <span className="text-gray-400">Sin asociar</span>}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${item.estado ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {item.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => { setSelectedItem(item); setModalMode("view"); setIsModalOpen(true); }} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors" title="Ver detalle">
                          <Eye size={16} />
                        </button>
                        {canToggleStatus && (
                          <button onClick={() => { setItemToToggle(item); setIsStatusConfirmOpen(true); }} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors" title="Cambiar estado">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {canEdit && (
                          <button onClick={() => { setSelectedItem(item); setModalMode("edit"); setIsModalOpen(true); }} className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors" title="Editar">
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => { setItemToDelete(item); setIsDeleteConfirmOpen(true); }} className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 text-xs">No hay presentaciones registradas.</td>
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

      <PresentationFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={selectedItem} mode={modalMode} onSave={handleSave} onDelete={(item) => { setItemToDelete(item); setIsDeleteConfirmOpen(true); }} accentColor={isEmployeePanel ? "blue" : "emerald"} />

      {/* Modal Eliminar */}
      <ConfirmDialog
        open={isDeleteConfirmOpen && !!itemToDelete}
        title="Eliminar Presentación"
        message={itemToDelete ? `¿Estás seguro de eliminar la presentación "${itemToDelete.nombre}"?` : ""}
        confirmText="Eliminar"
        danger
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
      />

      {/* Modal Estado */}
      <ConfirmDialog
        open={isStatusConfirmOpen && !!itemToToggle}
        title={itemToToggle?.estado ? "Desactivar Presentación" : "Activar Presentación"}
        message={itemToToggle ? (itemToToggle.estado ? `¿Desactivar la presentación "${itemToToggle.nombre}"?` : `¿Activar la presentación "${itemToToggle.nombre}"?`) : ""}
        subMessage={itemToToggle?.estado ? "Los productos con esta presentación no serán visibles en el catálogo." : ""}
        confirmText={itemToToggle?.estado ? "Desactivar" : "Activar"}
        danger={!!itemToToggle?.estado}
        onCancel={() => setIsStatusConfirmOpen(false)}
        onConfirm={confirmToggleStatus}
      />

      {/* Notificación */}
      {notification && (
        <ToastNotification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}
    </div>
  );
};

export default PresentationsPage;
