import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* -------------------------------------------------------------------------- */
/*                    LAYOUTS Y RUTEO (carga inmediata, livianos)             */
/* -------------------------------------------------------------------------- */
import DashboardLayout from "../layouts/DashboardLayout";
import EmployeeLayout from "../layouts/EmployeeLayout";
import ProtectedRoute from "./ProtectedRoute";

/* -------------------------------------------------------------------------- */
/*  PANTALLAS: carga diferida (code-splitting). Cada una se descarga solo     */
/*  cuando el usuario navega a esa ruta, en vez de ir todas en un solo bundle */
/*  gigante desde el primer segundo.                                         */
/* -------------------------------------------------------------------------- */

// --- AUTENTICACIÓN ---
const LoginPage = React.lazy(() => import("../features/auth/LoginPage").then(m => ({ default: m.LoginPage })));

// --- PÁGINAS GENERALES ADMIN ---
const DashboardPage = React.lazy(() => import("../features/dashboard/DashboardPage").then(m => ({ default: m.DashboardPage })));
const UsersPage = React.lazy(() => import("../features/users/UsersPage").then(m => ({ default: m.UsersPage })));
const SettingsPage = React.lazy(() => import("../features/settings/SettingsPage"));
const SalesPage = React.lazy(() => import("../features/sales/SalesPage"));
const SalesReport = React.lazy(() => import("../features/sales/components/SalesReport").then(m => ({ default: m.SalesReport })));
const ReturnsPage = React.lazy(() => import("../features/returns/pages/ReturnsPage").then(m => ({ default: m.ReturnsPage })));

// --- PÁGINAS DE INVENTARIO (ADMIN) ---
const ProductsPage = React.lazy(() => import("../features/inventory/products/ProductsPage").then(m => ({ default: m.ProductsPage })));
const NewProductPage = React.lazy(() => import("../features/inventory/products/NewProductPage"));
const PurchasesPage = React.lazy(() => import("../features/inventory/purchases/PurchasesPage").then(m => ({ default: m.PurchasesPage })));
const CreatePurchasePage = React.lazy(() => import("../features/inventory/purchases/CreatePurchasePage").then(m => ({ default: m.CreatePurchasePage })));
const CategoriesPage = React.lazy(() => import("../features/inventory/categories/CategoriesPage").then(m => ({ default: m.CategoriesPage })));
const BrandsPage = React.lazy(() => import("../features/inventory/brands/BrandsPage").then(m => ({ default: m.BrandsPage })));
const PresentationsPage = React.lazy(() => import("../features/inventory/presentations/PresentationsPage").then(m => ({ default: m.PresentationsPage })));
const ProvidersPage = React.lazy(() => import("../features/inventory/providers/ProvidersPage").then(m => ({ default: m.ProvidersPage })));

// --- PÁGINAS DE SERVICIOS Y CITAS (ADMIN) ---
const ServicesPage = React.lazy(() => import("../features/services/ServicesPage").then(m => ({ default: m.ServicesPage })));
const AppointmentsPage = React.lazy(() => import("../features/services/appointments/AppointmentsPage").then(m => ({ default: m.AppointmentsPage })));
const AvailabilityConfigPage = React.lazy(() => import("../features/services/appointments/AvailabilityConfigPage").then(m => ({ default: m.AvailabilityConfigPage })));
const DoctorsPage = React.lazy(() => import("../features/services/doctors/DoctorsPage"));
const CreateOrderPage = React.lazy(() => import("../features/sales/orders/CreateOrderPage").then(m => ({ default: m.CreateOrderPage })));
const CartProductsPage = React.lazy(() => import("../features/sales/orders/CartProductsPage").then(m => ({ default: m.CartProductsPage })));

/* -------------------------------------------------------------------------- */
/*                       SISTEMA DE EMPLEADO                                  */
/* -------------------------------------------------------------------------- */
const EmployeeInicio = React.lazy(() => import("../features/employee/EmployeeInicio"));
const EmployeeSalesPage = React.lazy(() => import("../features/employee/EmployeeSalesPage"));
const EmployeeAppointmentsPage = React.lazy(() => import("../features/employee/EmployeeAppointmentsPage").then(m => ({ default: m.EmployeeAppointmentsPage })));

/* -------------------------------------------------------------------------- */
/*                      SISTEMA DE REPORTES (ADMIN)                           */
/* -------------------------------------------------------------------------- */
const ShiftHistoryReportsPage = React.lazy(() => import("../features/admin/reports/ShiftHistoryReportsPage").then(m => ({ default: m.ShiftHistoryReportsPage })));
const SalesPerformanceReportsPage = React.lazy(() => import("../features/admin/reports/SalesPerformanceReportsPage").then(m => ({ default: m.SalesPerformanceReportsPage })));

/* -------------------------------------------------------------------------- */
/*                              PERFIL (COMPARTIDO)                           */
/* -------------------------------------------------------------------------- */
const MiPerfil = React.lazy(() => import("../features/profile/ClientMiPerfil"));

const RouteFallback = () => (
  <div className="h-screen w-full flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
  </div>
);

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
const PURCHASE_FORM_PERMS = ["purchase.create", "purchase.edit"];

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* =================================================================
            ZONA DE ACCESO
        ================================================================= */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

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
          <Route path="compras/nueva" element={
            <ProtectedRoute requiredAnyPerm={PURCHASE_FORM_PERMS}>
              <CreatePurchasePage />
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

          {/* MARCAS */}
          <Route path="marcas" element={
            <ProtectedRoute requiredPerm="brands.view">
              <BrandsPage />
            </ProtectedRoute>
          } />

          {/* PRESENTACIONES */}
          <Route path="presentaciones" element={
            <ProtectedRoute requiredPerm="presentations.view">
              <PresentationsPage />
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
          <Route path="mi-perfil" element={<MiPerfil />} />

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
          <Route path="compras/nueva" element={
            <ProtectedRoute requiredAnyPerm={PURCHASE_FORM_PERMS}>
              <CreatePurchasePage />
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
          <Route path="marcas" element={
            <ProtectedRoute requiredPerm="brands.view">
              <BrandsPage />
            </ProtectedRoute>
          } />
          <Route path="presentaciones" element={
            <ProtectedRoute requiredPerm="presentations.view">
              <PresentationsPage />
            </ProtectedRoute>
          } />
          <Route path="proveedores" element={
            <ProtectedRoute requiredPerm="suppliers.view">
              <ProvidersPage />
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
          <Route path="mi-perfil" element={<MiPerfil />} />
          <Route path="configuracion" element={
            <ProtectedRoute requiredAnyPerm={CONFIG_PERMS}>
              <SettingsPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
