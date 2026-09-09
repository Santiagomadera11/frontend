import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, ShoppingCart, DollarSign, Package,
  ClipboardList, Calendar, Stethoscope, User, LogOut, X, Tags, Truck,
  BarChart3, TrendingUp, Settings, ChevronDown, ChevronRight,
} from "lucide-react";

const normalizePerm = (perm) => String(perm || "").toLowerCase().trim();

const EmployeeSidebar = ({ isOpen, onClose, onShowLogoutModal }) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({
    compras: false,
    ventas: false,
    servicios: false,
    reportes: false,
  });
  const [, setRefresh] = useState(0);

  const toggleMenu = (menu) => setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  const isActive = (path) => location.pathname === path;
  const isGroupActive = (path) => location.pathname.startsWith(path);

  // Escuchar cambios de permisos
  React.useEffect(() => {
    const handlePermissionsUpdate = () => setRefresh(r => r + 1);
    window.addEventListener("permissionsUpdated", handlePermissionsUpdate);
    return () => window.removeEventListener("permissionsUpdated", handlePermissionsUpdate);
  }, []);

  const { currentUser } = useCurrentUser();
  const userRole = (currentUser.rol || "").toLowerCase().trim();
  const userPerms = (currentUser.permisos || []).map(normalizePerm);

  const has = (...perms) => {
    if (userRole === "administrador") return true;
    return perms.some((p) => userPerms.includes(normalizePerm(p)));
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed lg:static w-60 bg-[#1E3A5F] flex flex-col text-white shadow-xl z-50 flex-shrink-0 border-l border-gray-700 transition-transform duration-300 h-full ${
        isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      }`}>
        <div className="h-14 flex items-center justify-between px-5 border-b border-gray-700 bg-[#152A47]">
          <div className="flex items-center gap-3">
            <div className="bg-blue-400 p-1 rounded-md shadow-lg shadow-blue-400/20">
              <Stethoscope size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-wide">SysPharma</h1>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider">Panel</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 sm:py-4 space-y-0.5 px-1 sm:px-2 no-scrollbar">

          {/* Inicio — siempre visible */}
          <MenuItem to="/employee/inicio" icon={LayoutDashboard} label="Inicio" active={isActive("/employee/inicio")} />

          {/* ── Operaciones ── */}
          {has(
            "users.view", "users.create", "users.edit", "users.delete", "users.status",
            "purchase.view", "purchase.create", "purchase.edit", "purchase.delete", "purchase.status",
            "products.view", "products.create", "products.edit", "products.delete", "products.status",
            "categories.view", "categories.create", "categories.edit", "categories.delete", "categories.status",
            "suppliers.view", "suppliers.create", "suppliers.edit", "suppliers.delete", "suppliers.status",
            "sales.view", "sales.create", "sales.cancel", "sales.return", "sales.invoice", "sales.export",
            "orders.view", "orders.create", "orders.edit", "orders.delete", "orders.status", "orders.export",
            "services.view", "services.create", "services.edit", "services.delete", "services.status",
            "appointments.create", "appointments.calendar", "appointments.list", "appointments.status",
            "appointments.availability", "appointments.doctors.view", "appointments.doctors.create",
            "appointments.doctors.edit", "appointments.doctors.delete", "appointments.doctors.status",
            "reports.shifts", "reports.performance"
          ) && (
            <div className="pt-3 pb-1">
              <p className="px-3 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Operaciones</p>
            </div>
          )}

          {/* Usuarios */}
          {has("users.view", "users.create", "users.edit", "users.delete", "users.status") && (
            <MenuItem to="/employee/usuarios" icon={Users} label="Usuarios" active={isActive("/employee/usuarios")} />
          )}

          {/* Compras (Grupo) */}
          {has(
            "purchase.view", "purchase.create", "purchase.edit", "purchase.delete", "purchase.status",
            "products.view", "products.create", "products.edit", "products.delete", "products.status",
            "categories.view", "categories.create", "categories.edit", "categories.delete", "categories.status",
            "suppliers.view", "suppliers.create", "suppliers.edit", "suppliers.delete", "suppliers.status"
          ) && (
            <MenuGroup
              to="/employee/compras"
              title="Compras"
              icon={ShoppingCart}
              isOpen={openMenus.compras}
              onToggle={() => toggleMenu("compras")}
              active={isActive("/employee/compras")}
            >
              {has("products.view", "products.create", "products.edit", "products.delete", "products.status") && (
                <SubMenuItem to="/employee/productos" label="Productos" icon={Package} active={isActive("/employee/productos")} />
              )}
              {has("categories.view", "categories.create", "categories.edit", "categories.delete", "categories.status") && (
                <SubMenuItem to="/employee/categorias" label="Categorías" icon={Tags} active={isActive("/employee/categorias")} />
              )}
              {has("suppliers.view", "suppliers.create", "suppliers.edit", "suppliers.delete", "suppliers.status") && (
                <SubMenuItem to="/employee/proveedores" label="Proveedores" icon={Truck} active={isActive("/employee/proveedores")} />
              )}
            </MenuGroup>
          )}

          {/* Ventas (Grupo) */}
          {has(
            "sales.view", "sales.create", "sales.cancel", "sales.return", "sales.invoice", "sales.export",
            "orders.view", "orders.create", "orders.edit", "orders.delete", "orders.status", "orders.export"
          ) && (
            <MenuGroup
              to="/employee/ventas"
              title="Ventas"
              icon={DollarSign}
              isOpen={openMenus.ventas}
              onToggle={() => toggleMenu("ventas")}
              active={isActive("/employee/ventas")}
            >
              {has("orders.view", "orders.create", "orders.edit", "orders.delete", "orders.status", "orders.export") && (
                <SubMenuItem to="/employee/pedidos" label="Pedidos" icon={ClipboardList} active={isActive("/employee/pedidos")} />
              )}
            </MenuGroup>
          )}

          {/* Servicios (Grupo) */}
          {has(
            "services.view", "services.create", "services.edit", "services.delete", "services.status",
            "appointments.create", "appointments.calendar", "appointments.list", "appointments.status",
            "appointments.availability", "appointments.doctors.view", "appointments.doctors.create",
            "appointments.doctors.edit", "appointments.doctors.delete", "appointments.doctors.status"
          ) && (
            <MenuGroup
              to="/employee/servicios"
              title="Servicios"
              icon={Stethoscope}
              isOpen={openMenus.servicios}
              onToggle={() => toggleMenu("servicios")}
              active={isActive("/employee/servicios")}
            >
              {has("appointments.create", "appointments.calendar", "appointments.list", "appointments.status",
                    "appointments.availability", "appointments.doctors.view", "appointments.doctors.create",
                    "appointments.doctors.edit", "appointments.doctors.delete", "appointments.doctors.status") && (
                <SubMenuItem to="/employee/citas" label="Citas" icon={Calendar} active={isActive("/employee/citas")} />
              )}
            </MenuGroup>
          )}

          {/* Reportes (Grupo) */}
          {has("reports.shifts", "reports.performance") && (
            <MenuGroup
              title="Reportes"
              icon={BarChart3}
              isOpen={openMenus.reportes}
              onToggle={() => toggleMenu("reportes")}
              active={isGroupActive("/employee/reportes")}
            >
              {has("reports.shifts") && (
                <SubMenuItem to="/employee/reportes/turnos" label="Historial de Turnos" icon={Calendar} active={isActive("/employee/reportes/turnos")} />
              )}
              {has("reports.performance") && (
                <SubMenuItem to="/employee/reportes/desempeño" label="Desempeño de Empleados" icon={TrendingUp} active={isActive("/employee/reportes/desempeño")} />
              )}
            </MenuGroup>
          )}

          {/* Mi Perfil — siempre visible */}
          <MenuItem to="/employee/mi-perfil" icon={User} label="Mi Perfil" active={isActive("/employee/mi-perfil")} />

          {/* Sistema / Configuración */}
          {has(
            "system.roles",
            "config.service_categories.create", "config.service_categories.edit", "config.service_categories.delete",
            "config.payment_methods.create", "config.payment_methods.edit", "config.payment_methods.delete",
            "config.document_types.create", "config.document_types.edit", "config.document_types.delete"
          ) && (
            <>
              <div className="pt-3 pb-1 border-t border-gray-700 mt-2">
                <p className="px-3 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Sistema</p>
              </div>
              <MenuItem to="/employee/configuracion" icon={Settings} label="Configuración" active={isActive("/employee/configuracion")} />
            </>
          )}

        </nav>

        <div className="p-3 border-t border-gray-700 bg-[#0F2A3F]">
          <button onClick={onShowLogoutModal}
            className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};

const MenuItem = ({ to, icon: Icon, label, active }) => (
  <Link to={to} className={`flex items-center px-3 py-2 rounded-md transition-all duration-200 group ${
    active ? "bg-blue-600 text-white shadow-sm font-medium" : "text-gray-300 hover:bg-white/5 hover:text-white"
  }`}>
    <Icon size={18} className={`mr-3 transition-colors ${active ? "text-white" : "text-gray-400 group-hover:text-white"}`} />
    <span className="text-xs font-medium">{label}</span>
  </Link>
);

const SubMenuItem = ({ to, label, icon: Icon, active }) => (
  <Link to={to} className={`flex items-center pl-10 pr-3 py-1.5 text-xs transition-colors rounded-md mb-0.5 ${
    active ? "text-blue-400 font-bold bg-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"
  }`}>
    {Icon && <Icon size={14} className="mr-2 opacity-70" />}
    {label}
  </Link>
);

const MenuGroup = ({ to, title, icon: Icon, isOpen, onToggle, children, active }) => {
  const content = (
    <>
      <Icon size={18} className={`mr-3 ${active ? "text-white" : "text-gray-400"}`} />
      <span className="text-xs font-medium">{title}</span>
    </>
  );

  return (
    <div className="mb-0.5">
      <div className={`flex items-center rounded-md transition-colors ${
        active ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"
      }`}>
        {to ? (
          <Link to={to} className="flex-1 flex items-center px-3 py-2 cursor-pointer outline-none">{content}</Link>
        ) : (
          <div className="flex-1 flex items-center px-3 py-2">{content}</div>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
          className="p-2 hover:bg-white/10 rounded-r-md transition-colors cursor-pointer"
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="mt-0.5 space-y-0.5">{children}</div>
      </div>
    </div>
  );
};

export default EmployeeSidebar;
