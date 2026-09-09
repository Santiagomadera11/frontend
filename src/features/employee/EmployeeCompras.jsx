import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Search, Eye, Edit, Trash2,
  ChevronLeft, ChevronRight, Filter, ShoppingBag, AlertCircle, CheckCircle
} from "lucide-react";
import PurchaseModal from "../inventory/purchases/components/PurchaseFormModal";
import { purchaseService } from "../inventory/purchases/services/purchaseService";

export const EmployeeCompras = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [compras, setCompras] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [notification, setNotification] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const isMountedRef = useRef(false);
  const isLoadingRef = useRef(false);

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
    return matchText && matchStatus;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const getStatusBadge = (estado) => {
    const baseClass = "px-2 py-0.5 rounded text-[10px] font-bold border";
    const lower = (estado || "").toLowerCase();
    if (lower === "recibida") return <span className={`${baseClass} bg-green-50 text-green-700 border-green-200`}>Recibida</span>;
    if (lower === "pendiente") return <span className={`${baseClass} bg-blue-50 text-blue-700 border-blue-200`}>Pendiente</span>;
    if (lower === "en camino") return <span className={`${baseClass} bg-yellow-50 text-yellow-700 border-yellow-200`}>En Camino</span>;
    if (lower === "cancelada") return <span className={`${baseClass} bg-red-50 text-red-700 border-red-200`}>Cancelada</span>;
    return <span className={`${baseClass} bg-gray-50 text-gray-700 border-gray-200`}>{estado}</span>;
  };

  const handleSave = async (data) => {
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
    if (!showDeleteConfirm) return;
    try {
      await purchaseService.delete(showDeleteConfirm.id);
      setNotification({ message: "Compra eliminada correctamente", type: "success" });
      await loadCompras();
    } catch (err) {
      setNotification({ message: err?.response?.data?.message || "Error al eliminar", type: "error" });
    }
    setShowDeleteConfirm(null);
  };

  return (
    <div className="h-full flex flex-col p-6 font-sans text-gray-800 bg-white md:bg-transparent relative">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Compras</h1>
          <p className="text-xs text-gray-500">Gestión de adquisiciones</p>
        </div>
        <button onClick={() => { setSelectedPurchase(null); setModalMode("create"); setIsModalOpen(true); }}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-sm">
          <Plus size={16} /> Nueva
        </button>
      </div>

      <div className="flex gap-3 mb-3 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Buscar compra..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400 text-sm bg-white"
            value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
        </div>
        <div className="relative w-36">
          <select className="w-full pl-3 pr-8 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400 text-sm bg-white appearance-none cursor-pointer"
            value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
            <option value="Todos">Todos</option>
            {estados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-blue-600 text-white sticky top-0 z-10">
              <tr>
                {["#", "Proveedor", "Fecha", "Total", "Items", "Estado", "Acciones"].map(h => (
                  <th key={h} className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400 text-xs">Cargando...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400 text-xs">No se encontraron compras.</td></tr>
              ) : (
                currentItems.map(compra => (
                  <tr key={compra.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-1.5 px-3 text-xs font-medium text-gray-900">{compra.numeroCompra}</td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                          <ShoppingBag size={12} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 truncate max-w-[150px]">{compra.proveedorNombre}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-3 text-xs text-gray-500">
                      {compra.fechaCompra ? new Date(compra.fechaCompra).toLocaleDateString("es-CO") : "-"}
                    </td>
                    <td className="py-1.5 px-3 text-xs font-bold text-blue-600 text-right">
                      ${compra.total?.toLocaleString()}
                    </td>
                    <td className="py-1.5 px-3 text-xs text-center text-gray-600 font-medium">
                      {(compra.detalles || []).length}
                    </td>
                    <td className="py-1.5 px-3 text-center">{getStatusBadge(compra.estadoNombre)}</td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setSelectedPurchase(compra); setModalMode("view"); setIsModalOpen(true); }}
                          className="p-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50" title="Ver">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => { setSelectedPurchase(compra); setModalMode("edit"); setIsModalOpen(true); }}
                          className="p-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50" title="Editar">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => setShowDeleteConfirm(compra)}
                          className="p-1 rounded border border-red-200 text-red-600 hover:bg-red-50" title="Eliminar">
                          <Trash2 size={14} />
                        </button>
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
              className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={14} /></button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      <PurchaseModal isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedPurchase(null); setModalMode("create"); }}
        initialData={selectedPurchase} mode={modalMode} onSave={handleSave} onDelete={setShowDeleteConfirm} />

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-200 flex items-center gap-3">
              <AlertCircle size={24} className="text-red-600" />
              <h3 className="font-bold text-gray-900">Eliminar Compra</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-sm mb-1">¿Eliminar la compra <strong>{showDeleteConfirm.numeroCompra}</strong>?</p>
              <p className="text-gray-500 text-xs">Esta acción no se puede deshacer.</p>
            </div>
            <div className="bg-red-50 border-t border-red-200 p-4 flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={confirmDelete}
                className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center gap-2">
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className={`fixed bottom-4 left-4 px-4 py-3 rounded-lg shadow-lg z-50 text-sm font-medium flex items-center gap-2 ${
          notification.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {notification.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default EmployeeCompras;