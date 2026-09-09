import React, { useState, useEffect } from "react";
import { X, Save, Building2, User, Phone, Mail, MapPin, AlertCircle, FileText } from "lucide-react";
import { getDocumentTypes, fetchDocumentTypes } from "../../../settings/services/parameterService";

import { formValidations } from "../../../../shared/utils/formValidations";

const ProviderFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = "create",
  onDelete,
  canDelete = true,
  accentColor = "emerald",
}) => {
  const [formData, setFormData] = useState({
    nombre: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
    tipoDocumentoId: "",
    documento: "",
    estado: true,
  });
  const [errors, setErrors] = useState({});
  const [documentTypes, setDocumentTypes] = useState([]);

  useEffect(() => {
    // Cargar tipos de documento desde backend con fallback a localStorage
    fetchDocumentTypes().then(types => setDocumentTypes(types));

    const handleParamUpdate = () => setDocumentTypes(getDocumentTypes());
    window.addEventListener("syspharma_parameters_updated", handleParamUpdate);
    return () => window.removeEventListener("syspharma_parameters_updated", handleParamUpdate);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        nombre: initialData.nombre || "",
        contacto: initialData.contacto || "",
        telefono: initialData.telefono || "",
        email: initialData.email || "",
        direccion: initialData.direccion || "",
        tipoDocumentoId: initialData.tipoDocumentoId ? String(initialData.tipoDocumentoId) : "",
        documento: initialData.documento || "",
        estado: initialData.estado !== undefined ? initialData.estado : true,
      });
    } else {
      setFormData({
        nombre: "", contacto: "", telefono: "", email: "",
        direccion: "", tipoDocumentoId: "", documento: "", estado: true,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isView = mode === "view";
  const accent = accentColor === "blue"
    ? {
        text: "text-blue-600",
        focus: "focus:border-blue-500",
        main: "bg-blue-600 hover:bg-blue-700",
      }
    : {
        text: "text-emerald-600",
        focus: "focus:border-emerald-500",
        main: "bg-emerald-600 hover:bg-emerald-700",
      };

  const getTitle = () => {
    if (mode === "create") return "Nuevo Proveedor";
    if (mode === "edit") return "Editar Proveedor";
    return "Detalle del Proveedor";
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre?.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    const contactError = formValidations.validateName(formData.contacto);
    if (contactError) {
      newErrors.contacto = contactError;
    }

    if (formData.email) {
      const emailError = formValidations.validateEmail(formData.email);
      if (emailError) newErrors.email = emailError;
    }

    if (formData.telefono) {
      const phoneError = formValidations.validatePhone(formData.telefono);
      if (phoneError) newErrors.telefono = phoneError;
    }

    if (formData.tipoDocumentoId && !formData.documento?.trim()) {
      newErrors.documento = "El número de documento es obligatorio";
    } else if (formData.documento) {
      const docError = formValidations.validateDocument(formData.documento);
      if (docError) newErrors.documento = docError;
    }

    return newErrors;
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: "" });
  };

  const handleSubmit = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    if (onSave) onSave({
      ...formData,
      tipoDocumentoId: formData.tipoDocumentoId ? Number(formData.tipoDocumentoId) : null,
    });
  };

  const inputClass = (hasError) =>
    `w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none ${
      hasError ? "border-red-500" : `border-gray-300 ${accent.focus}`
    } disabled:bg-gray-100 disabled:text-gray-500`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Building2 size={16} className={accent.text} /> {getTitle()}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Nombre */}
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">Nombre de la Empresa *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                disabled={isView}
                className={inputClass(errors.nombre)}
                placeholder="Ej: Farmacéutica Global S.A."
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
              />
            </div>
            {errors.nombre && <div className="flex items-center gap-1 mt-1 text-red-500 text-xs"><AlertCircle size={12} /> {errors.nombre}</div>}
          </div>

          {/* Tipo Documento */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Documento</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                disabled={isView}
                className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none ${accent.focus} bg-white disabled:bg-gray-100 disabled:text-gray-500`}
                value={formData.tipoDocumentoId}
                onChange={(e) => handleChange("tipoDocumentoId", e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {documentTypes.map(dt => (
                  <option key={dt.id} value={dt.id}>{dt.value}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Documento */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Número de Documento</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                disabled={isView}
                className={inputClass(errors.documento)}
                placeholder="Ej: 900123456-1"
                value={formData.documento}
                onChange={(e) => handleChange("documento", e.target.value)}
              />
            </div>
            {errors.documento && <div className="flex items-center gap-1 mt-1 text-red-500 text-xs"><AlertCircle size={12} /> {errors.documento}</div>}
          </div>

          {/* Contacto */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nombre de Contacto *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                disabled={isView}
                className={inputClass(errors.contacto)}
                placeholder="Ej: Juan Pérez"
                value={formData.contacto}
                onChange={(e) => handleChange("contacto", e.target.value)}
              />
            </div>
            {errors.contacto && <div className="flex items-center gap-1 mt-1 text-red-500 text-xs"><AlertCircle size={12} /> {errors.contacto}</div>}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="tel"
                disabled={isView}
                className={inputClass(errors.telefono)}
                placeholder="+57 300 000 0000"
                value={formData.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
              />
            </div>
            {errors.telefono && <div className="flex items-center gap-1 mt-1 text-red-500 text-xs"><AlertCircle size={12} /> {errors.telefono}</div>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="email"
                disabled={isView}
                className={inputClass(errors.email)}
                placeholder="contacto@empresa.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
            {errors.email && <div className="flex items-center gap-1 mt-1 text-red-500 text-xs"><AlertCircle size={12} /> {errors.email}</div>}
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Estado</label>
            <select
              disabled={isView}
              className={`w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none ${accent.focus} bg-white disabled:bg-gray-100 disabled:text-gray-500`}
              value={formData.estado ? "true" : "false"}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value === "true" })}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>

          {/* Dirección */}
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">Dirección</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
              <textarea
                disabled={isView}
                className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none ${accent.focus} h-20 resize-none disabled:bg-gray-100 disabled:text-gray-500`}
                placeholder="Dirección del proveedor..."
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center">
          <div>
            {mode === "edit" && canDelete && (
              <button
                onClick={() => { if (onDelete) onDelete(formData); onClose(); }}
                className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md"
              >
                Eliminar
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
              {isView ? "Cerrar" : "Cancelar"}
            </button>
            {!isView && (
              <button
                onClick={handleSubmit}
                className={`px-4 py-2 text-xs font-bold text-white ${accent.main} rounded-md flex items-center gap-1 shadow-sm transition-colors`}
              >
                <Save size={14} /> Guardar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderFormModal;
