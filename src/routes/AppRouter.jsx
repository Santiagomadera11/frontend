import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* -------------------------------------------------------------------------- */
/*                           IMPORTACIONES PÚBLICAS                           */
/* -------------------------------------------------------------------------- */
import { LandingPage } from "../features/landing/LandingPage";
import { CatalogPage } from "../features/landing/CatalogPage";
import { ServicesPage as PublicServicesPage } from "../features/landing/ServicesPage";
import { ContactPage } from "../features/landing/ContactPage";

/* -------------------------------------------------------------------------- */
/*                                AUTENTICACIÓN                               */
/* -------------------------------------------------------------------------- */
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";

/* -------------------------------------------------------------------------- */
/*                          SISTEMA ADMINISTRATIVO                            */
/* -------------------------------------------------------------------------- */
import DashboardLayout from "../layouts/DashboardLayout";
import EmployeeLayout from "../layouts/EmployeeLayout";
import ClientLayout from "../layouts/ClientLayout";
import ProtectedRoute from "./ProtectedRoute";

// --- PÁGINAS GENERALES ADMIN ---
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { UsersPage } from "../features/users/UsersPage";
import SettingsPage from "../features/settings/SettingsPage";
import SalesPage from "../features/sales/SalesPage";
import { SalesReport } from "../features/sales/components/SalesReport";
import { ReturnsPage } from "../features/returns/pages/ReturnsPage";

// --- PÁGINAS DE INVENTARIO (ADMIN) ---
import { ProductsPage } from "../features/inventory/products/ProductsPage";
import NewProductPage from "../features/inventory/products/NewProductPage";
import { PurchasesPage } from "../features/inventory/purchases/PurchasesPage";
import { CategoriesPage } from "../features/inventory/categories/CategoriesPage";
import { ProvidersPage } from "../features/inventory/providers/ProvidersPage";

// --- PÁGINAS DE SERVICIOS Y CITAS (ADMIN) ---
import { ServicesPage } from "../features/services/ServicesPage";
import { AppointmentsPage } from "../features/services/appointments/AppointmentsPage";
import { AvailabilityConfigPage } from "../features/services/appointments/AvailabilityConfigPage";
import DoctorsPage from "../features/services/doctors/DoctorsPage";
import { CreateOrderPage } from "../features/sales/orders/CreateOrderPage";
import { CartProductsPage } from "../features/sales/orders/CartProductsPage";
import { AdminPedidos } from "../features/sales/orders/AdminPedidos";

/* -------------------------------------------------------------------------- */
/*                       SISTEMA DE EMPLEADO                                  */
/* -------------------------------------------------------------------------- */
import EmployeeInicio from "../features/employee/EmployeeInicio";
import EmployeeCompras from "../features/employee/EmployeeCompras";
import EmployeeSalesPage from "../features/employee/EmployeeSalesPage";
import EmployeeProductos from "../features/employee/EmployeeProductos";
import EmployeePedidos from "../features/employee/EmployeePedidos";
import EmployeeCitas from "../features/employee/EmployeeCitas";
import { EmployeeServicesPage } from "../features/employee/EmployeeServicesPage";
import { EmployeeAppointmentsPage } from "../features/employee/EmployeeAppointmentsPage";

/* -------------------------------------------------------------------------- */
/*                      SISTEMA DE REPORTES (ADMIN)                           */
/* -------------------------------------------------------------------------- */
import { ShiftHistoryReportsPage } from "../features/admin/reports/ShiftHistoryReportsPage";
import { SalesPerformanceReportsPage } from "../features/admin/reports/SalesPerformanceReportsPage";

/* -------------------------------------------------------------------------- */
/*                         SISTEMA DE CLIENTE                                 */
/* -------------------------------------------------------------------------- */
import ClientCatalogo from "../features/client/ClientCatalogo";
import ClientInicio from "../features/client/ClientInicio";
import ClientProductos from "../features/client/ClientProductos";
import ClientMisPedidos from "../features/client/ClientMisPedidos";
import ClientMisCitas from "../features/client/ClientMisCitas";
import ClientMiPerfil from "../features/client/ClientMiPerfil";
import CarritoPage from "../features/client/CarritoPage";

const CONFIG_PERMS = [
  "system.roles",
  "config.service_categories.create",
  "config.service_categories.edit",
  "config.service_categories.delete",
  "config.payment_methods.create",
  "config.payment_methods.edit",
  "config.payment_methods.delete",
  "config.document_types.create",
  "config.document_types.edit",
  "config.document_types.delete",
];

