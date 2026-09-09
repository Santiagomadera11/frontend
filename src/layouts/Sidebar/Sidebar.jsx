import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { authService } from "../../features/auth/authService";
import {
  LayoutDashboard, Users, User, ShoppingCart, Package, Tags, Truck,
  DollarSign, ClipboardList, Stethoscope, Calendar, Settings,
  ChevronDown, ChevronRight, LogOut, X, BarChart3, TrendingUp,
} from "lucide-react";
import icono1 from "../../assets/icono1.png";

const Sidebar = ({ onClose, onShowLogoutModal }) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({
    compras: false, ventas: false, servicios: false, reportes: false,
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

  const user = authService.getCurrentUser();
  const userRole = (user?.rol || "").toLowerCase().trim();
  const userPerms = user?.permisos || [];

  const has = (...perms) => {
    if (userRole === "administrador") return true;
    return perms.some((p) => userPerms.includes(p));
  };

  return (
    <aside className="w-60 bg-[#2C3E50] flex flex-col text-white shadow-xl flex-shrink-0 border-l border-gray-700 h-full overflow-hidden">
      <div className="h-14 flex items-center justify-between gap-3 px-5 border-b border-gray-700 bg-[#243342] flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-0.5 flex-shrink-0">
            <img 
              src={icono1}
              alt="SysPharma Logo" 
              className="w-7 h-7 object-contain rounded-full"
            />
          </div>
          <div className="hidden sm:block min-w-0">
            <h1 className="text-base font-bold tracking-wide truncate">SysPharma</h1>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">Menú</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 hover:bg-white/10 rounded-md transition flex-shrink-0">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 sm:py-4 space-y-0.5 px-1 sm:px-2 no-scrollbar">

        {has("dashboard.view") && (
          <MenuItem to="/admin/dashboard" icon={LayoutDashboard} label="Inicio" active={isActive("/admin/dashboard")} />
        )}

        {has("users.view", "users.create", "users.edit", "users.delete", "users.status",
              "purchase.view", "purchase.create", "purchase.edit", "purchase.delete",
              "products.view", "categories.view", "suppliers.view",
              "sales.view", "sales.create", "orders.view",
              "services.view", "appointments.view", "appointments.calendar",
              "appointments.list", "reports.shifts", "reports.performance") && (
          <div className="pt-3 pb-1">
            <p className="px-3 text-[9px] font-bold text-gray-500 uppercase tracking-wider">Gestión</p>
          </div>
        )}

        {has("users.view", "users.create", "users.edit", "users.delete", "users.status") && (
          <MenuItem to="/admin/usuarios" icon={Users} label="Usuarios" active={isActive("/admin/usuarios")} />
        )}

        {has("purchase.view", "purchase.create", "purchase.edit", "purchase.delete", "purchase.status",
              "products.view", "products.create", "products.edit", "products.delete", "products.status",
              "categories.view", "categories.create", "categories.edit", "categories.delete", "categories.status",
              "suppliers.view", "suppliers.create", "suppliers.edit", "suppliers.delete", "suppliers.status") && (
          <MenuGroup
            to="/admin/compras"
            title="Compras"
            icon={ShoppingCart}
            isOpen={openMenus.compras}
            onToggle={() => toggleMenu("compras")}
            active={isActive("/admin/compras")}
          >
            {has("products.view", "products.create", "products.edit", "products.delete", "products.status") && (
              <SubMenuItem to="/admin/productos" label="Productos" icon={Package} active={isActive("/admin/productos")} />
            )}
            {has("categories.view", "categories.create", "categories.edit", "categories.delete", "categories.status") && (
              <SubMenuItem to="/admin/categorias" label="Categorías" icon={Tags} active={isActive("/admin/categorias")} />
            )}
            {has("suppliers.view", "suppliers.create", "suppliers.edit", "suppliers.delete", "suppliers.status") && (
              <SubMenuItem to="/admin/proveedores" label="Proveedores" icon={Truck} active={isActive("/admin/proveedores")} />
            )}
          </MenuGroup>
        )}

        {has("sales.view", "sales.create", "sales.cancel", "sales.return", "sales.invoice", "sales.export",
              "orders.view", "orders.create", "orders.edit", "orders.delete", "orders.status", "orders.export") && (
          <MenuGroup
            to="/admin/ventas"
            title="Ventas"
            icon={DollarSign}
            isOpen={openMenus.ventas}
            onToggle={() => toggleMenu("ventas")}
            active={isActive("/admin/ventas")}
          >
            {has("orders.view", "orders.create", "orders.edit", "orders.delete", "orders.status", "orders.export") && (
              <SubMenuItem to="/admin/pedidos" label="Pedidos" icon={ClipboardList} active={isActive("/admin/pedidos")} />
            )}
          </MenuGroup>
        )}

        {has("services.view", "services.create", "services.edit", "services.delete", "services.status",
              "appointments.create", "appointments.calendar", "appointments.list", "appointments.status",
              "appointments.availability", "appointments.doctors.view", "appointments.doctors.create",
              "appointments.doctors.edit", "appointments.doctors.delete", "appointments.doctors.status") && (
          <MenuGroup
            to="/admin/servicios"
            title="Servicios"
            icon={Stethoscope}
            isOpen={openMenus.servicios}
            onToggle={() => toggleMenu("servicios")}
            active={isActive("/admin/servicios")}
          >
            {has("appointments.create", "appointments.calendar", "appointments.list", "appointments.status",
                  "appointments.availability", "appointments.doctors.view", "appointments.doctors.create",
                  "appointments.doctors.edit", "appointments.doctors.delete", "appointments.doctors.status") && (
              <SubMenuItem to="/admin/citas" label="Citas Médicas" icon={Calendar} active={isActive("/admin/citas")} />
            )}
          </MenuGroup>
        )}

        {has("reports.shifts", "reports.performance") && (
          <MenuGroup
            title="Reportes"
            icon={BarChart3}
            isOpen={openMenus.reportes}
            onToggle={() => toggleMenu("reportes")}
            active={isGroupActive("/admin/reportes")}
          >
            {has("reports.shifts") && (
              <SubMenuItem to="/admin/reportes/turnos" label="Historial de Turnos" icon={Calendar} active={isActive("/admin/reportes/turnos")} />
            )}
            {has("reports.performance") && (
              <SubMenuItem to="/admin/reportes/desempeño" label="Desempeño de Empleados" icon={TrendingUp} active={isActive("/admin/reportes/desempeño")} />
            )}
          </MenuGroup>
        )}

        <MenuItem to="/admin/mi-perfil" icon={User} label="Mi Perfil" active={isActive("/admin/mi-perfil")} />

        {has("system.roles", "config.service_categories.create", "config.service_categories.edit",
              "config.service_categories.delete", "config.payment_methods.create", "config.payment_methods.edit",
              "config.payment_methods.delete", "config.document_types.create", "config.document_types.edit",
              "config.document_types.delete") && (
          <>
            <div className="pt-3 pb-1 border-t border-gray-700 mt-2">
              <p className="px-3 text-[9px] font-bold text-gray-500 uppercase tracking-wider">Sistema</p>
            </div>
            <MenuItem to="/admin/configuracion" icon={Settings} label="Configuración" active={isActive("/admin/configuracion")} />
          </>
        )}

      </nav>

      <div className="p-3 border-t border-gray-700 bg-[#243342]">
        <button
          onClick={onShowLogoutModal}
          className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

const MenuItem = ({ to, icon: Icon, label, active }) => (
  <Link to={to} className={`flex items-center px-3 py-2 rounded-md transition-all duration-200 group ${
    active ? "bg-primary-500 text-white shadow-sm" : "text-gray-300 hover:bg-white/5 hover:text-white"
  }`}>
    <Icon size={18} className={`mr-3 transition-colors ${active ? "text-white" : "text-gray-400 group-hover:text-white"}`} />
    <span className="text-xs font-medium">{label}</span>
  </Link>
);

const SubMenuItem = ({ to, label, icon: Icon, active }) => (
  <Link to={to} className={`flex items-center pl-10 pr-3 py-1.5 text-xs transition-colors rounded-md mb-0.5 ${
    active ? "text-primary-400 font-bold bg-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"
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
        active ? "bg-primary-500 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"
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

export default Sidebar;