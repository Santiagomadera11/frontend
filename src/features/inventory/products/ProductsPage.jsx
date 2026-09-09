import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Edit, Trash2, Eye,
  ChevronLeft, ChevronRight, Package,
  X, CheckCircle, AlertCircle, Database
} from "lucide-react";
import ProductModal from "./components/ProductFormModal";
import { ProductLotesModal } from "./components/ProductLotesModal";
import { productService } from "./services/productService";
import { categoryService } from "../categories/services/categoryService";
import { providerService } from "../providers/services/providerService";
import { StatusNotification } from "/src/shared/ui/StatusNotification";

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

export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
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

  const itemsPerPage = 6;
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
      const [prods, cats, provs] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
        providerService.getAll(),
      ]);
      if (!isMountedRef.current) return;
      setProducts(prods);
      setCategories(cats);
      setProviders(provs);

      const productsForPublic = prods.map(p => ({
        id: p.id,
        nombre: p.nombre,
        precio: p.precio,
        stock: p.stock || 0,
        imagen: p.imagen,
        categoria: p.categoria || "Sin categoría",
        marca: p.marca || "",
        presentacion: p.presentacion || "",
        tipoProducto: p.tipoProducto || "Producto General",
        composicion: p.composicion || "",
        concentracion: p.concentracion || "",
        viaAdministracion: p.viaAdministracion || "",
        registroSanitario: p.registroSanitario || "",
        requiereFormula: p.requiereFormula || false,
        estado: p.estado !== false,
      }));

      localStorage.setItem("syspharma_products", JSON.stringify(productsForPublic));

      if (isMountedRef.current) {
        window.dispatchEvent(new Event("syspharma_products_updated"));
      }
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

    return () => {
      isMountedRef.current = false;
      isLoadingRef.current = false;
      window.removeEventListener("categories:changed", handleCategoryChange);
      window.removeEventListener("products:changed", handleCategoryChange);
    };
  }, [loadData]);

  const handleCreate = () => {
    if (!canCreate) return;
    navigate(isEmployeePanel ? "/employee/productos/nuevo" : "/admin/productos/nuevo");
  };

  const handleEdit = (item) => {
    if (!canEdit) return;
    localStorage.setItem("syspharma_editing_product", JSON.stringify(item));
    navigate(isEmployeePanel ? "/employee/productos/nuevo" : "/admin/productos/nuevo");
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
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, products.length]);
  useEffect(() => {
    if (totalPages === 0) setCurrentPage(1);
    else if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages]);

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
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className={`${theme.main} text-white sticky top-0 z-10`}>
                <tr>
                  <th className="py-2.5 px-3 sm:px-4 text-[11px] font-semibold tracking-wider uppercase">ID</th>
                  <th className="py-2.5 px-3 sm:px-4 text-[11px] font-semibold tracking-wider uppercase">Nombre</th>
                  <th className="py-2.5 px-3 sm:px-4 text-[11px] font-semibold tracking-wider uppercase">Marca</th>
                  <th className="py-2.5 px-3 sm:px-4 text-[11px] font-semibold tracking-wider uppercase hidden md:table-cell">Categoría</th>
                  <th className="py-2.5 px-3 sm:px-4 text-[11px] text-center font-semibold tracking-wider uppercase">Stock</th>
                  <th className="py-2.5 px-3 sm:px-4 text-[11px] text-right font-semibold tracking-wider uppercase hidden lg:table-cell">Precio</th>
                  <th className="py-2.5 px-3 sm:px-4 text-[11px] text-center font-semibold tracking-wider uppercase">Estado</th>
                  <th className="py-2.5 px-3 sm:px-4 text-[11px] text-center font-semibold tracking-wider uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length > 0 ? currentItems.map((prod) => (
                  <tr key={prod.id} className={`${theme.hoverRow} transition-colors`}>
                    <td className="py-2.5 px-3 sm:px-4 text-xs font-medium text-gray-900">{prod.id}</td>
                    <td className="py-2.5 px-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        <Package size={14} className={`${theme.icon} flex-shrink-0`} />
                        <span className="text-xs font-semibold text-gray-900 truncate">{prod.nombre}</span>
                        {isExpiringSoon(prod.fechaVencimientoProxima) && (
                          <span className="text-xs ml-1 select-none cursor-help" title={`Próximo a vencer (${prod.fechaVencimientoProxima})`}>⚠️</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-xs text-gray-600 font-semibold">{prod.marca || "-"}</td>
                    <td className="py-2.5 px-3 sm:px-4 text-xs text-gray-600 hidden md:table-cell">{prod.categoria}</td>
                    <td className="py-2.5 px-3 sm:px-4 text-xs text-center font-semibold text-gray-900">{prod.stock}</td>
                    <td className={`py-2.5 px-3 sm:px-4 text-xs text-right font-semibold ${theme.text} hidden lg:table-cell`}>$ {Number(prod.precio).toLocaleString()}</td>
                    <td className="py-2.5 px-3 sm:px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${prod.estado ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {prod.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 sm:px-4">
                      <div className="flex justify-center gap-1.5">
                        <button onClick={() => setDetailProduct(prod)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors" title="Ver detalle">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => setLotesProduct(prod)} className="p-1.5 rounded-md text-purple-600 hover:bg-purple-50 transition-colors" title="Ver lotes">
                          <Database size={16} />
                        </button>
                        {canToggleStatus && (
                          <button onClick={() => handleStatusToggle(prod)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors" title="Cambiar estado">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {canEdit && (
                          <button onClick={() => handleEdit(prod)} className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors" title="Editar">
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setShowDeleteConfirm(prod)} className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="py-8 px-4 text-center">
                      <p className="text-gray-400 text-sm">No hay productos que coincidan con los filtros aplicados</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación Desktop */}
          <div className="bg-gray-50 px-3 py-2 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="text-[10px] text-gray-500 font-medium">Página {currentPage} de {totalPages || 1}</div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage((c) => Math.max(1, c - 1))} disabled={currentPage === 1} className="p-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors">
                <ChevronLeft size={14} className="text-gray-600" />
              </button>
              <div className="hidden md:flex gap-1">
                {pages.map((p) => (
                  <button key={p} onClick={() => setCurrentPage(p)} className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${p === currentPage ? `${theme.main} text-white shadow-sm` : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {p}
                  </button>
                ))}
              </div>
              <button onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors">
                <ChevronRight size={14} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TARJETAS MÓVIL */}
      {!loading && (
        <div className="sm:hidden flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar">
          {currentItems.length > 0 ? currentItems.map((prod) => (
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
                    <p className="text-xs text-gray-600">ID: {prod.id}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${prod.estado ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {prod.estado ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-gray-500 font-medium">Categoría</p><p className="text-gray-900 font-semibold">{prod.categoria}</p></div>
                <div><p className="text-gray-500 font-medium">Stock</p><p className="text-gray-900 font-semibold">{prod.stock}</p></div>
                <div className="col-span-2"><p className="text-gray-500 font-medium">Precio</p><p className={`${theme.text} font-bold`}>$ {Number(prod.precio).toLocaleString()}</p></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDetailProduct(prod)} className="flex-1 py-1.5 px-3 rounded-md text-blue-600 hover:bg-blue-50 transition-colors text-xs font-medium flex items-center justify-center gap-1">
                  <Eye size={14} /> Ver
                </button>
                <button onClick={() => setLotesProduct(prod)} className="flex-1 py-1.5 px-3 rounded-md text-purple-600 hover:bg-purple-50 transition-colors text-xs font-medium flex items-center justify-center gap-1">
                  <Database size={14} /> Lotes
                </button>
                {canToggleStatus && (
                  <button onClick={() => handleStatusToggle(prod)} className="flex-1 py-1.5 px-3 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors text-xs font-medium flex items-center justify-center gap-1">
                    <CheckCircle size={14} /> Estado
                  </button>
                )}
                {canEdit && (
                  <button onClick={() => handleEdit(prod)} className="flex-1 py-1.5 px-3 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors text-xs font-medium flex items-center justify-center gap-1">
                    <Edit size={14} /> Editar
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => setShowDeleteConfirm(prod)} className="flex-1 py-1.5 px-3 rounded-md text-red-600 hover:bg-red-50 transition-colors text-xs font-medium flex items-center justify-center gap-1">
                    <Trash2 size={14} /> Borrar
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-sm">No hay productos que coincidan</p>
            </div>
          )}
          {/* Paginación Móvil */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2 flex justify-between items-center flex-shrink-0 sticky bottom-0">
            <span className="text-[10px] text-gray-500">Pág {currentPage} de {totalPages || 1}</span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage((c) => Math.max(1, c - 1))} disabled={currentPage === 1} className="p-1 border rounded bg-white disabled:opacity-50 hover:bg-gray-100"><ChevronLeft size={16} className="text-gray-600" /></button>
              <button onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 border rounded bg-white disabled:opacity-50 hover:bg-gray-100"><ChevronRight size={16} className="text-gray-600" /></button>
            </div>
          </div>
        </div>
      )}

      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingItem} categories={categories} providers={providers} />

      {lotesProduct && (
        <ProductLotesModal isOpen={!!lotesProduct} onClose={() => setLotesProduct(null)} product={lotesProduct} />
      )}

      {notification && <StatusNotification message={notification.message} type={notification.type} duration={notification.duration} onClose={() => setNotification(null)} />}

      {/* Modal Detalle */}
      {detailProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] shadow-2xl flex flex-col">
            <div className={`px-6 py-4 flex items-center justify-between border-b ${theme.border} ${theme.lightBg} flex-shrink-0`}>
              <h2 className={`text-lg font-semibold ${theme.text}`}>Detalle del Producto</h2>
              <button onClick={() => setDetailProduct(null)} className={`p-1 ${theme.hoverLight} rounded-lg transition-colors ${theme.text}`}><X size={20} /></button>
            </div>
            <div className="flex-1 p-4 sm:p-6 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                {detailProduct.imagen && (
                  <div className="md:col-span-1 flex items-start justify-center">
                    <div className="w-full h-48 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                      <img src={detailProduct.imagen} alt={detailProduct.nombre} className="max-w-full max-h-full object-contain p-2" />
                    </div>
                  </div>
                )}
                <div className={`${detailProduct.imagen ? "md:col-span-2" : "md:col-span-3"} grid grid-cols-2 gap-2 sm:gap-3 text-sm overflow-y-auto`}>
                  <div><label className="text-xs font-semibold text-gray-500 uppercase block">ID</label><p className="text-xs text-gray-900 font-medium truncate">{detailProduct.id}</p></div>
                  <div><label className="text-xs font-semibold text-gray-500 uppercase block">Nombre</label><p className="text-xs text-gray-900 font-medium line-clamp-2">{detailProduct.nombre}</p></div>
                  <div><label className="text-xs font-semibold text-gray-500 uppercase block">Marca</label><p className="text-xs text-gray-900 font-medium truncate">{detailProduct.marca || "Genérico"}</p></div>
                  <div><label className="text-xs font-semibold text-gray-500 uppercase block">Presentación</label><p className="text-xs text-gray-900 font-medium truncate">{detailProduct.presentacion || "Sin especificar"}</p></div>

                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase block">Descripción</label>
                    <p className="text-xs text-gray-900 font-medium whitespace-pre-line">{detailProduct.descripcion || "Sin descripción disponible."}</p>
                  </div>

                  <div><label className="text-xs font-semibold text-gray-500 uppercase block">Categoría</label><p className="text-xs text-gray-900 font-medium truncate">{detailProduct.categoria}</p></div>
                  <div><label className="text-xs font-semibold text-gray-500 uppercase block">Tipo</label><p className="text-xs text-gray-900 font-medium truncate">{detailProduct.tipoProducto}</p></div>
                  <div><label className="text-xs font-semibold text-gray-500 uppercase block">Stock</label><p className="text-xs text-gray-900 font-bold">{detailProduct.stock}</p></div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block">Precio</label>
                    {detailProduct.enOferta && detailProduct.porcentajeDescuento > 0 ? (
                      <div>
                        <p className="text-xs text-gray-500 line-through">$ {Number(detailProduct.precio).toLocaleString()}</p>
                        <p className={`text-xs ${theme.text} font-bold`}>${Number(Math.round(detailProduct.precio * (1 - detailProduct.porcentajeDescuento / 100))).toLocaleString()}<span className="text-red-500 ml-1">-{detailProduct.porcentajeDescuento}%</span></p>
                      </div>
                    ) : (
                      <p className={`text-xs ${theme.text} font-bold`}>$ {Number(detailProduct.precio).toLocaleString()}</p>
                    )}
                  </div>
                  <div><label className="text-xs font-semibold text-gray-500 uppercase block">Estado</label><p className="text-xs text-gray-900 font-medium">{detailProduct.estado ? "Activo" : "Inactivo"}</p></div>
                  {detailProduct.tipoProducto === "Medicamento" && (
                    <>
                      <div className="col-span-2 border-t border-gray-100 pt-2 mt-2"><h3 className="font-semibold text-[10px] text-gray-400 uppercase tracking-wider mb-2">Información del Medicamento</h3></div>
                      {detailProduct.viaAdministracion && <div><label className="text-xs font-semibold text-gray-500 uppercase block">Vía Admin</label><p className="text-xs text-gray-900 truncate">{detailProduct.viaAdministracion}</p></div>}
                      {detailProduct.concentracion && <div><label className="text-xs font-semibold text-gray-500 uppercase block">Concentración</label><p className="text-xs text-gray-900 truncate">{detailProduct.concentracion}</p></div>}
                      {detailProduct.composicion && <div><label className="text-xs font-semibold text-gray-500 uppercase block">Composición</label><p className="text-xs text-gray-900 truncate">{detailProduct.composicion}</p></div>}
                      {detailProduct.registroSanitario && <div><label className="text-xs font-semibold text-gray-500 uppercase block">Registro Sanitario</label><p className="text-xs text-gray-900 truncate">{detailProduct.registroSanitario}</p></div>}
                      {detailProduct.requiereFormula !== undefined && (
                        <div className="col-span-2 mt-1">
                          {detailProduct.requiereFormula ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              Requiere fórmula médica 🩺
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                              Venta libre 🟢
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
              <button onClick={() => setDetailProduct(null)} className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Cerrar</button>
              {canEdit && <button onClick={() => { setDetailProduct(null); handleEdit(detailProduct); }} className={`px-4 py-2 text-xs font-bold text-white ${theme.main} ${theme.mainHover} rounded-lg transition-colors`}>Editar Producto</button>}
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-red-50 px-5 py-4 border-b border-red-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><AlertCircle size={18} className="text-red-600" />Eliminar Producto</h3>
              <button onClick={() => setShowDeleteConfirm(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700">¿Estás seguro de eliminar el producto <strong>"{showDeleteConfirm.nombre}"</strong>?</p>
              <p className="text-xs text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
            </div>
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1 shadow-sm">
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Estado */}
      {isStatusConfirmOpen && productToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className={`px-5 py-4 border-b flex justify-between items-center ${productToToggle.estado ? "bg-red-50 border-red-100" : `${theme.lightBg} ${theme.border}`}`}>
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                {productToToggle.estado ? <AlertCircle size={18} className="text-red-600" /> : <CheckCircle size={18} className={theme.text} />}
                {productToToggle.estado ? "Desactivar Producto" : "Activar Producto"}
              </h3>
              <button onClick={() => setIsStatusConfirmOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700">{productToToggle.estado ? `¿Desactivar el producto "${productToToggle.nombre}"?` : `¿Activar el producto "${productToToggle.nombre}"?`}</p>
              {productToToggle.estado && <p className="text-xs text-gray-500 mt-2">El producto no será visible en el catálogo de ventas.</p>}
            </div>
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setIsStatusConfirmOpen(false)} className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">Cancelar</button>
              <button onClick={confirmToggleStatus} className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm ${productToToggle.estado ? "bg-red-600 hover:bg-red-700" : `${theme.main} ${theme.mainHover}`}`}>
                {productToToggle.estado ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;