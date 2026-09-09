import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff, AlertCircle } from "lucide-react";
import { userService } from "../services/userService";
import { formValidations } from "../../../shared/utils/formValidations";
import { getDocumentTypes, fetchDocumentTypes } from "../../settings/services/parameterService";

export const UserFormModal = ({ isOpen, onClose, onSave, userToEdit }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    tipoDocumentoId: "",
    documento: "",
    nombres: "",
    apellidos: "",
    email: "",
    rolId: "",
    password: "",
    confirmPassword: "",
    telefono: "",
    estado: true,
  });
  const [errors, setErrors] = useState({});
  const [rolesOptions, setRolesOptions] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  useEffect(() => {
    if (!isOpen) return;


    // Cargar tipos de documento desde backend con fallback a localStorage
    fetchDocumentTypes().then(types => setDocumentTypes(types));

    const handleParamUpdate = () => setDocumentTypes(getDocumentTypes());
    window.addEventListener("syspharma_parameters_updated", handleParamUpdate);

    if (userToEdit) {
      const nombreFull = userToEdit.nombre || "";
      const parts = nombreFull.trim().split(/\s+/);
      const nombres = parts[0] || "";
      const apellidos = parts.slice(1).join(" ") || "";

      setFormData({
        tipoDocumentoId: userToEdit.tipoDocumentoId ? String(userToEdit.tipoDocumentoId) : "",
        documento: userToEdit.documento || "",
        nombres,
        apellidos,
        email: userToEdit.email || "",
        rolId: userToEdit.rolId ? String(userToEdit.rolId) : "",
        password: "",
        confirmPassword: "",
        telefono: userToEdit.telefono || "",
        estado: typeof userToEdit.estado === "boolean" ? userToEdit.estado : true,
      });
    } else {
      setFormData({
        tipoDocumentoId: "", documento: "", nombres: "", apellidos: "",
        email: "", rolId: "", password: "", confirmPassword: "", telefono: "", estado: true,
      });
    }
    setErrors({});
    setGeneralError("");

    return () => window.removeEventListener("syspharma_parameters_updated", handleParamUpdate);
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData({ ...formData, [name]: newValue });

    let error = "";
    if (name === "nombres" || name === "apellidos") error = formValidations.validateName(newValue);
    else if (name === "documento") error = formValidations.validateDocument(newValue);
    else if (name === "telefono") error = formValidations.validatePhone(newValue);
    else if (name === "email") error = formValidations.validateEmail(newValue);
    setErrors({ ...errors, [name]: error });
  };

  const validate = () => {
    const newErrors = {};
    newErrors.nombres = formValidations.validateName(formData.nombres);
    newErrors.apellidos = formValidations.validateName(formData.apellidos);
    newErrors.documento = formValidations.validateDocument(formData.documento);
    newErrors.telefono = formValidations.validatePhone(formData.telefono);
    newErrors.email = formValidations.validateEmail(formData.email);
    setErrors(newErrors);

    if (!formData.tipoDocumentoId) { setGeneralError("Selecciona el tipo de documento"); return false; }
    if (!formData.rolId) { setGeneralError("Selecciona un rol"); return false; }
    if (!userToEdit && !formData.password) { setGeneralError("La contraseña es obligatoria"); return false; }
    if (!userToEdit && formData.password !== formData.confirmPassword) { setGeneralError("Las contraseñas no coinciden"); return false; }
    if (Object.values(newErrors).some(e => e)) { setGeneralError("Corrige los errores del formulario"); return false; }

    setGeneralError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setGeneralError(error?.response?.data?.message || "Error al guardar el usuario");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError = false) =>
    `w-full px-3 py-1.5 border rounded-lg text-xs outline-none focus:ring-1 transition-all bg-gray-50 focus:bg-white ${
      hasError ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:border-primary-400 focus:ring-primary-100"
    }`;
  const labelClass = "block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wide";

  const ErrorMsg = ({ error }) => error ? (
    <div className="flex items-center gap-1 mt-0.5 text-red-500 text-[9px]">
      <AlertCircle size={10} />{error}
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <h2 className="text-sm font-bold text-gray-800">{userToEdit ? "Editar Usuario" : "Nuevo Usuario"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors"><X size={18} /></button>
        </div>

        {/* Error general */}
        {generalError && (
          <div className="mx-4 mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle size={14} /> {generalError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {/* Tipo doc + Número */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className={labelClass}>Tipo Doc *</label>
              <select name="tipoDocumentoId" value={formData.tipoDocumentoId} onChange={handleChange} className={inputClass()} required>
                <option value="">--</option>
                {documentTypes.map(dt => (
                  <option key={dt.id} value={dt.id}>{dt.value}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Número *</label>
              <input type="text" name="documento" value={formData.documento} onChange={handleChange}
                placeholder="Ej: 12345678" className={inputClass(!!errors.documento)} required />
              <ErrorMsg error={errors.documento} />
            </div>
          </div>

          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nombres *</label>
              <input type="text" name="nombres" value={formData.nombres} onChange={handleChange}
                placeholder="Juan" className={inputClass(!!errors.nombres)} required />
              <ErrorMsg error={errors.nombres} />
            </div>
            <div>
              <label className={labelClass}>Apellidos *</label>
              <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange}
                placeholder="Pérez" className={inputClass(!!errors.apellidos)} required />
              <ErrorMsg error={errors.apellidos} />
            </div>
          </div>

          {/* Email y Teléfono */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="juan@mail.com" className={inputClass(!!errors.email)} required />
              <ErrorMsg error={errors.email} />
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
                placeholder="300..." className={inputClass(!!errors.telefono)} />
              <ErrorMsg error={errors.telefono} />
            </div>
          </div>

          {/* Rol y Estado */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className={labelClass}>Rol *</label>
              <select name="rolId" value={formData.rolId} onChange={handleChange} className={inputClass()} required>
                <option value="">Seleccionar</option>
                {rolesOptions.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg h-[34px]">
              <span className="text-[10px] font-bold text-gray-600 uppercase">Activo</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="estado" checked={formData.estado} onChange={handleChange} className="sr-only peer" />
                <div className="w-8 h-4 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>

          {/* Contraseñas */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className={labelClass}>Contraseña {userToEdit && "(Opcional)"}</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password}
                  onChange={handleChange} className={inputClass()} required={!userToEdit} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {!userToEdit && (
              <div>
                <label className={labelClass}>Confirmar *</label>
                <input type={showPassword ? "text" : "password"} name="confirmPassword"
                  value={formData.confirmPassword} onChange={handleChange} className={inputClass()} required />
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-50 text-xs">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg shadow-sm text-xs disabled:opacity-50">
            {loading ? "Guardando..." : userToEdit ? "Guardar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
};