const APPOINTMENT_ACCESS_PERMS = [
  "appointments.create",
  "appointments.calendar",
  "appointments.list",
  "appointments.status",
];

const PRODUCT_FORM_PERMS = ["products.create", "products.edit"];

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* =================================================================
            ZONA PÚBLICA
        ================================================================= */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/productos" element={<CatalogPage />} />
        <Route path="/servicios" element={<PublicServicesPage />} />
        <Route path="/contacto" element={<ContactPage />} />

        {/* =================================================================
            ZONA DE ACCESO
        ================================================================= */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />

        {/* =================================================================
            ZONA PRIVADA (Dashboard Admin)
        ================================================================= */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="administrador">
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* USUARIOS */}
          <Route path="usuarios" element={
            <ProtectedRoute requiredPerm="users.view">
              <UsersPage />
            </ProtectedRoute>
          } />

          {/* COMPRAS */}
          <Route path="compras" element={
            <ProtectedRoute requiredPerm="purchase.view">
              <PurchasesPage />
            </ProtectedRoute>
          } />

          {/* PRODUCTOS */}
          <Route path="productos" element={
            <ProtectedRoute requiredPerm="products.view">
              <ProductsPage />
            </ProtectedRoute>
          } />
          <Route path="productos/nuevo" element={
            <ProtectedRoute requiredAnyPerm={PRODUCT_FORM_PERMS}>
              <NewProductPage />
            </ProtectedRoute>
          } />

          {/* CATEGORÍAS */}
          <Route path="categorias" element={
            <ProtectedRoute requiredPerm="categories.view">
              <CategoriesPage />
            </ProtectedRoute>
          } />

          {/* PROVEEDORES */}
          <Route path="proveedores" element={
            <ProtectedRoute requiredPerm="suppliers.view">
              <ProvidersPage />
            </ProtectedRoute>
          } />

          {/* VENTAS */}
          <Route path="ventas" element={
            <ProtectedRoute requiredPerm="sales.view">
              <SalesPage />
            </ProtectedRoute>
          } />
          <Route path="ventas/reporte" element={
            <ProtectedRoute requiredPerm="sales.view">
              <SalesReport />
            </ProtectedRoute>
          } />
          <Route path="ventas/nueva" element={
            <ProtectedRoute requiredPerm="sales.create">
              <CreateOrderPage />
            </ProtectedRoute>
          } />
          <Route path="ventas/nueva/productos" element={
            <ProtectedRoute requiredPerm="sales.create">
              <CartProductsPage />
            </ProtectedRoute>
          } />

          {/* DEVOLUCIONES */}
          <Route path="ventas/devoluciones" element={
            <ProtectedRoute requiredPerm="sales.view">
              <ReturnsPage />
            </ProtectedRoute>
          } />

          {/* PEDIDOS */}
          <Route path="pedidos" element={
            <ProtectedRoute requiredPerm="orders.view">
              <AdminPedidos />
            </ProtectedRoute>
          } />
          <Route path="pedidos/crear" element={
            <ProtectedRoute requiredPerm="orders.create">
              <CreateOrderPage />
            </ProtectedRoute>
          } />

          {/* SERVICIOS */}
          <Route path="servicios" element={
            <ProtectedRoute requiredPerm="services.view">
              <ServicesPage />
            </ProtectedRoute>
          } />

          {/* CITAS */}
          <Route path="citas" element={
            <ProtectedRoute requiredPerm="appointments.calendar">
              <AppointmentsPage />
            </ProtectedRoute>
          } />
          <Route path="citas/disponibilidad" element={
            <ProtectedRoute requiredPerm="appointments.availability">
              <AvailabilityConfigPage />
            </ProtectedRoute>
          } />
          <Route path="medicos" element={
            <ProtectedRoute requiredPerm="appointments.doctors.view">
              <DoctorsPage />
            </ProtectedRoute>
          } />

          {/* REPORTES */}
          <Route path="reportes/turnos" element={
            <ProtectedRoute requiredPerm="reports.shifts">
              <ShiftHistoryReportsPage />
            </ProtectedRoute>
          } />
          <Route path="reportes/desempeño" element={
            <ProtectedRoute requiredPerm="reports.performance">
              <SalesPerformanceReportsPage />
            </ProtectedRoute>
          } />

          {/* PERFIL */}
          <Route path="mi-perfil" element={<ClientMiPerfil />} />

          {/* CONFIGURACIÓN */}
          <Route path="configuracion" element={
            <ProtectedRoute requiredAnyPerm={CONFIG_PERMS}>
              <SettingsPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* =================================================================
            ZONA PRIVADA (Panel Empleado + Roles Dinámicos)
        ================================================================= */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute requiredRole="empleado">
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<EmployeeInicio />} />

          <Route path="usuarios" element={
            <ProtectedRoute requiredPerm="users.view">
              <UsersPage />
            </ProtectedRoute>
          } />

          <Route path="compras" element={
            <ProtectedRoute requiredPerm="purchase.view">
              <PurchasesPage />
            </ProtectedRoute>
          } />
          <Route path="ventas" element={
            <ProtectedRoute requiredPerm="sales.view">
              <EmployeeSalesPage />
            </ProtectedRoute>
          } />
          <Route path="ventas/reporte" element={
            <ProtectedRoute requiredPerm="sales.view">
              <SalesReport />
            </ProtectedRoute>
          } />
          <Route path="ventas/nueva" element={
            <ProtectedRoute requiredPerm="sales.create">
              <CreateOrderPage />
            </ProtectedRoute>
          } />
          <Route path="ventas/nueva/productos" element={
            <ProtectedRoute requiredPerm="sales.create">
              <CartProductsPage />
            </ProtectedRoute>
          } />
          <Route path="ventas/devoluciones" element={
            <ProtectedRoute requiredPerm="sales.view">
              <ReturnsPage />
            </ProtectedRoute>
          } />
          <Route path="productos" element={
            <ProtectedRoute requiredPerm="products.view">
              <ProductsPage />
            </ProtectedRoute>
          } />
          <Route path="productos/nuevo" element={
            <ProtectedRoute requiredAnyPerm={PRODUCT_FORM_PERMS}>
              <NewProductPage />
            </ProtectedRoute>
          } />
          <Route path="categorias" element={
            <ProtectedRoute requiredPerm="categories.view">
              <CategoriesPage />
            </ProtectedRoute>
          } />
          <Route path="proveedores" element={
            <ProtectedRoute requiredPerm="suppliers.view">
              <ProvidersPage />
            </ProtectedRoute>
          } />
          <Route path="pedidos" element={
            <ProtectedRoute requiredPerm="orders.view">
              <EmployeePedidos />
            </ProtectedRoute>
          } />
          <Route path="pedidos/crear" element={
            <ProtectedRoute requiredPerm="orders.create">
              <CreateOrderPage />
            </ProtectedRoute>
          } />
          <Route path="servicios" element={
            <ProtectedRoute requiredPerm="services.view">
              <ServicesPage />
            </ProtectedRoute>
          } />
          <Route path="citas" element={
            <ProtectedRoute requiredAnyPerm={APPOINTMENT_ACCESS_PERMS}>
              <EmployeeAppointmentsPage />
            </ProtectedRoute>
          } />
          <Route path="citas/disponibilidad" element={
            <ProtectedRoute requiredPerm="appointments.availability">
              <AvailabilityConfigPage />
            </ProtectedRoute>
          } />
          <Route path="medicos" element={
            <ProtectedRoute requiredPerm="appointments.doctors.view">
              <DoctorsPage />
            </ProtectedRoute>
          } />
          <Route path="reportes/turnos" element={
            <ProtectedRoute requiredPerm="reports.shifts">
              <ShiftHistoryReportsPage />
            </ProtectedRoute>
          } />
          <Route path="reportes/desempeño" element={
            <ProtectedRoute requiredPerm="reports.performance">
              <SalesPerformanceReportsPage />
            </ProtectedRoute>
          } />
          <Route path="mi-perfil" element={<ClientMiPerfil />} />
          <Route path="configuracion" element={
            <ProtectedRoute requiredAnyPerm={CONFIG_PERMS}>
              <SettingsPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* =================================================================
            ZONA PRIVADA (Panel Cliente)
        ================================================================= */}
        <Route
          path="/client"
          element={
            <ProtectedRoute requiredRole="cliente">
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<ClientInicio />} />
          <Route path="catalogo" element={<ClientCatalogo />} />
          <Route path="productos" element={<ClientProductos />} />
          <Route path="carrito" element={<CarritoPage />} />
          <Route path="mis-pedidos" element={<ClientMisPedidos />} />
          <Route path="mis-citas" element={<ClientMisCitas />} />
          <Route path="mi-perfil" element={<ClientMiPerfil />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};
