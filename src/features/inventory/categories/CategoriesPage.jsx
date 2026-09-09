import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Eye, Edit, Trash2, 
  ChevronLeft, ChevronRight, Filter, Tag,
  CheckCircle, AlertCircle, X
} from "lucide-react";
import CategoryFormModal from "./components/CategoryFormModal";
import { categoryService } from "./services/categoryService";
import { productService } from "../products/services/productService";

export const CategoriesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [categoryToToggle, setCategoryToToggle] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [notification, setNotification] = useState(null);
  const currentUser = JSON.parse(sessionStorage.getItem("syspharma_user") || "{}");
  const userRole = (currentUser.rol || "").toLowerCase().trim();
  const userPerms = (currentUser.permisos || []).map((perm) => String(perm || "").toLowerCase().trim());
  const isAdmin = userRole === "administrador";
  const isEmployeePanel = userRole !== "administrador";
  const hasPerm = (perm) => isAdmin || userPerms.includes(perm);
  const canCreate = hasPerm("categories.create");
  const canEdit = hasPerm("categories.edit");
  const canDelete = hasPerm("categories.delete");
  const canToggleStatus = hasPerm("categories.status");
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

      const [cats, prods] = await Promise.all([
        categoryService.getAllIncludingInactive(filterParam),
        productService.getAll(),
      ]);
      const enriched = cats.map((cat) => ({
        ...cat,
        productos: prods.filter((p) => p.categoria === cat.nombre).length,
      }));
      setCategories(enriched);
    } catch (err) {
      console.error("Error cargando categorías:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("categories:changed", loadData);
    window.addEventListener("products:changed", loadData);
    return () => {
      window.removeEventListener("categories:changed", loadData);
      window.removeEventListener("products:changed", loadData);
    };
  }, [statusFilter]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const filteredItems = categories.filter((cat) => {
    const texto = searchTerm.toLowerCase();
    const matchTexto = cat.nombre.toLowerCase().includes(texto) || String(cat.id).includes(texto);
    const matchEstado = statusFilter === "Todos" ||
      (statusFilter === "Activo" && cat.estado) ||
      (statusFilter === "Inactivo" && !cat.estado);
    return matchTexto && matchEstado;
  });

  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handleSave = async (data) => {
    try {
      if (modalMode === "edit") {
        await categoryService.update(data.id, data);
        setNotification({ message: `Categoría "${data.nombre}" actualizada correctamente`, type: "success" });
      } else {
        await categoryService.create(data);
        setNotification({ message: `Categoría "${data.nombre}" creada correctamente`, type: "success" });
      }
      setIsModalOpen(false);
      setSelectedCategory(null);
      setModalMode("create");
      await loadData();
    } catch (err) {
      console.error("Error al guardar:", err);
      setNotification({ message: "Error al guardar la categoría.", type: "error" });
    }
  };

  const confirmDeleteCategory = async () => {
    if (!canDelete) {
      setNotification({ message: "No tienes permiso para eliminar categorías.", type: "error" });
      setIsDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      return;
    }
    try {
      await categoryService.remove(categoryToDelete.id);
      setNotification({ message: `Categoría "${categoryToDelete.nombre}" eliminada correctamente`, type: "success" });
      await loadData();
    } catch (err) {
      console.error("Error al eliminar:", err);
      const errorMsg = err.response?.data?.message || "No se puede eliminar la categoría porque está relacionada a un producto.";
      setNotification({ message: errorMsg, type: "error" });
    } finally {
      setIsDeleteConfirmOpen(false);
      setCategoryToDelete(null);
    }
  };

  const confirmToggleStatus = async () => {
    if (!canToggleStatus) return;
    try {
      const newStatus = !categoryToToggle.estado;
      await categoryService.toggleStatus(categoryToToggle.id, newStatus);
      setNotification({ message: `Categoría "${categoryToToggle.nombre}" ${newStatus ? "activada" : "desactivada"} correctamente`, type: "success" });
      await loadData();
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      setNotification({ message: "Error al cambiar el estado.", type: "error" });
    } finally {
      setIsStatusConfirmOpen(false);
      setCategoryToToggle(null);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 font-sans text-gray-800 bg-white md:bg-transparent relative">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Categorías</h1>
          <p className="text-xs text-gray-500">Clasificación de productos</p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setSelectedCategory(null); setModalMode("create"); setIsModalOpen(true); }}
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
            placeholder="Buscar categoría..."
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
                {currentItems.length > 0 ? currentItems.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-1.5 px-3 text-xs font-medium text-gray-900">{cat.id}</td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded ${theme.lightBg} flex items-center justify-center ${theme.text} flex-shrink-0`}>
                          <Tag size={12} />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{cat.nombre}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-3 text-xs text-center font-bold">
                      {cat.productos > 0
                        ? <span className={theme.text}>{cat.productos}</span>
                        : <span className="text-gray-400">Sin asociar</span>}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cat.estado ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {cat.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => { setSelectedCategory(cat); setModalMode("view"); setIsModalOpen(true); }} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors" title="Ver detalle">
                          <Eye size={16} />
                        </button>
                        {canToggleStatus && (
                          <button onClick={() => { setCategoryToToggle(cat); setIsStatusConfirmOpen(true); }} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors" title="Cambiar estado">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {canEdit && (
                          <button onClick={() => { setSelectedCategory(cat); setModalMode("edit"); setIsModalOpen(true); }} className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors" title="Editar">
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => { setCategoryToDelete(cat); setIsDeleteConfirmOpen(true); }} className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 text-xs">No hay categorías registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          <div className="bg-gray-50 px-3 py-1.5 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] text-gray-500">Pág {currentPage} de {totalPages || 1}</span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage((c) => Math.max(1, c - 1))} disabled={currentPage === 1} className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={14} className="text-gray-600" /></button>
              <button onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={14} className="text-gray-600" /></button>
            </div>
          </div>
        </div>
      )}

      <CategoryFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={selectedCategory} mode={modalMode} onSave={handleSave} onDelete={(cat) => { setCategoryToDelete(cat); setIsDeleteConfirmOpen(true); }} accentColor={isEmployeePanel ? "blue" : "emerald"} />

      {/* Modal Eliminar */}
      {isDeleteConfirmOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-red-50 px-5 py-3 border-b border-red-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><AlertCircle size={18} className="text-red-600" />Eliminar Categoría</h3>
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700">¿Estás seguro de eliminar la categoría <strong>"{categoryToDelete.nombre}"</strong>?</p>
              <p className="text-xs text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
            </div>
            <div className="bg-red-50 px-5 py-3 border-t border-red-200 flex justify-end gap-2">
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md">Cancelar</button>
              <button onClick={confirmDeleteCategory} className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center gap-1"><Trash2 size={14} />Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Estado */}
      {isStatusConfirmOpen && categoryToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className={`px-5 py-3 border-b flex justify-between items-center ${categoryToToggle.estado ? "bg-red-50 border-red-200" : theme.successBg}`}>
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                {categoryToToggle.estado ? <AlertCircle size={18} className="text-red-600" /> : <CheckCircle size={18} className={theme.successIcon} />}
                {categoryToToggle.estado ? "Desactivar Categoría" : "Activar Categoría"}
              </h3>
              <button onClick={() => setIsStatusConfirmOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700">{categoryToToggle.estado ? `¿Desactivar la categoría "${categoryToToggle.nombre}"?` : `¿Activar la categoría "${categoryToToggle.nombre}"?`}</p>
              {categoryToToggle.estado && <p className="text-xs text-gray-500 mt-2">Los productos de esta categoría no serán visibles en el catálogo.</p>}
            </div>
            <div className={`px-5 py-3 border-t flex justify-end gap-2 ${categoryToToggle.estado ? "bg-red-50 border-red-200" : theme.successBg}`}>
              <button onClick={() => setIsStatusConfirmOpen(false)} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md">Cancelar</button>
              <button onClick={confirmToggleStatus} className={`px-4 py-2 text-xs font-bold text-white rounded-md flex items-center gap-1 ${categoryToToggle.estado ? "bg-red-600 hover:bg-red-700" : `${theme.main} ${theme.mainHover}`}`}>
                {categoryToToggle.estado ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación */}
      {notification && (
        <div className="fixed bottom-4 left-4 max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300 z-50">
          <div className={`bg-white rounded-lg shadow-lg p-4 flex items-start gap-3 border ${
            notification.type === "error" ? "border-red-200" : "border-green-200"
          }`}>
            {notification.type === "error" ? (
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle size={18} className={`${theme.successIcon} flex-shrink-0 mt-0.5`} />
            )}
            <p className="text-xs font-bold text-gray-800">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;