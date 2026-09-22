import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus, Search, Eye, Edit, Trash2,
  Filter, ShoppingBag,
  CheckCircle, X
} from "lucide-react";
import PurchaseModal from "./components/PurchaseFormModal";
import { purchaseService } from "./services/purchaseService";
import { ToastNotification } from "../../../shared/ui/ToastNotification";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { Pagination } from "../../../shared/ui/Pagination";

export const PurchasesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEmployeePath = location.pathname.startsWith("/employee");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [compras, setCompras] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [dateFilter, setDateFilter] = useState("");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [purchaseToChangeStatus, setPurchaseToChangeStatus] = useState(null);
  const [notification, setNotification] = useState(null);
  const isMountedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const { currentUser } = useCurrentUser();
  const userRole = (currentUser.rol || "").toLowerCase().trim();
  const userPerms = (currentUser.permisos || []).map((perm) => String(perm || "").toLowerCase().trim());
  const isAdmin = userRole === "administrador";
  const isEmployeePanel = userRole !== "administrador";
  const hasPerm = (perm) => isAdmin || userPerms.includes(perm);
  const canCreate = hasPerm("purchase.create");
  const canEdit = hasPerm("purchase.edit");
  const canDelete = hasPerm("purchase.delete");
  const canChangeStatus = hasPerm("purchase.status");
  const theme = isEmployeePanel
    ? { main: "bg-blue-600", hover: "hover:bg-blue-700", text: "text-blue-600", light: "bg-blue-50", hoverLight: "hover:bg-blue-50", border: "border-blue-200", focus: "focus:border-blue-400" }
    : { main: "bg-emerald-600", hover: "hover:bg-emerald-700", text: "text-emerald-600", light: "bg-emerald-50", hoverLight: "hover:bg-emerald-50", border: "border-emerald-200", focus: "focus:border-emerald-400" };

  const loadCompras = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      setLoading(true);
      const data = await purchaseService.getAll();
      if (!isMountedRef.current) return;
      setCompras(Array.isArray(data) ? data : []);
    } catch { if (isMountedRef.current) setCompras([]); }
    finally { if (isMountedRef.current) setLoading(false); isLoadingRef.current = false; }
  }, []);

  useEffect(() => {
    if (location.state?.notification) {
      setNotification(location.state.notification);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // Solo se lee al montar: es el aviso de "compra creada/editada" que llega
    // desde CreatePurchasePage tras redirigir; no debe repetirse si el usuario
    // navega de vuelta a esta misma página después.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadCompras();
    purchaseService.getEstados().then((data) => { if (isMountedRef.current) setEstados(Array.isArray(data) ? data : []); }).catch(() => { if (isMountedRef.current) setEstados([]); });
    const handleChange = () => loadCompras();
    window.addEventListener("purchases:changed", handleChange);
    return () => {
      isMountedRef.current = false;
      isLoadingRef.current = false;
      window.removeEventListener("purchases:changed", handleChange);
    };
  }, [loadCompras]);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const filtered = compras.filter(c => {
    const texto = searchTerm.toLowerCase();
    const matchText =
      (c.proveedorNombre || "").toLowerCase().includes(texto) ||
      (c.numeroCompra || "").toLowerCase().includes(texto);
    const matchStatus = statusFilter === "Todos" ||
      (c.estadoNombre || "").toLowerCase() === statusFilter.toLowerCase();
    const matchDate = !dateFilter || (c.fechaCompra || "").startsWith(dateFilter);
    return matchText && matchStatus && matchDate;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const getStatusBadge = (estado) => {
    const baseClass = "px-2 py-0.5 rounded text-[10px] font-bold border";
    const lower = (estado || "").toLowerCase();
    if (lower === "recibida") return <span className={`${baseClass} bg-emerald-50 text-emerald-700 border-emerald-200`}>Recibida</span>;
    if (lower === "pendiente") return <span className={`${baseClass} bg-blue-50 text-blue-700 border-blue-200`}>Pendiente</span>;
    if (lower === "en camino") return <span className={`${baseClass} bg-yellow-50 text-yellow-700 border-yellow-200`}>En Camino</span>;
    if (lower === "cancelada") return <span className={`${baseClass} bg-red-50 text-red-700 border-red-200`}>Cancelada</span>;
    return <span className={`${baseClass} bg-gray-50 text-gray-700 border-gray-200`}>{estado}</span>;
  };

  const handleSave = async (data) => {
    if (modalMode === "edit" && !canEdit) {
      setNotification({ message: "No tienes permiso para editar compras", type: "error" });
      return;
    }
    if (modalMode !== "edit" && !canCreate) {
      setNotification({ message: "No tienes permiso para crear compras", type: "error" });
      return;
    }

    try {
      if (modalMode === "edit") {
        await purchaseService.update(data);
        setNotification({ message: "Compra actualizada correctamente", type: "success" });
      } else {
        await purchaseService.create(data);
        setNotification({ message: "Compra registrada correctamente", type: "success" });
      }
      await loadCompras();
      setIsModalOpen(false);
      setSelectedPurchase(null);
      setModalMode("create");
    } catch (err) {
      setNotification({ message: err?.response?.data?.message || "Error al guardar", type: "error" });
    }
  };

  const confirmDelete = async () => {
    if (showDeleteConfirm) {
      if (!canDelete) {
        setNotification({ message: "No tienes permiso para eliminar compras", type: "error" });
        setShowDeleteConfirm(null);
        return;
      }
      try {
        await purchaseService.delete(showDeleteConfirm.id);
        setNotification({ message: "Compra eliminada correctamente", type: "success" });
        await loadCompras();
      } catch (err) {
        setNotification({ message: err?.response?.data?.message || "Error al eliminar", type: "error" });
      }
      setShowDeleteConfirm(null);
    }
  };

  const confirmStatusChange = async (estadoId) => {
    if (purchaseToChangeStatus) {
      if (!canChangeStatus) {
        setNotification({ message: "No tienes permiso para cambiar estados de compras", type: "error" });
        setIsStatusModalOpen(false);
        setPurchaseToChangeStatus(null);
        return;
      }
      try {
        await purchaseService.changeStatus(purchaseToChangeStatus.id, estadoId);
        setNotification({ message: "Estado actualizado correctamente", type: "success" });
        await loadCompras();
      } catch (err) {
        setNotification({ message: err?.response?.data?.message || "Error al cambiar estado", type: "error" });
      }
      setIsStatusModalOpen(false);
      setPurchaseToChangeStatus(null);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 font-sans text-gray-800 bg-white md:bg-transparent relative">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Compras</h1>
          <p className="text-xs text-gray-500">Gestión de adquisiciones</p>
        </div>
        {canCreate && (
          <button onClick={() => navigate(isEmployeePath ? "/employee/compras/nueva" : "/admin/compras/nueva")}
            className={`flex items-center gap-1.5 ${theme.main} ${theme.hover} text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm`}>
            <Plus size={16} /> Nuevo
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-3 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Buscar compra..."
            className={`w-full pl-9 pr-3 py-1.5 rounded-md border border-gray-300 focus:outline-none ${theme.focus} text-sm bg-white`}
            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
        </div>
        <input type="date"
          className={`w-40 pl-3 pr-3 py-1.5 rounded-md border border-gray-300 focus:outline-none ${theme.focus} text-sm bg-white`}
          value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} />
        <div className="relative w-36">
          <select className={`w-full pl-3 pr-8 py-1.5 rounded-md border border-gray-300 focus:outline-none ${theme.focus} text-sm bg-white appearance-none cursor-pointer`}
            value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
            <option value="Todos">Todos</option>
            {estados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className={`${theme.main} text-white sticky top-0 z-10`}>
              <tr>
                {["#", "Proveedor", "Fecha", "Total", "Items", "Estado", "Acciones"].map(h => (
                  <th key={h} className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400 text-xs">Cargando compras...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400 text-xs">No se encontraron compras.</td></tr>
              ) : (
                currentItems.map((compra) => (
                  <tr key={compra.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-1.5 px-3 text-xs font-medium text-gray-900">{compra.numeroCompra}</td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded ${theme.light} flex items-center justify-center ${theme.text} flex-shrink-0`}>
                          <ShoppingBag size={12} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 truncate max-w-[150px]">{compra.proveedorNombre}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-3 text-xs text-gray-500">
                      {compra.fechaCompra ? new Date(compra.fechaCompra).toLocaleDateString("es-CO") : "-"}
                    </td>
                    <td className={`py-1.5 px-3 text-xs font-bold ${theme.text} text-right`}>
                      ${compra.total?.toLocaleString()}
                    </td>
                    <td className="py-1.5 px-3 text-xs text-center text-gray-600 font-medium">
                      {(compra.detalles || []).length}
                    </td>
                    <td className="py-1.5 px-3 text-center">{getStatusBadge(compra.estadoNombre)}</td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => { setSelectedPurchase(compra); setModalMode("view"); setIsModalOpen(true); }}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors" title="Ver detalle">
                          <Eye size={16} />
                        </button>
                        {canChangeStatus && (
                          <button onClick={() => { setPurchaseToChangeStatus(compra); setIsStatusModalOpen(true); }}
                            className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors" title="Cambiar estado">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {canEdit && compra.estadoNombre?.toLowerCase() !== "recibida" && (
                          <button onClick={() => navigate(isEmployeePath ? "/employee/compras/nueva" : "/admin/compras/nueva", { state: { purchase: compra } })}
                            className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors" title="Editar">
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && compra.estadoNombre?.toLowerCase() !== "recibida" && (
                          <button onClick={() => setShowDeleteConfirm(compra)}
                            className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          accentColor={isEmployeePanel ? "blue" : "emerald"}
        />
      </div>

      <PurchaseModal isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedPurchase(null); setModalMode("create"); }}
        initialData={selectedPurchase} mode={modalMode} onSave={handleSave} onDelete={setShowDeleteConfirm} />

      {isStatusModalOpen && purchaseToChangeStatus && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className={`${theme.light} px-6 py-4 border-b ${theme.border} flex justify-between items-center`}>
              <h3 className="font-bold text-gray-900 text-lg">Cambiar Estado</h3>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-2">
              {estados.map(e => (
                <button key={e.id} onClick={() => confirmStatusChange(e.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm border transition-all ${
                    purchaseToChangeStatus.estadoId === e.id
                      ? `${theme.light} ${theme.border} ${theme.text} font-bold`
                      : "border-gray-200 hover:bg-gray-50"
                  }`}>
                  {e.nombre}
                </button>
              ))}
            </div>
            <div className={`${theme.light} border-t ${theme.border} p-4`}>
              <button onClick={() => setIsStatusModalOpen(false)} className="w-full py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!showDeleteConfirm}
        title="Eliminar Compra"
        message={showDeleteConfirm ? `¿Estás seguro de eliminar la compra ${showDeleteConfirm.numeroCompra}?` : ""}
        confirmText="Eliminar"
        danger
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={confirmDelete}
      />

      {notification && (
        <ToastNotification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}
    </div>
  );
};

export default PurchasesPage;