import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus, Search, Edit, Trash2, Eye,
  Package,
  X, CheckCircle, Database, MoreVertical, Tag, DollarSign, Layers
} from "lucide-react";
import ProductModal from "./components/ProductFormModal";
import { ProductLotesModal } from "./components/ProductLotesModal";
import { productService } from "./services/productService";
import { categoryService } from "../categories/services/categoryService";
import { brandService } from "../brands/services/brandService";
import { presentationService } from "../presentations/services/presentationService";
import { StatusNotification } from "/src/shared/ui/StatusNotification";
import { ConfirmDialog } from "/src/shared/ui/ConfirmDialog";
import { Pagination } from "/src/shared/ui/Pagination";

const isExpiringSoon = (expiryDateStr) => {
  if (!expiryDateStr) return false;
  const expiry = new Date(expiryDateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30;
};

// Agrupa las acciones secundarias (Lotes, Estado, Eliminar) en un menú compacto
// para que la columna de Acciones no empuje el resto de la tabla fuera de vista.
const RowActionsMenu = ({ canToggleStatus, canDelete, isInactive, onLotes, onToggleEstado, onDelete }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button onClick={() => setOpen((o) => !o)} className="p-1 rounded-md text-gray-500 hover:bg-gray-100 transition-colors" title="Más acciones">
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg border border-gray-200 shadow-lg z-20 py-1 text-left">
          <button onClick={() => { onLotes(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
            <Database size={14} className="text-purple-500" /> Ver lotes
          </button>
          {canToggleStatus && (
            <button onClick={() => { onToggleEstado(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
              <CheckCircle size={14} className="text-emerald-500" /> {isInactive ? "Activar" : "Desactivar"}
            </button>
          )}
          {canDelete && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button onClick={() => { onDelete(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 size={14} /> Eliminar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(location.state?.filterStatus || "todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [lotesProduct, setLotesProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [productToToggle, setProductToToggle] = useState(null);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const itemsPerPage = 10;
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const user = currentUser || {};
  const userRole = (user.rol || "").toLowerCase().trim();
  const userPerms = (user.permisos || []).map((perm) => String(perm || "").toLowerCase().trim());
  const isAdmin = userRole === "administrador";
  const isEmployeePanel = userRole !== "administrador";
  const hasPerm = (perm) => isAdmin || userPerms.includes(perm);
  const canCreate = hasPerm("products.create");
  const canEdit = hasPerm("products.edit");
  const canDelete = hasPerm("products.delete");
  const canToggleStatus = hasPerm("products.status");
  const theme = isEmployeePanel
    ? {
        main: "bg-blue-600",
        mainHover: "hover:bg-blue-700",
        text: "text-blue-600",
        icon: "text-blue-500",
        lightBg: "bg-blue-50",
        hoverRow: "hover:bg-blue-50/50",
        border: "border-blue-200",
        hoverLight: "hover:bg-blue-50",
        focus: "focus:border-blue-500 focus:ring-blue-500",
        spinner: "border-blue-600",
        shadow: "shadow-blue-200",
      }
    : {
        main: "bg-emerald-600",
        mainHover: "hover:bg-emerald-700",
        text: "text-emerald-600",
        icon: "text-emerald-500",
        lightBg: "bg-emerald-50",
        hoverRow: "hover:bg-emerald-50/50",
        border: "border-emerald-200",
        hoverLight: "hover:bg-emerald-50",
        focus: "focus:border-emerald-500 focus:ring-emerald-500",
        spinner: "border-emerald-600",
        shadow: "shadow-emerald-200",
      };

  const loadData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      setLoading(true);
      const [prods, cats, brds, press] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
        brandService.getAll(),
        presentationService.getAll(),
      ]);
      if (!isMountedRef.current) return;
      setProducts(prods);
      setCategories(cats);
      setBrands(brds);
      setPresentations(press);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    const handleCategoryChange = () => loadData();
    window.addEventListener("categories:changed", handleCategoryChange);
    window.addEventListener("products:changed", handleCategoryChange);
    window.addEventListener("brands:changed", handleCategoryChange);
    window.addEventListener("presentations:changed", handleCategoryChange);

    return () => {
      isMountedRef.current = false;
      isLoadingRef.current = false;
      window.removeEventListener("categories:changed", handleCategoryChange);
      window.removeEventListener("products:changed", handleCategoryChange);
      window.removeEventListener("brands:changed", handleCategoryChange);
      window.removeEventListener("presentations:changed", handleCategoryChange);
    };
  }, [loadData]);

  const handleCreate = () => {
    if (!canCreate) return;
    navigate(isEmployeePanel ? "/employee/productos/nuevo" : "/admin/productos/nuevo");
  };

  const handleEdit = (item) => {
    if (!canEdit) return;
    navigate(isEmployeePanel ? "/employee/productos/nuevo" : "/admin/productos/nuevo", { state: { product: item } });
  };

  const handleSave = async (data) => {
    try {
      if (editingItem) {
        await productService.update({ ...editingItem, ...data });
        setNotification({ message: `${data.nombre} actualizado correctamente`, type: "success", duration: 3000 });
      } else {
        await productService.create(data);
        setNotification({ message: `${data.nombre} creado correctamente`, type: "success", duration: 3000 });
      }
      window.dispatchEvent(new CustomEvent("syspharma_products_updated"));
      setIsModalOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (err) {
      console.error("Error al guardar:", err);
      setNotification({ message: "Error al guardar el producto.", type: "error", duration: 3000 });
    }
  };

  const handleStatusToggle = (product) => {
    if (!canToggleStatus) return;
    setProductToToggle(product);
    setIsStatusConfirmOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!productToToggle) return;
    try {
      await productService.toggleStatus(productToToggle.id, productToToggle.estado);
      const newStatus = !productToToggle.estado ? "Activo" : "Inactivo";
      setNotification({ message: `${productToToggle.nombre} ahora está ${newStatus}`, type: "success", duration: 3000 });
      window.dispatchEvent(new Event("syspharma_products_updated"));
      await loadData();
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    } finally {
      setIsStatusConfirmOpen(false);
      setProductToToggle(null);
    }
  };

  const handleDelete = async (prod) => {
    if (!canDelete) {
      setNotification({ message: "No tienes permiso para eliminar productos.", type: "error", duration: 3000 });
      setShowDeleteConfirm(null);
      return;
    }
    try {
      await productService.delete(prod.id);
      setNotification({ message: `${prod.nombre} eliminado correctamente`, type: "success", duration: 3000 });
      setShowDeleteConfirm(null);
      window.dispatchEvent(new Event("syspharma_products_updated"));
      await loadData();
    } catch (err) {
      console.error("Error al eliminar:", err);
      setNotification({ message: "Error al eliminar el producto.", type: "error", duration: 3000 });
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchStatus = true;
    if (filterStatus === "Activo") {
      matchStatus = p.estado;
    } else if (filterStatus === "Inactivo") {
      matchStatus = !p.estado;
    } else if (filterStatus === "proximos") {
      matchStatus = p.estado && isExpiringSoon(p.fechaVencimientoProxima);
    }
    
    return matchSearch && matchStatus;
  });

  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, products.length]);
  useEffect(() => {
    if (totalPages === 0) setCurrentPage(1);
    else if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  return (
    <div className="h-full flex flex-col p-3 sm:p-6 font-sans text-gray-800 bg-white md:bg-transparent relative overflow-hidden">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 flex-shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-bold">Productos</h1>
          <p className="text-xs text-gray-500">Inventario</p>
        </div>
        {canCreate && (
          <button
            onClick={handleCreate}
            className={`flex items-center gap-1.5 ${theme.main} ${theme.mainHover} text-white px-3 py-2 sm:py-1.5 rounded-md text-sm font-medium w-full sm:w-auto justify-center sm:justify-start shadow-sm transition-colors`}
          >
            <Plus size={16} /> Nuevo
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar..."
            className={`w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none ${theme.focus} focus:ring-1 transition-colors`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 ${theme.focus} w-full sm:w-auto`}
        >
          <option value="todos">Todos</option>
          <option value="Activo">Activos</option>
          <option value="Inactivo">Inactivos</option>
          <option value="proximos">Próximos a vencer</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${theme.spinner}`} />
        </div>
      )}

      {/* TABLA DESKTOP */}
      {!loading && (
        <div className="hidden sm:flex flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className={`${theme.main} text-white sticky top-0 z-10`}>
                <tr>
                  <th className="py-1.5 px-3 sm:px-4 text-[10px] font-semibold tracking-wider uppercase w-14">ID</th>
                  <th className="py-1.5 px-3 sm:px-4 text-[10px] font-semibold tracking-wider uppercase">Nombre</th>
                  <th className="py-1.5 px-3 sm:px-4 text-[10px] font-semibold tracking-wider uppercase hidden md:table-cell">Presentación</th>
                  <th className="py-1.5 px-3 sm:px-4 text-[10px] font-semibold tracking-wider uppercase hidden lg:table-cell">Categoría</th>
                  <th className="py-1.5 px-3 sm:px-4 text-[10px] text-center font-semibold tracking-wider uppercase w-20">Stock</th>
                  <th className="py-1.5 px-3 sm:px-4 text-[10px] text-right font-semibold tracking-wider uppercase hidden lg:table-cell">Precio</th>
                  <th className="py-1.5 px-3 sm:px-4 text-[10px] text-center font-semibold tracking-wider uppercase w-24">Estado</th>
                  <th className="py-1.5 px-3 sm:px-4 text-[10px] text-center font-semibold tracking-wider uppercase w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length > 0 ? currentItems.map((prod, idx) => (
                  <tr key={prod.id} className={`${theme.hoverRow} transition-colors`}>
                    <td className="py-1.5 px-3 sm:px-4 text-xs font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="py-1.5 px-3 sm:px-4 max-w-0 w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <Package size={13} className={`${theme.icon} flex-shrink-0`} />
                        <span className="text-xs font-semibold text-gray-900 truncate" title={prod.nombre}>{prod.nombre}</span>
                        {isExpiringSoon(prod.fechaVencimientoProxima) && (
                          <span className="text-xs flex-shrink-0 select-none cursor-help" title={`Próximo a vencer (${prod.fechaVencimientoProxima})`}>⚠️</span>
                        )}
                      </div>
                    </td>
                    <td className="py-1.5 px-3 sm:px-4 text-xs text-gray-600 font-semibold hidden md:table-cell max-w-[160px] truncate" title={prod.presentacion || "-"}>{prod.presentacion || "-"}</td>
                    <td className="py-1.5 px-3 sm:px-4 text-xs text-gray-600 hidden lg:table-cell max-w-[140px] truncate" title={prod.categoria}>{prod.categoria}</td>
                    <td className="py-1.5 px-3 sm:px-4 text-xs text-center font-semibold text-gray-900">{prod.stock}</td>
                    <td className={`py-1.5 px-3 sm:px-4 text-xs text-right font-semibold ${theme.text} hidden lg:table-cell`}>$ {Number(prod.precio).toLocaleString()}</td>
                    <td className="py-1.5 px-3 sm:px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${prod.estado ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {prod.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 sm:px-4">
                      <div className="flex justify-center items-center gap-1">
                        <button onClick={() => setDetailProduct(prod)} className="p-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors" title="Ver detalle">
                          <Eye size={15} />
                        </button>
                        {canEdit && (
                          <button onClick={() => handleEdit(prod)} className="p-1 rounded-md text-amber-600 hover:bg-amber-50 transition-colors" title="Editar">
                            <Edit size={15} />
                          </button>
                        )}
                        <RowActionsMenu
                          canToggleStatus={canToggleStatus}
                          canDelete={canDelete}
                          isInactive={!prod.estado}
                          onLotes={() => setLotesProduct(prod)}
                          onToggleEstado={() => handleStatusToggle(prod)}
                          onDelete={() => setShowDeleteConfirm(prod)}
                        />
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="py-8 px-4 text-center">
                      <p className="text-gray-400 text-sm">No hay productos que coincidan con los filtros aplicados</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación Desktop */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            accentColor={isEmployeePanel ? "blue" : "emerald"}
          />
        </div>
      )}

      {/* TARJETAS MÓVIL */}
      {!loading && (
        <div className="sm:hidden flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar">
          {currentItems.length > 0 ? currentItems.map((prod, idx) => (
            <div key={prod.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Package size={18} className={`${theme.icon} flex-shrink-0 mt-1`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {prod.nombre}
                      {isExpiringSoon(prod.fechaVencimientoProxima) && (
                        <span className="text-xs ml-1 select-none" title={`Próximo a vencer (${prod.fechaVencimientoProxima})`}>⚠️</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-600">ID: {(currentPage - 1) * itemsPerPage + idx + 1}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${prod.estado ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {prod.estado ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-gray-500 font-medium">Categoría</p><p className="text-gray-900 font-semibold">{prod.categoria}</p></div>
                <div><p className="text-gray-500 font-medium">Presentación</p><p className="text-gray-900 font-semibold">{prod.presentacion || "-"}</p></div>
                <div><p className="text-gray-500 font-medium">Stock</p><p className="text-gray-900 font-semibold">{prod.stock}</p></div>
                <div className="col-span-2"><p className="text-gray-500 font-medium">Precio</p><p className={`${theme.text} font-bold`}>$ {Number(prod.precio).toLocaleString()}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setDetailProduct(prod)} className="flex-1 py-1.5 px-3 rounded-md text-blue-600 hover:bg-blue-50 transition-colors text-xs font-medium flex items-center justify-center gap-1">
                  <Eye size={14} /> Ver
                </button>
                {canEdit && (
                  <button onClick={() => handleEdit(prod)} className="flex-1 py-1.5 px-3 rounded-md text-amber-600 hover:bg-amber-50 transition-colors text-xs font-medium flex items-center justify-center gap-1">
                    <Edit size={14} /> Editar
                  </button>
                )}
                <RowActionsMenu
                  canToggleStatus={canToggleStatus}
                  canDelete={canDelete}
                  isInactive={!prod.estado}
                  onLotes={() => setLotesProduct(prod)}
                  onToggleEstado={() => handleStatusToggle(prod)}
                  onDelete={() => setShowDeleteConfirm(prod)}
                />
              </div>
            </div>
          )) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-sm">No hay productos que coincidan</p>
            </div>
          )}
          {/* Paginación Móvil */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            accentColor={isEmployeePanel ? "blue" : "emerald"}
            className="rounded-lg shadow-sm sticky bottom-0"
          />
        </div>
      )}

      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingItem} categories={categories} brands={brands} presentations={presentations} />

      {lotesProduct && (
        <ProductLotesModal isOpen={!!lotesProduct} onClose={() => setLotesProduct(null)} product={lotesProduct} />
      )}

      {notification && <StatusNotification message={notification.message} type={notification.type} duration={notification.duration} onClose={() => setNotification(null)} />}

      {/* Modal Detalle */}
      {detailProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            <div className={`px-6 py-4 flex items-center justify-between border-b ${theme.border} ${theme.lightBg} flex-shrink-0`}>
              <h2 className={`text-lg font-semibold ${theme.text}`}>Detalle del Producto</h2>
              <button onClick={() => setDetailProduct(null)} className={`p-1 ${theme.hoverLight} rounded-lg transition-colors ${theme.text}`}><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              {/* Encabezado: nombre, meta y badges */}
              <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg ${theme.lightBg} ${theme.text} flex-shrink-0`}>
                    <Package size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900">{detailProduct.nombre}</h3>
                      <span className="text-[10px] text-gray-400 font-medium">#{detailProduct.id}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {detailProduct.marca || "Genérico"} · {detailProduct.presentacion || "Sin especificar"} · {detailProduct.tipoProducto}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${detailProduct.estado ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {detailProduct.estado ? "Activo" : "Inactivo"}
                      </span>
                      {detailProduct.tipoProducto === "Medicamento" && detailProduct.requiereFormula !== undefined && (
                        detailProduct.requiereFormula ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Requiere fórmula médica 🩺
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                            Venta libre 🟢
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-gray-100">
                    <div className={`inline-flex p-1.5 rounded-md mb-1.5 ${theme.lightBg} ${theme.text}`}><Tag size={13} /></div>
                    <p className="text-[10px] text-gray-400">Categoría</p>
                    <p className="text-xs font-semibold text-gray-900 truncate" title={detailProduct.categoria}>{detailProduct.categoria}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-100">
                    <div className="inline-flex p-1.5 rounded-md mb-1.5 bg-orange-50 text-orange-600"><Layers size={13} /></div>
                    <p className="text-[10px] text-gray-400">Stock</p>
                    <p className="text-xs font-semibold text-gray-900">{detailProduct.stock}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-100">
                    <div className={`inline-flex p-1.5 rounded-md mb-1.5 ${theme.lightBg} ${theme.text}`}><DollarSign size={13} /></div>
                    <p className="text-[10px] text-gray-400">Precio</p>
                    {detailProduct.enOferta && detailProduct.porcentajeDescuento > 0 ? (
                      <div>
                        <p className="text-[10px] text-gray-400 line-through">$ {Number(detailProduct.precio).toLocaleString()}</p>
                        <p className={`text-xs font-bold ${theme.text}`}>${Number(Math.round(detailProduct.precio * (1 - detailProduct.porcentajeDescuento / 100))).toLocaleString()} <span className="text-red-500">-{detailProduct.porcentajeDescuento}%</span></p>
                      </div>
                    ) : (
                      <p className={`text-xs font-bold ${theme.text}`}>$ {Number(detailProduct.precio).toLocaleString()}</p>
                    )}
                  </div>
                </div>

                {/* Descripción */}
                <div className="p-3 rounded-lg border border-gray-100">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Descripción</label>
                  <p className="text-xs text-gray-700 whitespace-pre-line">{detailProduct.descripcion || "Sin descripción disponible."}</p>
                </div>

                {/* Información del medicamento */}
                {detailProduct.tipoProducto === "Medicamento" && (
                  <div className={`rounded-lg border ${theme.border} ${theme.lightBg} p-3`}>
                    <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${theme.text}`}>Información del Medicamento</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {detailProduct.viaAdministracion && <div><p className="text-[10px] text-gray-500">Vía de administración</p><p className="text-xs font-medium text-gray-900">{detailProduct.viaAdministracion}</p></div>}
                      {detailProduct.concentracion && <div><p className="text-[10px] text-gray-500">Concentración</p><p className="text-xs font-medium text-gray-900">{detailProduct.concentracion}</p></div>}
                      {detailProduct.composicion && <div className="col-span-2"><p className="text-[10px] text-gray-500">Composición</p><p className="text-xs font-medium text-gray-900">{detailProduct.composicion}</p></div>}
                      {detailProduct.registroSanitario && <div className="col-span-2"><p className="text-[10px] text-gray-500">Registro sanitario</p><p className="text-xs font-medium text-gray-900">{detailProduct.registroSanitario}</p></div>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end flex-shrink-0">
              <button onClick={() => setDetailProduct(null)} className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      <ConfirmDialog
        open={!!showDeleteConfirm}
        title="Eliminar Producto"
        message={showDeleteConfirm ? `¿Estás seguro de eliminar el producto "${showDeleteConfirm.nombre}"?` : ""}
        confirmText="Eliminar"
        danger
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={() => handleDelete(showDeleteConfirm)}
      />

      {/* Modal Estado */}
      <ConfirmDialog
        open={isStatusConfirmOpen && !!productToToggle}
        title={productToToggle?.estado ? "Desactivar Producto" : "Activar Producto"}
        message={productToToggle ? (productToToggle.estado ? `¿Desactivar el producto "${productToToggle.nombre}"?` : `¿Activar el producto "${productToToggle.nombre}"?`) : ""}
        subMessage={productToToggle?.estado ? "El producto no será visible en el catálogo de ventas." : ""}
        confirmText={productToToggle?.estado ? "Desactivar" : "Activar"}
        danger={!!productToToggle?.estado}
        onCancel={() => setIsStatusConfirmOpen(false)}
        onConfirm={confirmToggleStatus}
      />
    </div>
  );
};

export default ProductsPage;