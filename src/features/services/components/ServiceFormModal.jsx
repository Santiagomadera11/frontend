import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Stethoscope,
  Clock,
  DollarSign,
  FileText,
  Eye,
  AlertCircle,
} from "lucide-react";
import { formValidations } from "../../../shared/utils/formValidations";
import { getServiceCategories } from "../../settings/services/parameterService";
import { ToastNotification } from "../../../shared/ui/ToastNotification";

const ServiceFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isViewMode,
}) => {
  // 🟢 VERSIÓN ADMIN - SIEMPRE VERDE
  const headerBgColor = "bg-emerald-600";
  const buttonBgColor = "bg-emerald-600 hover:bg-emerald-700";
  const focusBorderColor = "focus:border-emerald-500";

  const [formData, setFormData] = useState({
    id: "", // <-- AGREGADO AL ESTADO INICIAL
    nombre: "",
    categoriaId: "",
    estado: "Activo",
    precio: "",
    duracion: "",
    descripcion: "",
  });

  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const cats = getServiceCategories();
    setCategories(cats);
    const defaultCat = cats.length > 0 ? cats[0].id : "";

    if (initialData) {
      setFormData({
        ...initialData,
        // Normalizar estado a string "Activo"/"Inactivo" para el select
        estado: initialData.estado === true || initialData.estado === "Activo" ? "Activo" : "Inactivo",
        // Asegurar que categoriaId sea string para que el select lo muestre bien
        categoriaId: String(initialData.categoriaId ?? ""),
      });
    } else {
      setFormData({
        id: "", // <-- LIMPIAR ID AL CREAR NUEVO
        nombre: "",
        categoriaId: String(defaultCat),
        estado: "Activo",
        precio: "",
        duracion: "",
        descripcion: "",
      });
    }
    setErrors({});
    setToast(null);

    const handleParameterUpdate = () => {
      const updatedCats = getServiceCategories();
      setCategories(updatedCats);
    };

    window.addEventListener("syspharma_parameters_updated", handleParameterUpdate);
    return () => {
      window.removeEventListener("syspharma_parameters_updated", handleParameterUpdate);
    };
  }, [initialData, isOpen, isViewMode]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    let error = "";
    if (field === "nombre") {
      error = formValidations.validateService(value);
    }
    setErrors({ ...errors, [field]: error });
  };

  const handleSubmit = () => {
    const newErrors = {};
    const nameError = formValidations.validateService(formData.nombre);
    if (nameError) {
      newErrors.nombre = nameError;
    } else if (!formData.nombre || !formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio.";
    }

    if (!formData.precio) {
      newErrors.precio = "El precio es obligatorio.";
    } else if (Number(formData.precio) <= 0) {
      newErrors.precio = "El precio debe ser un número mayor a cero.";
    }

    if (formData.duracion && Number(formData.duracion) <= 0) {
      newErrors.duracion = "La duración debe ser mayor a cero.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const dataToSave = {
      nombre: formData.nombre,
      // parseInt garantiza que llegue como número entero, nunca como string
      categoriaId: parseInt(formData.categoriaId, 10),
      precio: parseFloat(formData.precio),
      // null si viene vacío para respetar el int? del DTO
      duracion: formData.duracion ? parseInt(formData.duracion, 10) : null,
      // null si viene vacío para respetar el string? del DTO
      descripcion: formData.descripcion || null,
      // bool para respetar el bool del ServicioUpdateDto
      estado: formData.estado === "Activo",
    };

    onSave(dataToSave);

    const action = initialData ? "actualizado" : "creado";
    setToast({
      message: `Servicio ${action} correctamente`,
      type: "success",
      zIndex: 60,
    });

    setTimeout(() => {
      onClose();
    }, 500);
  };

  const getTitle = () => {
    if (isViewMode) return "Detalle del Servicio";
    return initialData ? "Editar Servicio" : "Nuevo Servicio";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className={`${headerBgColor} px-5 py-3 border-b flex justify-between items-center`}>
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            {isViewMode ? <Eye size={16} /> : <Stethoscope size={16} />}
            {getTitle()}
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            
            {/* Campo ID - Se muestra solo si el servicio ya existe (Edición o Vista de Detalles) */}
            {formData.id && (
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">ID</label>
                <input
                  type="text"
                  disabled
                  className="w-full pl-3 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-500 focus:outline-none"
                  value={formData.id}
                />
              </div>
            )}

            {/* Campo Nombre - Ocupa la mitad si se muestra el ID, o el ancho completo si es nuevo */}
            <div className={formData.id ? "col-span-1" : "col-span-2"}>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                disabled={isViewMode}
                className={`w-full pl-3 pr-3 py-2 text-sm border rounded-md focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 ${
                  errors.nombre
                    ? "border-red-500 focus:ring-1 focus:ring-red-300"
                    : `border-gray-300 ${focusBorderColor}`
                }`}
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
              />
              {errors.nombre && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                  <AlertCircle size={12} />
                  {errors.nombre}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Categoría</label>
              <select
                disabled={isViewMode}
                className={`w-full pl-2 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none ${focusBorderColor} bg-white disabled:bg-gray-100 disabled:text-gray-500`}
                value={formData.categoriaId}
                onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Estado</label>
              <select
                disabled={isViewMode}
                className={`w-full pl-2 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none ${focusBorderColor} bg-white disabled:bg-gray-100 disabled:text-gray-500`}
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md border border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Precio ($) *</label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="number"
                  disabled={isViewMode}
                  className={`w-full pl-7 pr-3 py-1.5 text-sm border rounded-md focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 ${
                    errors.precio ? "border-red-500 focus:ring-1 focus:ring-red-300" : `border-gray-300 ${focusBorderColor}`
                  }`}
                  value={formData.precio}
                  onChange={(e) => {
                    setFormData({ ...formData, precio: e.target.value });
                    if (errors.precio) setErrors({ ...errors, precio: null });
                  }}
                />
              </div>
              {errors.precio && <p className="text-red-500 text-[10px] mt-1">{errors.precio}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Duración (min)</label>
              <div className="relative">
                <Clock className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="number"
                  disabled={isViewMode}
                  className={`w-full pl-7 pr-3 py-1.5 text-sm border rounded-md focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 ${
                    errors.duracion ? "border-red-500 focus:ring-1 focus:ring-red-300" : `border-gray-300 ${focusBorderColor}`
                  }`}
                  value={formData.duracion}
                  onChange={(e) => {
                    setFormData({ ...formData, duracion: e.target.value });
                    if (errors.duracion) setErrors({ ...errors, duracion: null });
                  }}
                />
              </div>
              {errors.duracion && <p className="text-red-500 text-[10px] mt-1">{errors.duracion}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Descripción</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
              <textarea
                disabled={isViewMode}
                className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none ${focusBorderColor} h-20 resize-none disabled:bg-gray-100 disabled:text-gray-500`}
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
          >
            {isViewMode ? "Cerrar" : "Cancelar"}
          </button>
          {!isViewMode && (
            <button
              onClick={handleSubmit}
              className={`px-4 py-2 text-xs font-bold text-white ${buttonBgColor} rounded-md flex items-center gap-1 shadow-sm transition-colors`}
            >
              <Save size={16} /> Guardar
            </button>
          )}
        </div>
      </div>

      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          zIndex={toast.zIndex}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ServiceFormModal;