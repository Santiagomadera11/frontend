import React, { useEffect, useState } from "react";
import { X, Save, Phone } from "lucide-react";
import { ToastNotification } from "../../../shared/ui/ToastNotification";
import { userService } from "../services/userService";

const UserDetailModal = ({ isOpen, onClose, user, onUpdate }) => {
  const [local, setLocal] = useState(null);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
  }, [isOpen]);

  useEffect(() => {
    setLocal(user ? { ...user } : null);
    setEditing(false);
  }, [user]);

  if (!isOpen || !local) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocal(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    if (!local.nombre || !local.email) {
      setToast({ message: "Nombre y correo son obligatorios", type: "error", zIndex: 70 });
      return;
    }
    try {
      await onUpdate(local);
      setToast({ message: "Usuario actualizado", type: "success", zIndex: 70 });
      setEditing(false);
      setTimeout(() => onClose(), 700);
    } catch (error) {
      setToast({ message: error?.response?.data?.message || "Error al actualizar", type: "error", zIndex: 70 });
    }
  };

  const display = local || {};
  const avatar = display.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(display.nombre || display.email || "user")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 pb-8 pt-4 px-6 text-center">
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${display.estado ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
              {display.estado ? "Activo" : "Inactivo"}
            </span>
          </div>
          <div className="absolute top-4 right-4">
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-white/50">
              <X size={20} />
            </button>
          </div>
          <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
            <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{display.nombre}</h2>
          <p className="text-xs text-gray-600 mt-1">{display.email}</p>
        </div>

        {/* Contenido */}
        <div className="px-6 py-4 space-y-4">
          {/* Identificación */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Identificación</p>
            <div className="bg-gray-50 rounded-lg p-4">
              {editing ? (
                <div className="grid grid-cols-3 gap-2">
                  <select name="tipoDocumento" value={display.tipoDocumento || ""} onChange={handleChange}
                    className="col-span-1 w-full px-2 py-2 border rounded text-sm font-medium">
                    <option value="">--</option>
                    <option value="CC">CC</option>
                    <option value="TI">TI</option>
                    <option value="CE">CE</option>
                    <option value="PP">PP</option>
                  </select>
                  <input name="documento" value={display.documento || ""} onChange={handleChange}
                    placeholder="Número" className="col-span-2 w-full px-2 py-2 border rounded text-sm font-medium" />
                </div>
              ) : (
                <p className="text-gray-900 font-semibold">{display.tipoDocumento || "--"} - {display.documento || "No registrado"}</p>
              )}
            </div>
          </div>

          {/* Contacto */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Contacto</p>
            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
              <Phone size={18} className="text-gray-600 flex-shrink-0" />
              {editing ? (
                <input name="telefono" value={display.telefono || ""} onChange={handleChange}
                  placeholder="Número de celular" className="flex-1 px-2 py-2 border rounded text-sm font-medium" />
              ) : (
                <p className="text-gray-900 font-semibold">{display.telefono || "No registrado"}</p>
              )}
            </div>
          </div>

          {/* Rol */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Rol del Sistema</p>
            {editing ? (
              <select name="rolId" value={display.rolId || ""} onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:border-emerald-500">
                <option value="">Seleccionar</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            ) : (
              <span className="inline-block px-4 py-2 rounded-full text-sm font-bold bg-emerald-100 text-emerald-700">
                {display.rol || "No asignado"}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-2 p-4 border-t ${editing ? "bg-gray-50" : ""}`}>
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
              Editar
            </button>
          )}
          {editing && (
            <>
              <button onClick={() => { setEditing(false); setLocal({ ...user }); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">
                Cancelar
              </button>
              <button onClick={handleSave}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 font-medium text-sm">
                <Save size={16} /> Guardar
              </button>
            </>
          )}
        </div>

        {toast && <ToastNotification message={toast.message} type={toast.type} zIndex={toast.zIndex} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
};

export default UserDetailModal;