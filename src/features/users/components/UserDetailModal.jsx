import React from "react";
import { X, Phone, MapPin } from "lucide-react";

const UserDetailModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  const display = user;
  const avatar = display.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(display.nombre || display.email || "user")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 pb-4 pt-4 px-6 text-center">
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
          <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
            <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{display.nombre}</h2>
          <p className="text-xs text-gray-600 mt-0.5">{display.email}</p>
        </div>

        {/* Contenido */}
        <div className="px-6 py-3 grid grid-cols-2 gap-3">
          {/* Identificación */}
          <div className="col-span-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Identificación</p>
            <div className="bg-gray-50 rounded-lg p-3 min-h-[52px] flex items-center">
              <p className="text-gray-900 font-semibold text-sm">{display.tipoDocumento || "--"} - {display.documento || "No registrado"}</p>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Contacto</p>
            <div className="bg-gray-50 rounded-lg p-3 h-[52px] flex items-center gap-2">
              <Phone size={16} className="text-gray-600 flex-shrink-0" />
              <p className="text-gray-900 font-semibold text-sm truncate">{display.telefono || "No registrado"}</p>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Dirección</p>
            <div className="bg-gray-50 rounded-lg p-3 h-[52px] flex items-center gap-2">
              <MapPin size={16} className="text-gray-600 flex-shrink-0" />
              <p className="text-gray-900 font-semibold text-sm truncate">{display.direccion || "No registrada"}</p>
            </div>
          </div>

          {/* Rol */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Rol del Sistema</p>
            <div className="h-[52px] flex items-center">
              <span className="inline-block px-4 py-2 rounded-full text-sm font-bold bg-emerald-100 text-emerald-700">
                {display.rol || "No asignado"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
