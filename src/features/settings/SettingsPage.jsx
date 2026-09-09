import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useMemo, useState } from "react";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import {
  Shield, Edit, Trash2, Settings, Users,
  ShoppingCart, ShoppingBag, Activity, BarChart3,
  Lock, CheckCircle2, Search, X, ChevronLeft, ChevronRight,
  LayoutDashboard, Package, Tags, Truck, DollarSign,
  ClipboardList, Stethoscope, Calendar, TrendingUp
} from "lucide-react";
import { ToastNotification } from "../../shared/ui/ToastNotification";
import { apiClient } from "../../shared/utils/apiClient";
import { rolesService } from "./rolesService";
import { permissionService } from "./permissionService";
import { PERMISSIONS_CONFIG } from "./rolesConfig";
import ParameterManagement from "./components/ParameterManagement";

const COLOR_OPTIONS = [
  { id: "turquoise", name: "Turquesa", hex: "#4fd1c5" },
  { id: "blue",      name: "Azul",     hex: "#3b82f6" },
  { id: "green",     name: "Verde",    hex: "#10b981" },
  { id: "purple",    name: "Morado",   hex: "#8b5cf6" },
  { id: "slate",     name: "Oscuro",   hex: "#1e293b" },
];

const PERMISSION_GROUPS = [
  {
    title: "Inicio",
    icon: <LayoutDashboard size={20} className="text-emerald-600" />,
    subsections: [
      {
        title: "Inicio / Dashboard",
        perms: ["dashboard.view"]
      }
    ]
  },
  {
    title: "Usuarios",
    icon: <Users size={20} className="text-blue-600" />,
    subsections: [
      {
        title: "Gestión de Usuarios",
        perms: ["users.view", "users.create", "users.edit", "users.delete", "users.status"]
      }
    ]
  },
  {
    title: "Compras",
    icon: <ShoppingBag size={20} className="text-orange-600" />,
    subsections: [
      {
        title: "Registro de Compras",
        perms: ["purchase.view", "purchase.create", "purchase.edit", "purchase.delete", "purchase.status"]
      },
      {
        title: "Submódulo: Productos",
        perms: ["products.view", "products.create", "products.edit", "products.delete", "products.status"]
      },
      {
        title: "Submódulo: Categorías",
        perms: ["categories.view", "categories.create", "categories.edit", "categories.delete", "categories.status"]
      },
      {
        title: "Submódulo: Proveedores",
        perms: ["suppliers.view", "suppliers.create", "suppliers.edit", "suppliers.delete", "suppliers.status"]
      }
    ]
  },
  {
    title: "Ventas",
    icon: <DollarSign size={20} className="text-emerald-600" />,
    subsections: [
      {
        title: "Registro de Ventas",
        perms: ["sales.view", "sales.create", "sales.cancel", "sales.return", "sales.invoice", "sales.export"]
      },
      {
        title: "Submódulo: Pedidos",
        perms: ["orders.view", "orders.create", "orders.edit", "orders.delete", "orders.status", "orders.export"]
      }
    ]
  },
  {
    title: "Servicios y Citas",
    icon: <Activity size={20} className="text-purple-600" />,
    subsections: [
      {
        title: "Registro de Servicios",
        perms: ["services.view", "services.create", "services.edit", "services.delete", "services.status"]
      },
      {
        title: "Submódulo: Citas Médicas",
        perms: ["appointments.create", "appointments.calendar", "appointments.list", "appointments.status"]
      },
      {
        title: "Submódulo: Disponibilidad de Médicos",
        perms: ["appointments.availability"]
      },
      {
        title: "Submódulo: Médicos",
        perms: ["appointments.doctors.view", "appointments.doctors.create", "appointments.doctors.edit", "appointments.doctors.delete", "appointments.doctors.status"]
      }
    ]
  },
  {
    title: "Reportes",
    icon: <BarChart3 size={20} className="text-rose-600" />,
    subsections: [
      {
        title: "Submódulo: Historial de Turnos",
        perms: ["reports.shifts"]
      },
      {
        title: "Submódulo: Desempeño de Empleados",
        perms: ["reports.performance"]
      }
    ]
  },
  {
    title: "Configuración y Sistema",
    icon: <Settings size={20} className="text-slate-600" />,
    subsections: [
      {
        title: "Roles del Sistema",
        perms: ["system.roles"]
      },
      {
        title: "Configuración: Categorías de Servicio",
        perms: ["config.service_categories.create", "config.service_categories.edit", "config.service_categories.delete"]
      },
      {
        title: "Configuración: Métodos de Pago",
        perms: ["config.payment_methods.create", "config.payment_methods.edit", "config.payment_methods.delete"]
      },
      {
        title: "Configuración: Tipos de Documento",
        perms: ["config.document_types.create", "config.document_types.edit", "config.document_types.delete"]
      }
    ]
  }
];

