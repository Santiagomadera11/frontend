import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, ArrowRight, ChevronLeft, X, Key } from "lucide-react";
import { authService } from "../auth/authService";
import { useCurrentUser } from "/src/shared/context/UserContext";
import { sendRecoveryEmail } from "./passwordRecoveryService";
import { apiClient } from "../../shared/utils/apiClient";
import { ToastNotification } from "../../shared/ui/ToastNotification";
import loginImage from "../../assets/login.jpg";
import icono1 from "../../assets/icono1.png"; // ← NUEVO: import del logo

const PERMS_ADMIN = [
  "dashboard.view",
  "users.view",
  "users.create",
  "users.edit",
  "users.delete",
  "users.status",
  "system.roles",
  "reports.shifts",
  "reports.performance",
  "config.service_categories.create",
  "config.payment_methods.create",
  "config.document_types.create",
];

const PERMS_EMPLOYEE = [
  "purchase.view",
  "purchase.create",
  "purchase.edit",
  "purchase.delete",
  "purchase.status",
  "products.view",
  "products.create",
  "products.edit",
  "products.delete",
  "products.status",
  "categories.view",
  "categories.create",
  "categories.edit",
  "categories.delete",
  "categories.status",
  "suppliers.view",
  "suppliers.create",
  "suppliers.edit",
  "suppliers.delete",
  "suppliers.status",
  "sales.view",
  "sales.create",
  "sales.cancel",
  "sales.return",
  "sales.invoice",
  "sales.export",
  "orders.view",
  "orders.create",
  "orders.edit",
  "orders.delete",
  "orders.status",
  "orders.export",
  "services.view",
  "services.create",
  "services.edit",
  "services.delete",
  "services.status",
  "appointments.create",
  "appointments.calendar",
  "appointments.list",
  "appointments.status",
  "appointments.availability",
  "appointments.doctors.view",
  "reports.shifts",
  "reports.performance",
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginUser } = useCurrentUser();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [codeInputs, setCodeInputs] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timeLeft, setTimeLeft] = useState(180);
  const [codeExpired, setCodeExpired] = useState(false);
  const codeInputRefs = useRef([]);

  const handleChange = (e) =>
    setCredentials({ ...credentials, [e.target.name]: e.target.value });

  useEffect(() => {
    let timer;
    if (recoveryStep === 2 && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && recoveryStep === 2) {
      setCodeExpired(true);
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [timeLeft, recoveryStep]);

  const handleEnviarCorreo = async (e) => {
    e.preventDefault();
    const email = (recoveryEmail || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setToast({
        message: "Ingresa un correo electrónico válido",
        type: "error",
        zIndex: 70,
      });
      return;
    }
    const result = await sendRecoveryEmail(email);
    if (result.error) {
      setToast({ message: result.message, type: "error", zIndex: 70 });
      return;
    }
    setRecoveryStep(2);
    setTimeLeft(180);
    setCodeExpired(false);
    setToast({
      message: "Código enviado. Revisa tu correo.",
      type: "success",
      zIndex: 70,
    });
  };

  const handleVerificarCodigo = async (e) => {
    e.preventDefault();
    const enteredCode = codeInputs.join("");
    if (!enteredCode) {
      setToast({ message: "Ingresa el código", type: "error", zIndex: 70 });
      return;
    }
    try {
      await apiClient.post("/api/Auth/verify-code", {
        email: recoveryEmail,
        code: enteredCode,
      });
      setToast({
        message: "Código verificado. Ahora puedes cambiar tu contraseña.",
        type: "success",
        zIndex: 70,
      });
      setRecoveryStep(3);
    } catch (error) {
      setToast({
        message: error.response?.data?.message || "Código incorrecto",
        type: "error",
        zIndex: 70,
      });
    }
  };

  const handleCodeInputChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newCodeInputs = [...codeInputs];
    newCodeInputs[index] = value;
    setCodeInputs(newCodeInputs);
    if (value && index < 5) codeInputRefs.current[index + 1].focus();
  };

  const handleCodeInputKeyDown = (index, e) => {
    if (e.key === "Backspace" && !codeInputs[index] && index > 0)
      codeInputRefs.current[index - 1].focus();
  };

  const handleResendCode = async () => {
    const result = await sendRecoveryEmail(recoveryEmail);
    if (result.error) {
      setToast({ message: result.message, type: "error", zIndex: 70 });
      return;
    }
    setCodeInputs(["", "", "", "", "", ""]);
    setTimeLeft(180);
    setCodeExpired(false);
    setToast({ message: "Nuevo código enviado", type: "success", zIndex: 70 });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setToast({
        message: "Completa todos los campos",
        type: "error",
        zIndex: 70,
      });
      return;
    }

    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      setToast({
        message: "La contraseña debe tener mínimo 8 caracteres, incluyendo mayúscula, minúscula, número y carácter especial.",
        type: "error",
        zIndex: 70,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setToast({
        message: "Las contraseñas no coinciden",
        type: "error",
        zIndex: 70,
      });
      return;
    }
    try {
      await apiClient.post("/api/Auth/reset-password", {
        email: recoveryEmail,
        newPassword,
      });
      setToast({
        message: "Contraseña actualizada exitosamente",
        type: "success",
        zIndex: 70,
      });
      setTimeout(() => {
        setShowRecoveryModal(false);
        setRecoveryStep(1);
        setRecoveryEmail("");
        setCodeInputs(["", "", "", "", "", ""]);
        setNewPassword("");
        setConfirmPassword("");
      }, 800);
    } catch (error) {
      setToast({
        message:
          error.response?.data?.message || "Error al cambiar la contraseña",
        type: "error",
        zIndex: 70,
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authService.login(
        credentials.email.trim(),
        credentials.password,
      );
      const data = res.data || res;

      if (!data || !data.token || !data.user) {
        setError("El correo o la contraseña no coinciden. Intente de nuevo");
        return;
      }

      sessionStorage.setItem("syspharma_token", data.token);
      localStorage.setItem("token", data.token);

      const userSession = {
        id: data.user.id,
        rol: data.user.rol?.toLowerCase().trim(),
      };
      sessionStorage.setItem("syspharma_user", JSON.stringify(userSession));
      await loginUser(data.user.id, data.token);

      try {
        const response = await apiClient.get("/api/Producto", {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        if (response.data && Array.isArray(response.data)) {
          const productsForPublic = response.data.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            precio: p.precio,
            stock: p.stock || 0,
            imagen: p.imagen,
            categoria: p.categoria || "Sin categoría",
            estado: p.estado !== false,
          }));
          localStorage.setItem(
            "syspharma_products",
            JSON.stringify(productsForPublic),
          );
          window.dispatchEvent(new Event("syspharma_products_updated"));
        }
      } catch (err) {
        console.warn("⚠️ No se pudieron sincronizar productos:", err.message);
      }

      const role = userSession.rol;
      const userPerms = data.user?.permisos || [];

      const rutasPorRol = {
        administrador: "/admin/dashboard",
        cliente: "/client/inicio",
      };

      let redirectPath = rutasPorRol[role];
      if (!redirectPath) {
        redirectPath = "/employee/inicio";
      }

      navigate(redirectPath);

      navigate(redirectPath);
    } catch (err) {
      console.error("❌ Error al entrar:", err);
      setError(err.response?.data?.message || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full overflow-hidden font-sans">
      {/* Panel izquierdo - SOLO ESTA SECCIÓN CAMBIÓ */}
      <div className="hidden lg:flex lg:w-[70%] bg-primary-900 relative items-center justify-center">
        <img
          src={loginImage}
          alt="Farmacia Syspharma"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay oscuro para mejor legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

        <div className="relative z-10 text-center px-20">
          {/* Logo reemplazado por icono1.png */}
          <div className="inline-flex p-2 mb-8">
            <img
              src={icono1}
              alt="SysPharma Logo"
              className="w-24 h-24 object-contain rounded-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
            />
          </div>

          {/* Texto con mejor contraste y sombras */}
          <h2 className="text-6xl font-bold text-white mb-6 tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            SysPharma
          </h2>
          <p className="text-white/90 text-2xl max-w-2xl mx-auto leading-relaxed font-normal drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
            El sistema integral para la gestión farmacéutica moderna.
          </p>
        </div>
      </div>

      {/* Panel derecho - SIN CAMBIOS */}
      <div className="w-full lg:w-[30%] flex items-center justify-center bg-white px-6 md:px-10 shadow-2xl z-20 relative">
        <Link
          to="/"
          className="absolute top-6 left-6 flex items-center gap-1 text-gray-400 hover:text-primary-600 transition-colors text-sm font-medium group"
        >
          <ChevronLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Volver al inicio
        </Link>

        <div className="w-full">
          <div className="text-center mb-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Bienvenido
            </h2>
            <p className="text-gray-500 text-xs">
              Ingresa a tu cuenta para continuar.
            </p>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User
                    size={16}
                    className="text-gray-400 group-focus-within:text-primary-500 transition-colors"
                  />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="admin@syspharma.com"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 ml-1">
                <label className="block text-xs font-bold text-gray-700">
                  Contraseña
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowRecoveryModal(true);
                  }}
                  className="text-[10px] text-primary-600 hover:text-primary-800 font-bold hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock
                    size={16}
                    className="text-gray-400 group-focus-within:text-primary-500 transition-colors"
                  />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Cargando..." : "Iniciar Sesión"}{" "}
              <ArrowRight size={16} />
            </button>

            <div className="text-center pt-4 border-t border-gray-100 mt-6">
              <p className="text-xs text-gray-500">
                ¿Eres cliente nuevo?{" "}
                <Link
                  to="/registro"
                  className="text-primary-600 font-bold hover:underline"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </form>
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

      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-cyan-100 bg-cyan-50">
              <div className="flex items-center gap-2">
                <Key size={20} className="text-cyan-700" />
                <h2 className="text-lg font-semibold text-cyan-900">
                  Recuperar Contraseña
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowRecoveryModal(false);
                  setRecoveryStep(1);
                }}
                className="p-1 hover:bg-cyan-100 rounded-lg transition-colors text-cyan-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {recoveryStep === 1 && (
                <form onSubmit={handleEnviarCorreo} className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Ingresa tu correo para recibir el código.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full pl-3 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-gray-50"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg text-sm"
                  >
                    Enviar Código
                  </button>
                </form>
              )}

              {recoveryStep === 2 && (
                <form onSubmit={handleVerificarCodigo} className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Ingresa el código que recibiste en tu correo.
                  </p>
                  <div className="flex gap-2 justify-center">
                    {codeInputs.map((value, idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength={1}
                        value={value}
                        onChange={(e) =>
                          handleCodeInputChange(idx, e.target.value)
                        }
                        onKeyDown={(e) => handleCodeInputKeyDown(idx, e)}
                        ref={(el) => (codeInputRefs.current[idx] = el)}
                        className="w-10 h-10 text-center border border-gray-300 rounded text-lg focus:ring-2 focus:ring-primary-100"
                        disabled={codeExpired}
                      />
                    ))}
                  </div>
                  {codeExpired ? (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg text-sm"
                    >
                      Reenviar Código
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg text-sm"
                    >
                      Verificar Código
                    </button>
                  )}
                  <div className="text-xs text-gray-500 text-center mt-2">
                    Tiempo restante: {timeLeft}s
                  </div>
                </form>
              )}

              {recoveryStep === 3 && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Ingresa tu nueva contraseña.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-gray-50"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg text-sm"
                  >
                    Cambiar Contraseña
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { LoginPage };
