import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect, useRef } from "react";
import { Camera, Lock, Edit2, Check, X } from "lucide-react";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import { ToastNotification } from "../../shared/ui/ToastNotification";
import { authService } from "../auth//authService";
import { getDocumentTypes } from "../settings/services/parameterService";
import { userService } from "../users/services/userService";

export const ClientMiPerfil = () => {
  const { currentUser, refreshUser } = useCurrentUser();
  const [user, setUser] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    telefono: "",
    documento: "",
    correo: "",
    direccion: "",
    tipoDocumento: "",
  });

  const [tempAvatar, setTempAvatar] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);
  const fileInputRef = useRef(null);

  const userRole = (currentUser?.rol || "").toLowerCase().trim();
  const isEmployeePanel = userRole !== "administrador";
  const theme = isEmployeePanel
    ? {
        spinner: "border-blue-500",
        avatarGradient: "from-blue-100 to-blue-50",
        avatarBorder: "border-blue-300",
        avatarText: "text-blue-600",
        solidBtn: "bg-blue-600 hover:bg-blue-700",
        badgeBg: "bg-blue-100",
        badgeText: "text-blue-700",
        ghostBtn: "bg-blue-50 hover:bg-blue-100 text-blue-600",
        ring: "focus:ring-blue-400",
        secBoxBg: "bg-blue-50",
        secBoxBorder: "border-blue-200",
        secIcon: "text-blue-600",
        secTitle: "text-blue-900",
        secText: "text-blue-700",
        secDate: "text-blue-600",
      }
    : {
        spinner: "border-emerald-500",
        avatarGradient: "from-emerald-100 to-emerald-50",
        avatarBorder: "border-emerald-300",
        avatarText: "text-emerald-600",
        solidBtn: "bg-emerald-600 hover:bg-emerald-700",
        badgeBg: "bg-emerald-100",
        badgeText: "text-emerald-700",
        ghostBtn: "bg-emerald-50 hover:bg-emerald-100 text-emerald-600",
        ring: "focus:ring-emerald-400",
        secBoxBg: "bg-emerald-50",
        secBoxBorder: "border-emerald-200",
        secIcon: "text-emerald-600",
        secTitle: "text-emerald-900",
        secText: "text-emerald-700",
        secDate: "text-emerald-600",
      };

  useEffect(() => {
    if (!currentUser) return;
    setUser(currentUser);

    const full = (currentUser.nombre || "").trim();
    let derivedFirst = "";
    let derivedLast = "";

    if (full) {
      const parts = full.split(/\s+/);
      derivedFirst = parts.slice(0, 1).join(" ") || "";
      derivedLast = parts.slice(1).join(" ") || "";
    }

    setFormData({
      nombres: derivedFirst || currentUser.nombres || "",
      apellidos: derivedLast || currentUser.apellidos || "",
      telefono: currentUser.telefono || "",
      documento: currentUser.documento || "",
      correo: currentUser.email || currentUser.correo || "",
      direccion: currentUser.direccion || "",
      tipoDocumento: currentUser.tipoDocumentoId || "",
    });

    try {
      const types = getDocumentTypes();
      setDocumentTypes(types || []);
    } catch {
      setDocumentTypes([]);
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!formData.nombres.trim() || !formData.apellidos.trim() || !formData.documento.trim()) {
      setToast({
        message: "Completa los campos requeridos (*)",
        type: "error",
        zIndex: 70,
      });
      return;
    }

    if (formData.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      setToast({
        message: "El correo electrónico ingresado no es válido",
        type: "error",
        zIndex: 70,
      });
      return;
    }

    if (formData.telefono && !/^\+?[0-9\s-]{7,15}$/.test(formData.telefono)) {
      setToast({
        message: "El teléfono no es válido (debe tener entre 7 y 15 dígitos)",
        type: "error",
        zIndex: 70,
      });
      return;
    }

    if (!user || !user.id) {
      setToast({
        message: "No se encontro una sesion activa de usuario",
        type: "error",
        zIndex: 70,
      });
      return;
    }

    try {
      const result = await authService.updateProfile(user.id, {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        email: formData.correo,
        tipoDocumentoId: formData.tipoDocumento ? Number(formData.tipoDocumento) : null,
        documento: formData.documento,
        telefono: formData.telefono,
        direccion: formData.direccion,
      });

      if (result.error) {
        setToast({ message: result.message, type: "error", zIndex: 70 });
        return;
      }

      await refreshUser();
      setIsEditing(false);
      setToast({
        message: "Perfil actualizado correctamente en el sistema",
        type: "success",
        zIndex: 70,
      });
    } catch {
      setToast({
        message: "Error de conexion al guardar los cambios",
        type: "error",
        zIndex: 70,
      });
    }
  };

  const handlePasswordChanged = () => {
    setToast({
      message: "Contraseña actualizada correctamente",
      type: "success",
      zIndex: 70,
    });
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-8 font-sans">
        <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${theme.spinner} mr-3`}></div>
        <span className="text-gray-600 font-medium">Cargando perfil...</span>
      </div>
    );
  }

  const getInitials = () => {
    const full = (user.nombre || formData.nombres || "").trim();
    if (!full) return "US";
    const parts = full.split(/\s+/);
    const firstName = parts[0] || "";
    const firstLast = parts[1] || "";
    return `${firstName.charAt(0) || ""}${firstLast.charAt(0) || ""}`.toUpperCase();
  };

  const lastPasswordUpdate = user.lastPasswordUpdate
    ? new Date(user.lastPasswordUpdate).toLocaleDateString()
    : new Date(user.createdAt || Date.now()).toLocaleDateString();

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gestiona tu información personal y seguridad
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 items-start">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col items-center justify-start">
          <div className="relative mb-4 w-28 h-28">
            <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${theme.avatarGradient} flex items-center justify-center border-4 ${theme.avatarBorder} shadow-lg overflow-hidden`}>
              {tempAvatar ? (
                <img src={tempAvatar} alt="avatar-preview" className="w-full h-full object-cover" />
              ) : user.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className={`text-3xl font-bold ${theme.avatarText}`}>{getInitials()}</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => setTempAvatar(ev.target.result);
                reader.readAsDataURL(file);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`absolute bottom-1 right-1 ${theme.solidBtn} text-white p-2.5 rounded-full shadow-lg transition-all active:scale-95`}
            >
              <Camera size={18} />
            </button>
          </div>

          {tempAvatar && (
            <div className="mb-4 text-center w-full">
              <button
                onClick={async () => {
                  try {
                    const file = fileInputRef.current?.files[0];

                    if (!file) {
                      setToast({ message: "No se encontró el archivo", type: "error", zIndex: 70 });
                      return;
                    }

                    await userService.uploadFoto(user.id, file);

                    await refreshUser();
                    setTempAvatar(null);
                    setToast({ message: "Foto actualizada correctamente", type: "success", zIndex: 70 });

                  } catch (error) {
                    setToast({ message: `Error: ${error.message}`, type: "error", zIndex: 70 });
                  }
                }}
                className={`px-4 py-2 ${theme.solidBtn} text-white rounded-md text-sm font-bold`}
              >
                Confirmar Foto
              </button>
            </div>
          )}

          <h3 className="text-base font-bold text-gray-900 text-center mt-3 line-clamp-2">
            {user.nombre || "Nombre no asignado"}
          </h3>
          <p className="text-xs text-gray-600 text-center mt-1 truncate max-w-full">
            {user.email || user.correo || "Sin correo"}
          </p>
          <span className={`inline-block px-3 py-1 ${theme.badgeBg} ${theme.badgeText} text-xs font-bold rounded-full mt-2 capitalize`}>
            {user.rol || "Usuario"}
          </span>
        </div>

        <div className="col-span-2 bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col justify-start">
          <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Información Personal</h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className={`px-4 py-2 ${theme.ghostBtn} rounded-lg font-semibold text-sm flex items-center gap-2 transition-all active:scale-95`}
              >
                <Edit2 size={16} /> Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all active:scale-95"
                >
                  <X size={16} /> Cancelar
                </button>
                <button
                  onClick={handleSaveProfile}
                  className={`px-4 py-2 ${theme.solidBtn} text-white rounded-lg font-semibold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-md hover:shadow-lg`}
                >
                  <Check size={16} /> Guardar
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Nombres <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm read-only:bg-gray-50 read-only:text-gray-700 focus:outline-none focus:ring-2 ${theme.ring} transition-all`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm read-only:bg-gray-50 read-only:text-gray-700 focus:outline-none focus:ring-2 ${theme.ring} transition-all`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Tipo de Documento</label>
              <select
                name="tipoDocumento"
                value={formData.tipoDocumento}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm bg-white disabled:bg-gray-50 disabled:text-gray-700 focus:outline-none focus:ring-2 ${theme.ring} transition-all`}
              >
                <option value="">--</option>
                {documentTypes.map((dt) => (
                  <option key={dt.id} value={dt.id}>{dt.value}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Número de Documento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="documento"
                value={formData.documento}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm read-only:bg-gray-50 read-only:text-gray-700 focus:outline-none focus:ring-2 ${theme.ring} transition-all`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Celular</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm read-only:bg-gray-50 read-only:text-gray-700 focus:outline-none focus:ring-2 ${theme.ring} transition-all`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Correo <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleInputChange}
                readOnly={true}
                className="w-full px-3 py-2 border-2 border-gray-100 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Dirección</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm read-only:bg-gray-50 read-only:text-gray-700 focus:outline-none focus:ring-2 ${theme.ring} transition-all`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Seguridad</h3>
        <div className={`${theme.secBoxBg} border-2 ${theme.secBoxBorder} rounded-lg p-5 flex gap-4 mb-6`}>
          <Lock className={`${theme.secIcon} flex-shrink-0 mt-0.5`} size={24} />
          <div className="flex-1">
            <p className={`text-sm font-bold ${theme.secTitle}`}>Recomendación de Seguridad</p>
            <p className={`text-sm ${theme.secText} mt-2`}>
              Se recomienda cambiar la contraseña regularmente para mantener tu cuenta segura.
            </p>
            <p className={`text-xs ${theme.secDate} mt-3 font-semibold`}>
              Última actualización: {lastPasswordUpdate}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowPasswordModal(true)}
          className={`px-8 py-3 ${theme.solidBtn} text-white font-bold text-sm rounded-lg flex items-center gap-3 transition-all active:scale-95 shadow-md`}
        >
          <Lock size={20} /> Cambiar Contraseña
        </button>
      </div>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onPasswordChanged={handlePasswordChanged}
      />

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

export default ClientMiPerfil;