const ROLES_PER_PAGE = 4;

export const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("roles");
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState("form");
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editRole, setEditRole] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: "" });
  const [statusLoading, setStatusLoading] = useState(null);
  const [diasAlerta, setDiasAlerta] = useState("30");

  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [roleColor, setRoleColor] = useState(COLOR_OPTIONS[0].id);
  const [roleActive, setRoleActive] = useState(true);
  const [selectedPerms, setSelectedPerms] = useState({});

  const { currentUser } = useCurrentUser();
  const user = currentUser || {};

  React.useEffect(() => { loadRoles(); }, []);

  // Cargar configuración de días de alerta
  React.useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const res = await apiClient.get("/api/Configuracion/dias_alerta_vencimiento");
        setDiasAlerta(res.data?.valor);
      } catch {}
    };
    cargarConfiguracion();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await rolesService.getAll();
      setRoles(Array.isArray(response) ? response : (response?.data || []));
      setCurrentPage(1);
    } catch (error) {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(roles.length / ROLES_PER_PAGE);
  const usePagination = roles.length > ROLES_PER_PAGE;
  const pagedRoles = usePagination
    ? roles.slice((currentPage - 1) * ROLES_PER_PAGE, currentPage * ROLES_PER_PAGE)
    : roles;

  const handleToggleStatus = async (role) => {
    const newStatus = !(role.estado ?? true);
    setStatusLoading(role.id);
    try {
      await rolesService.updateStatus(role.id, { estado: newStatus });
      setToast({
        message: `Rol ${newStatus ? "activado" : "desactivado"} correctamente`,
        type: "success",
      });
      await loadRoles();
    } catch (error) {
      const msg = error?.response?.data?.message || "Error al cambiar el estado del rol";
      setToast({ message: msg, type: "error" });
    } finally {
      setStatusLoading(null);
    }
  };

  const confirmDelete = async () => {
    try {
      await rolesService.delete(deleteConfirm.id);
      setToast({ message: "Rol eliminado con éxito", type: "success" });
      await loadRoles();
    } catch (error) {
      const status = error?.response?.status;
      const errorCode = error?.response?.data?.errorCode;
      const msg = error?.response?.data?.message;

      if (status === 409 || errorCode === "ROLE_HAS_USERS") {
        setToast({ 
          message: "No se puede eliminar este rol porque está asignado a uno o más usuarios. Desvincule el rol de los usuarios antes de eliminarlo.", 
          type: "error" 
        });
      } else {
        setToast({ message: msg || "Error al eliminar el rol", type: "error" });
      }
    } finally {
      setDeleteConfirm({ show: false, id: null, name: "" });
    }
  };

  const guardarDiasAlerta = async () => {
    try {
      await apiClient.put("/api/Configuracion/dias_alerta_vencimiento", diasAlerta);
      setToast({ message: "Configuración guardada", type: "success" });
    } catch {
      setToast({ message: "Error al guardar configuración", type: "error" });
    }
  };

  const togglePerm = (id) =>
    setSelectedPerms((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleAllPerms = (items) => {
    const allSelected = items.every((p) => selectedPerms[p.id]);
    const newPerms = { ...selectedPerms };
    items.forEach((p) => { newPerms[p.id] = !allSelected; });
    setSelectedPerms(newPerms);
  };

  const handleEditRole = (role) => {
    setEditRole(role);
    setRoleName(role.nombre || role.name);
    setRoleDesc(role.descripcion || role.description);
    setRoleColor(role.color || COLOR_OPTIONS[0].id);
    setRoleActive(role.estado ?? true);
    const map = {};
    (role.permisos || role.permissions || []).forEach((p) => (map[p] = true));
    setSelectedPerms(map);
    setModalStep("form");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      setToast({ message: "El nombre del rol es requerido", type: "error" });
      return;
    }

    const permissions = Object.keys(selectedPerms).filter((k) => selectedPerms[k]);
    const payload = {
      id: editRole?.id || 0,
      nombre: roleName,
      descripcion: roleDesc,
      color: roleColor,
      estado: roleActive,
      permisos: permissions,
    };

    try {
      await rolesService.save(payload);
      setToast({
        message: editRole ? "Rol actualizado correctamente" : "Rol creado correctamente",
        type: "success",
      });
      
      // 🔄 Refrescar contexto si el usuario logueado tiene este rol
      if (currentUser.rolId === payload.id || (currentUser.rol || "").toLowerCase() === payload.nombre?.toLowerCase()) {
        await refreshUser();
        window.dispatchEvent(new Event("permissionsUpdated"));
      }
      
      setShowModal(false);
      await loadRoles();
      setEditRole(null);
      setRoleName("");
      setRoleDesc("");
      setRoleColor(COLOR_OPTIONS[0].id);
      setRoleActive(true);
      setSelectedPerms({});
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message || error?.message || "Error al guardar el rol";
      setToast({ message: errorMsg, type: "error" });
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans p-2">
      {toast && <ToastNotification {...toast} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">CONFIGURACIÓN</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Seguridad y Parámetros</p>
        </div>
        {activeSection === "roles" && (
          <button
            onClick={() => {
              setEditRole(null);
              setRoleName("");
              setRoleDesc("");
              setRoleColor(COLOR_OPTIONS[0].id);
              setRoleActive(true);
              setSelectedPerms({});
              setModalStep("form");
              setShowModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all active:scale-95"
          >
            Crear Nuevo Rol
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-100">
        <button
          onClick={() => setActiveSection("roles")}
          className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
            activeSection === "roles"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-400"
          }`}
        >
          Gestión de Roles
        </button>
        <button
          onClick={() => setActiveSection("params")}
          className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
            activeSection === "params"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-400"
          }`}
        >
          Parámetros
        </button>
      </div>

      {/* ── SECCIÓN ROLES ── */}
      {activeSection === "roles" && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400 text-sm">Cargando roles...</td>
                </tr>
              ) : pagedRoles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400 text-sm">No hay roles registrados</td>
                </tr>
              ) : (
                pagedRoles.map((role) => {
                  const isActive = role.estado ?? true;
                  return (
                    <tr key={role.id} className={`hover:bg-slate-50/50 transition-colors ${!isActive ? "opacity-60" : ""}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white"
                            style={{ 
                              backgroundColor: COLOR_OPTIONS.find(c => c.id === (role.color || "green"))?.hex || "#10b981" 
                            }}
                          >
                            {(role.nombre || role.name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-700 text-sm block">{role.nombre || role.name}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? "text-emerald-500" : "text-rose-400"}`}>
                              {isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-400 font-medium max-w-xs truncate">
                        {role.descripcion || role.description}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleStatus(role)}
                            disabled={statusLoading === role.id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none ${
                              isActive ? "bg-emerald-500" : "bg-slate-300"
                            } ${statusLoading === role.id ? "opacity-50 cursor-wait" : "cursor-pointer hover:opacity-90"}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-all duration-200 ${
                                isActive ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({ show: true, id: role.id, name: role.nombre || role.name })
                            }
                            className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {usePagination && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-400 font-medium">
                Mostrando {(currentPage - 1) * ROLES_PER_PAGE + 1}–
                {Math.min(currentPage * ROLES_PER_PAGE, roles.length)} de {roles.length} roles
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                      currentPage === page
                        ? "bg-emerald-600 text-white shadow-md"
                        : "text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECCIÓN PARÁMETROS ── */}
      {activeSection === "params" && (
        <div className="space-y-6">
          {/* Alertas de Vencimiento */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="text-2xl">⚠️</div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Alertas de Vencimiento</h3>
            </div>
            <div className="max-w-sm space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">
                  Días de anticipación
                </label>
                <input
                  type="number"
                  value={diasAlerta}
                  onChange={(e) => setDiasAlerta(e.target.value)}
                  className="w-24 px-3 py-2 border-2 border-slate-100 rounded-xl text-sm font-bold focus:border-emerald-500 outline-none"
                />
              </div>
              <button
                onClick={guardarDiasAlerta}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md shadow-emerald-100 transition-all active:scale-95"
              >
                Guardar
              </button>
              <p className="text-xs text-slate-500">
                El sistema alertará cuando un producto venza en menos de <strong>{diasAlerta}</strong> días.
              </p>
            </div>
          </div>

          {/* Parámetros del Sistema */}
          <ParameterManagement user={user} />
        </div>
      )}

      {/* ── Confirm Delete ── */}
      {deleteConfirm.show && (
        <ConfirmDialog
          open={deleteConfirm.show}
          title="Eliminar rol"
          description={`¿Seguro que deseas eliminar el rol "${deleteConfirm.name}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ show: false, id: null, name: "" })}
        />
      )}

      {/* ── MODAL CREAR / EDITAR ROL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-3">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">

            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  {editRole ? "Editar Rol" : "Crear Rol Maestro"}
                </h2>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setModalStep("form")}
                    className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                      modalStep === "form" ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    <span className={modalStep === "form" ? "border-b border-emerald-600" : ""}>1. Info</span>
                  </button>
                  <span className="text-slate-300 text-[10px]">→</span>
                  <button
                    onClick={() => setModalStep("perms")}
                    className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                      modalStep === "perms" ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    <span className={modalStep === "perms" ? "border-b border-emerald-600" : ""}>2. Permisos</span>
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50/30">
              {modalStep === "form" ? (
                <div className="max-w-lg mx-auto space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block ml-1">Nombre</label>
                    <input
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-100 focus:border-emerald-500 outline-none font-bold text-sm text-slate-700"
                      placeholder="Ej: Administrador de Ventas"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block ml-1">Descripción</label>
                    <textarea
                      value={roleDesc}
                      onChange={(e) => setRoleDesc(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-100 focus:border-emerald-500 outline-none font-medium text-sm text-slate-600 h-20 resize-none"
                      placeholder="Describe las responsabilidades..."
                    />
                  </div>
                  
                  {/* Estado Activo/Inactivo en el formulario */}
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estado del Rol</label>
                    <button
                      type="button"
                      onClick={() => setRoleActive(!roleActive)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus:outline-none ${
                        roleActive ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-200 ${
                          roleActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block ml-1">Color</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setRoleColor(color.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 transition-all ${
                            roleColor === color.id ? "border-slate-800 bg-slate-50" : "border-slate-100 hover:border-slate-200 bg-white"
                          }`}
                        >
                          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color.hex }} />
                          <span className="text-[10px] font-bold text-slate-600">{color.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setModalStep("perms")}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md transition-all"
                  >
                    Configurar Permisos →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {PERMISSION_GROUPS.map((group) => {
                    const allGroupPermIds = group.subsections.flatMap(sub => sub.perms);
                    const groupPerms = PERMISSIONS_CONFIG.filter(p => allGroupPermIds.includes(p.id));
                    
                    const allSelected = groupPerms.length > 0 && groupPerms.every((p) => selectedPerms[p.id]);
                    const someSelected = groupPerms.some((p) => selectedPerms[p.id]) && !allSelected;

                    return (
                      <div key={group.title} className="bg-white rounded-xl border border-slate-200/50 p-3 shadow-sm">
                        
                        <div
                          className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 cursor-pointer group"
                          onClick={() => toggleAllPerms(groupPerms)}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all
                              ${allSelected ? "bg-emerald-500 border-emerald-500 text-white" : someSelected ? "bg-emerald-100 border-emerald-400" : "bg-white border-slate-300 group-hover:border-emerald-300"}`}
                          >
                            {allSelected && <CheckCircle2 size={10} strokeWidth={3} />}
                            {someSelected && <div className="w-1.5 h-0.5 bg-emerald-500 rounded-sm" />}
                          </div>
                          {React.cloneElement(group.icon, { size: 16 })}
                          <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-wider flex-1 leading-tight">
                            {group.title}
                          </h4>
                        </div>

                        <div className="space-y-2">
                          {group.subsections.map((sub) => {
                            const subPerms = PERMISSIONS_CONFIG.filter(p => sub.perms.includes(p.id));
                            if (subPerms.length === 0) return null;

                            return (
                              <div key={sub.title}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">
                                    {sub.title}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleAllPerms(subPerms); }}
                                    className="text-[8px] text-emerald-600 hover:text-emerald-700 font-bold uppercase"
                                  >
                                    Todo
                                  </button>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                  {subPerms.map((p) => (
                                    <div
                                      key={p.id}
                                      onClick={() => togglePerm(p.id)}
                                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all cursor-pointer select-none ${
                                        selectedPerms[p.id]
                                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-500"
                                      }`}
                                    >
                                      <div
                                        className={`w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                                          selectedPerms[p.id] ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-300"
                                        }`}
                                      >
                                        {selectedPerms[p.id] && <CheckCircle2 size={8} strokeWidth={3} />}
                                      </div>
                                      <span className={`text-[9px] font-bold uppercase tracking-wide whitespace-nowrap ${
                                        selectedPerms[p.id] ? "text-emerald-800" : "text-slate-500"
                                      }`}>
                                        {p.label}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-100 flex justify-between items-center bg-white shrink-0">
              {modalStep === "perms" && (
                <button
                  onClick={() => setModalStep("form")}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase"
                >
                  <ChevronLeft size={14} /> Volver
                </button>
              )}
              <div className={`flex items-center gap-3 ${modalStep === "form" ? "ml-auto" : ""}`}>
                <span className="text-[10px] font-black text-slate-400 uppercase">
                  Seleccionados: <span className="text-emerald-600">{Object.values(selectedPerms).filter(Boolean).length}</span>
                </span>
                <button
                  onClick={handleSave}
                  className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md transition-all"
                >
                  {editRole ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;