import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog.jsx";
import {
  fetchDocumentTypes, createTipoDocumento, updateTipoDocumento, deleteTipoDocumento,
  fetchPaymentMethods, createMetodoPago, updateMetodoPago, deleteMetodoPago,
  fetchServiceCategories, createCategoriaServicio, updateCategoriaServicio, deleteCategoriaServicio,
} from "../services/parameterService";

const TABS = [
  { id: "categories", label: "Categorías de Servicio", type: "serviceCategories" },
  { id: "payments",   label: "Métodos de Pago",        type: "paymentMethods"    },
  { id: "documents",  label: "Tipos de Documento",     type: "documentTypes"     },
];

const ParameterManagement = ({ user }) => {
  const isAdmin = user?.rol?.toLowerCase() === "administrador";
  const userPerms = (user?.permisos || []).map((perm) => String(perm || "").toLowerCase().trim());
  const hasPerm = (perm) => isAdmin || userPerms.includes(perm);
  const canManageParameters = isAdmin || userPerms.some((perm) => (
    perm.startsWith("config.service_categories.") ||
    perm.startsWith("config.payment_methods.") ||
    perm.startsWith("config.document_types.")
  ));

  const [activeTab, setActiveTab]   = useState("categories");
  const [data, setData]             = useState({ serviceCategories: [], paymentMethods: [], documentTypes: [] });
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [modalMode, setModalMode]   = useState("add");
  const [currentType, setCurrentType] = useState("serviceCategories");
  const [editingItem, setEditingItem] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [error, setError]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [notification, setNotification] = useState(null);

  const [confirmConfig, setConfirmConfig] = useState({
    open: false, title: "", message: "", onConfirm: null,
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, payments, docs] = await Promise.all([
        fetchServiceCategories(),
        fetchPaymentMethods(),
        fetchDocumentTypes(),
      ]);
      setData({ serviceCategories: cats, paymentMethods: payments, documentTypes: docs });
    } catch {
      setData({ serviceCategories: [], paymentMethods: [], documentTypes: [] });
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadAll();
    window.addEventListener("syspharma_parameters_updated", loadAll);
    return () => window.removeEventListener("syspharma_parameters_updated", loadAll);
  }, [loadAll]);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  if (!canManageParameters) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">No tienes permisos para gestionar parámetros.</p>
      </div>
    );
  }

  const openAddModal = (type) => {
    if (!canCreateType(type)) return;
    setCurrentType(type);
    setModalMode("add");
    setInputValue("");
    setEditingItem(null);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (type, item) => {
    if (!canEditType(type)) return;
    setCurrentType(type);
    setModalMode("edit");
    setEditingItem(item);
    setInputValue(item.value);
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (modalMode === "add" && !canCreateType(currentType)) {
      setError("No tienes permiso para crear este parámetro");
      return;
    }
    if (modalMode === "edit" && !canEditType(currentType)) {
      setError("No tienes permiso para editar este parámetro");
      return;
    }

    if (!inputValue.trim()) { setError("El valor no puede estar vacío"); return; }
    const current = data[currentType] || [];
    const isDuplicate = current.some(
      i => i.value.toLowerCase() === inputValue.toLowerCase() && i.id !== editingItem?.id
    );
    if (isDuplicate) { setError("Este valor ya existe"); return; }

    setSaving(true);
    try {
      if (modalMode === "add") {
        if (currentType === "serviceCategories") await createCategoriaServicio(inputValue.trim());
        else if (currentType === "paymentMethods") await createMetodoPago(inputValue.trim());
        else await createTipoDocumento(inputValue.trim());
        setNotification({ message: "Parámetro creado correctamente", type: "success" });
      } else {
        if (currentType === "serviceCategories") await updateCategoriaServicio(editingItem.id, inputValue.trim());
        else if (currentType === "paymentMethods") await updateMetodoPago(editingItem.id, inputValue.trim());
        else await updateTipoDocumento(editingItem.id, inputValue.trim());
        setNotification({ message: "Parámetro actualizado correctamente", type: "success" });
      }
      await loadAll();
      setShowModal(false);
      setInputValue("");
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (type, item) => {
    if (!canDeleteType(type)) {
      setNotification({ message: "No tienes permiso para eliminar este parámetro", type: "error" });
      return;
    }

    setConfirmConfig({
      open: true,
      title: "Eliminar parámetro",
      message: `¿Eliminar "${item.value}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          if (type === "serviceCategories") await deleteCategoriaServicio(item.id);
          else if (type === "paymentMethods") await deleteMetodoPago(item.id);
          else await deleteTipoDocumento(item.id);
          setNotification({ message: "Parámetro eliminado correctamente", type: "success" });
          await loadAll();
        } catch (err) {
          setNotification({ message: err?.response?.data?.message || "Error al eliminar", type: "error" });
        }
      },
    });
  };

  const ParameterTable = ({ type, label }) => {
    const items = data[type] || [];
    return (
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">{label}</h3>
          {canCreateType(type) && (
            <button
              onClick={() => openAddModal(type)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
            >
              <Plus size={14} /> Agregar
            </button>
          )}
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No hay parámetros configurados</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item, i) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-sm text-slate-400">{i + 1}</td>
                  <td className="px-5 py-3 text-sm font-bold text-slate-700">{item.value}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-center gap-1.5">
                      {canEditType(type) && (
                        <button onClick={() => openEditModal(type, item)} className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors" title="Editar">
                          <Edit size={16} />
                        </button>
                      )}
                      {canDeleteType(type) && (
                        <button onClick={() => handleDelete(type, item)} className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  const activeTabData = TABS.find(t => t.id === activeTab);
  const PERMS_BY_TYPE = {
    serviceCategories: {
      create: "config.service_categories.create",
      edit: "config.service_categories.edit",
      delete: "config.service_categories.delete",
    },
    paymentMethods: {
      create: "config.payment_methods.create",
      edit: "config.payment_methods.edit",
      delete: "config.payment_methods.delete",
    },
    documentTypes: {
      create: "config.document_types.create",
      edit: "config.document_types.edit",
      delete: "config.document_types.delete",
    },
  };

  const canCreateType = (type) => hasPerm(PERMS_BY_TYPE[type]?.create);
  const canEditType = (type) => hasPerm(PERMS_BY_TYPE[type]?.edit);
  const canDeleteType = (type) => hasPerm(PERMS_BY_TYPE[type]?.delete);

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-slate-100">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-black text-xs uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTabData && <ParameterTable type={activeTabData.type} label={activeTabData.label} />}

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-blue-700 text-xs font-medium">ℹ️ Los cambios se guardan en la base de datos y se aplican inmediatamente en todos los formularios.</p>
      </div>

      {/* Modal agregar / editar */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                {modalMode === "add" ? "Agregar" : "Editar"} parámetro
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Valor *</label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  className={`w-full p-4 rounded-2xl border-2 focus:border-emerald-500 outline-none font-bold text-slate-700 transition-all ${error ? "border-rose-300" : "border-slate-100"}`}
                  placeholder="Ingresa el valor"
                  autoFocus
                />
                {error && <p className="text-rose-500 text-xs mt-1 ml-1 font-bold">{error}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all">
                  <Save size={16} /> {saving ? "Guardando..." : "Guardar"}
                </button>
                <button onClick={() => setShowModal(false)}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                  <X size={16} /> Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmConfig.open}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onCancel={() => setConfirmConfig(c => ({ ...c, open: false }))}
        onConfirm={() => { confirmConfig.onConfirm?.(); setConfirmConfig(c => ({ ...c, open: false })); }}
      />

      {notification && (
        <div className={`fixed bottom-4 left-4 px-4 py-3 rounded-2xl shadow-lg z-50 text-xs font-black uppercase tracking-widest ${
          notification.type === "success"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-rose-50 text-rose-700 border border-rose-200"
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default ParameterManagement;