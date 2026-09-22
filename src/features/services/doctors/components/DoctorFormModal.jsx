import React, { useState, useEffect } from "react";
import { X, Save, User, Stethoscope, BookOpen, Mail, Phone, AlertCircle, CreditCard } from "lucide-react";
import { formValidations } from "../../../../shared/utils/formValidations";

const DoctorFormModal = ({ isOpen, onClose, onSave, doctor, accentColor = "emerald" }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    especialidad: "",
    documento: "",
    email: "",
    telefono: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (doctor) {
      setFormData({
        nombre: doctor.nombre || "",
        especialidad: doctor.especialidad || "",
        documento: doctor.documento || "",
        email: doctor.email || "",
        telefono: doctor.telefono || "",
      });
    } else {
      setFormData({ nombre: "", especialidad: "", documento: "", email: "", telefono: "" });
    }
    setErrors({});
  }, [doctor, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido";
    if (!formData.especialidad.trim()) newErrors.especialidad = "La especialidad es requerida";

    if (formData.email) {
      const emailError = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? "Email inválido" : "";
      if (emailError) newErrors.email = emailError;
    }

    if (formData.telefono) {
      const phoneError = formValidations.validatePhone(formData.telefono);
      if (phoneError) newErrors.telefono = phoneError;
    }

    if (formData.documento) {
      const docError = formValidations.validateDocument(formData.documento);
      if (docError) newErrors.documento = docError;
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setErrors({ general: error?.response?.data?.message || "Error al guardar el médico" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = (hasError) =>
    `w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 ${
      hasError ? "border-red-500 focus:ring-red-300" : `border-gray-300 ${accent.focus}`
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">

        <div className={`${accent.header} px-5 py-3 border-b flex justify-between items-center`}>
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Stethoscope size={16} className={accent.text} />
            {doctor ? `Editar Médico: ${doctor.nombre}` : "Nuevo Médico"}
          </h3>
          <button onClick={onClose} className={`text-gray-400 ${accent.hoverText} transition-colors`}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700 text-xs">
                <AlertCircle size={14} /> {errors.general}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  name="nombre"
                  className={inputClass(errors.nombre)}
                  placeholder="Ej: Dr. Juan Pérez"
                  value={formData.nombre}
                  onChange={handleInputChange}
                />
              </div>
              {errors.nombre && <div className="flex items-center gap-1 mt-1 text-red-500 text-xs"><AlertCircle size={12} />{errors.nombre}</div>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Especialidad *</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  name="especialidad"
                  className={inputClass(errors.especialidad)}
                  placeholder="Ej: Medicina General, Cardiología"
                  value={formData.especialidad}
                  onChange={handleInputChange}
                />
              </div>
              {errors.especialidad && <div className="flex items-center gap-1 mt-1 text-red-500 text-xs"><AlertCircle size={12} />{errors.especialidad}</div>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Documento</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    name="documento"
                    className={inputClass(errors.documento)}
                    placeholder="Número de documento"
                    value={formData.documento}
                    onChange={handleInputChange}
                  />
                </div>
                {errors.documento && <div className="flex items-center gap-1 mt-1 text-red-500 text-xs"><AlertCircle size={12} />{errors.documento}</div>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="tel"
                    name="telefono"
                    className={inputClass(errors.telefono)}
                    placeholder="3001234567"
                    value={formData.telefono}
                    onChange={handleInputChange}
                  />
                </div>
                {errors.telefono && <div className="flex items-center gap-1 mt-1 text-red-500 text-xs"><AlertCircle size={12} />{errors.telefono}</div>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  name="email"
                  className={inputClass(errors.email)}
                  placeholder="doctor@syspharma.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              {errors.email && <div className="flex items-center gap-1 mt-1 text-red-500 text-xs"><AlertCircle size={12} />{errors.email}</div>}
            </div>
          </div>

          <div className={`${accent.header} px-5 py-3 border-t flex justify-end gap-2`}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-xs font-bold text-white ${accent.button} rounded-md flex items-center gap-1 shadow-sm transition-colors disabled:opacity-50`}
            >
              <Save size={16} /> {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorFormModal;
