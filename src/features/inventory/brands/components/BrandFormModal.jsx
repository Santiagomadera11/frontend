import React, { useState, useEffect } from "react";
import { X, Save, Award, FileText, Activity } from "lucide-react";

const BrandFormModal = ({ isOpen, onClose, initialData = null, mode = 'create', onSave, accentColor = "emerald" }) => {
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', estado: true });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setErrors({});
    if (initialData) {
      setFormData({
        ...initialData,
        estado: typeof initialData.estado === 'boolean' ? initialData.estado : (initialData.estado === 'Activo')
      });
    } else {
      setFormData({ nombre: '', descripcion: '', estado: true });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isView = mode === 'view';
  const accent = accentColor === "blue"
    ? {
        header: "bg-blue-50 border-blue-200",
        text: "text-blue-600",
        hoverText: "hover:text-blue-600",
        focus: "focus:border-blue-500 focus:ring-blue-500",
        button: "bg-blue-600 hover:bg-blue-700",
        iconBg: "bg-blue-100",
      }
    : {
        header: "bg-emerald-50 border-emerald-200",
        text: "text-emerald-600",
        hoverText: "hover:text-emerald-600",
        focus: "focus:border-emerald-500 focus:ring-emerald-500",
        button: "bg-emerald-600 hover:bg-emerald-700",
        iconBg: "bg-emerald-100",
      };

  const handleSubmit = () => {
    const newErrors = {};
    if (!formData.nombre || !formData.nombre.trim()) {
      newErrors.nombre = "El nombre de la marca es obligatorio.";
    } else if (formData.nombre.trim().length > 100) {
      newErrors.nombre = "El nombre no puede superar los 100 caracteres.";
    }
    if (formData.descripcion && formData.descripcion.trim().length > 500) {
      newErrors.descripcion = "La descripción no puede superar los 500 caracteres.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (onSave) {
      onSave({
        ...formData,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion ? formData.descripcion.trim() : "",
        estado: formData.estado
      });
    }
  };

  const title = mode === 'create' ? 'Nueva Marca' : (mode === 'edit' ? 'Editar Marca' : 'Detalle de Marca');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className={`${accent.header} px-5 py-3 border-b flex justify-between items-center`}>
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Award size={16} className={accent.text}/> {title}
          </h3>
          <button onClick={onClose} className={`text-gray-400 ${accent.hoverText} transition-colors`}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {isView ? (
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-lg ${accent.iconBg} ${accent.text} flex-shrink-0`}>
                <Award size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-semibold text-gray-900 truncate">{formData.nombre}</h4>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mt-1.5 ${formData.estado ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {formData.estado ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-gray-100">
              <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Descripción</label>
              <p className="text-xs text-gray-700 whitespace-pre-line">{formData.descripcion || "Sin descripción disponible."}</p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">

            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nombre de la Marca</label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none ${accent.focus} focus:ring-1 ${errors.nombre ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
                  placeholder="Ej: Genfar"
                  value={formData.nombre}
                  onChange={(e) => {
                    setFormData({...formData, nombre: e.target.value});
                    if (errors.nombre) setErrors({...errors, nombre: null});
                  }}
                />
              </div>
              {errors.nombre && <p className="text-red-500 text-[10px] mt-1">{errors.nombre}</p>}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Descripción</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
                <textarea
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none ${accent.focus} h-24 resize-none ${errors.descripcion ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
                  placeholder="Descripción breve de la marca..."
                  value={formData.descripcion}
                  onChange={(e) => {
                    setFormData({...formData, descripcion: e.target.value});
                    if (errors.descripcion) setErrors({...errors, descripcion: null});
                  }}
                />
              </div>
              {errors.descripcion && <p className="text-red-500 text-[10px] mt-1">{errors.descripcion}</p>}
            </div>

            {/* Estado */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Estado</label>
              <div className="relative">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select
                  className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none ${accent.focus} bg-white appearance-none cursor-pointer`}
                  value={formData.estado ? 'true' : 'false'}
                  onChange={(e) => setFormData({...formData, estado: e.target.value === 'true'})}
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>

          </div>
        )}

        {/* Footer */}
        <div className={`${accent.header} px-5 py-3 border-t flex justify-end gap-2`}>
          {isView ? (
            <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Cerrar</button>
          ) : (
            <button onClick={handleSubmit} className={`px-4 py-2 text-xs font-bold text-white ${accent.button} rounded-md flex items-center gap-1 shadow-sm transition-colors`}>
              <Save size={16} /> Guardar
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default BrandFormModal;
