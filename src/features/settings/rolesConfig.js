export const PERMISSIONS_CONFIG = [

  // =====================================================
  // INICIO / DASHBOARD
  // =====================================================
  {
    id: "dashboard.view",
    label: "Acceso al Dashboard",
    description: "Ver el panel principal con métricas y resumen",
    category: "Inicio",
  },

  // =====================================================
  // USUARIOS
  // =====================================================
  {
    id: "users.view",
    label: "Ver usuarios",
    description: "Ver la lista y detalle de usuarios",
    category: "Usuarios",
  },
  {
    id: "users.create",
    label: "Agregar usuarios",
    description: "Crear nuevos usuarios en el sistema",
    category: "Usuarios",
  },
  {
    id: "users.edit",
    label: "Editar usuarios",
    description: "Modificar datos de usuarios existentes",
    category: "Usuarios",
  },
  {
    id: "users.delete",
    label: "Eliminar usuarios",
    description: "Eliminar usuarios del sistema",
    category: "Usuarios",
  },
  {
    id: "users.status",
    label: "Cambiar estado",
    description: "Activar o desactivar usuarios",
    category: "Usuarios",
  },

  // =====================================================
  // COMPRAS
  // =====================================================
  {
    id: "purchase.view",
    label: "Ver compras",
    description: "Ver detalle e historial de compras",
    category: "Compras",
  },
  {
    id: "purchase.create",
    label: "Agregar compra",
    description: "Registrar nuevas compras",
    category: "Compras",
  },
  {
    id: "purchase.edit",
    label: "Editar compra",
    description: "Modificar compras registradas",
    category: "Compras",
  },
  {
    id: "purchase.delete",
    label: "Eliminar compra",
    description: "Eliminar registros de compras",
    category: "Compras",
  },
  {
    id: "purchase.status",
    label: "Cambiar estado",
    description: "Cambiar el estado de una compra",
    category: "Compras",
  },

  // =====================================================
  // PRODUCTOS
  // =====================================================
  {
    id: "products.view",
    label: "Ver productos",
    description: "Ver lista y detalle de productos",
    category: "Productos",
  },
  {
    id: "products.create",
    label: "Agregar producto",
    description: "Crear nuevos productos en inventario",
    category: "Productos",
  },
  {
    id: "products.edit",
    label: "Editar producto",
    description: "Modificar datos de productos existentes",
    category: "Productos",
  },
  {
    id: "products.delete",
    label: "Eliminar producto",
    description: "Eliminar productos del inventario",
    category: "Productos",
  },
  {
    id: "products.status",
    label: "Cambiar estado",
    description: "Activar o desactivar productos",
    category: "Productos",
  },

  // =====================================================
  // CATEGORÍAS
  // =====================================================
  {
    id: "categories.view",
    label: "Ver categorías",
    description: "Ver lista y detalle de categorías",
    category: "Categorías",
  },
  {
    id: "categories.create",
    label: "Agregar categoría",
    description: "Crear nuevas categorías de productos",
    category: "Categorías",
  },
  {
    id: "categories.edit",
    label: "Editar categoría",
    description: "Modificar categorías existentes",
    category: "Categorías",
  },
  {
    id: "categories.delete",
    label: "Eliminar categoría",
    description: "Eliminar categorías del sistema",
    category: "Categorías",
  },
  {
    id: "categories.status",
    label: "Cambiar estado",
    description: "Activar o desactivar categorías",
    category: "Categorías",
  },

  // =====================================================
  // PROVEEDORES
  // =====================================================
  {
    id: "suppliers.view",
    label: "Ver proveedores",
    description: "Ver lista y detalle de proveedores",
    category: "Proveedores",
  },
  {
    id: "suppliers.create",
    label: "Agregar proveedor",
    description: "Registrar nuevos proveedores",
    category: "Proveedores",
  },
  {
    id: "suppliers.edit",
    label: "Editar proveedor",
    description: "Modificar datos de proveedores",
    category: "Proveedores",
  },
  {
    id: "suppliers.delete",
    label: "Eliminar proveedor",
    description: "Eliminar proveedores del sistema",
    category: "Proveedores",
  },
  {
    id: "suppliers.status",
    label: "Cambiar estado",
    description: "Activar o desactivar proveedores",
    category: "Proveedores",
  },

  // =====================================================
  // VENTAS
  // =====================================================
  {
    id: "sales.view",
    label: "Ver ventas",
    description: "Ver historial y detalle de ventas",
    category: "Ventas",
  },
  {
    id: "sales.create",
    label: "Agregar venta",
    description: "Registrar nuevas ventas",
    category: "Ventas",
  },
  {
    id: "sales.cancel",
    label: "Anular venta",
    description: "Anular ventas registradas",
    category: "Ventas",
  },
  {
    id: "sales.return",
    label: "Devolución",
    description: "Gestionar devoluciones de ventas",
    category: "Ventas",
  },
  {
    id: "sales.invoice",
    label: "Generar factura",
    description: "Emitir facturas de ventas",
    category: "Ventas",
  },
  {
    id: "sales.export",
    label: "Exportar ventas",
    description: "Exportar registros de ventas a Excel",
    category: "Ventas",
  },

  // =====================================================
  // PEDIDOS
  // =====================================================
  {
    id: "orders.view",
    label: "Ver pedidos",
    description: "Ver lista y detalle de pedidos",
    category: "Pedidos",
  },
  {
    id: "orders.create",
    label: "Agregar pedido",
    description: "Crear nuevos pedidos de clientes",
    category: "Pedidos",
  },
  {
    id: "orders.edit",
    label: "Editar pedido",
    description: "Modificar pedidos existentes",
    category: "Pedidos",
  },
  {
    id: "orders.delete",
    label: "Eliminar pedido",
    description: "Eliminar pedidos del sistema",
    category: "Pedidos",
  },
  {
    id: "orders.status",
    label: "Cambiar estado",
    description: "Cambiar el estado de un pedido",
    category: "Pedidos",
  },
  {
    id: "orders.export",
    label: "Exportar pedidos",
    description: "Exportar pedidos a Excel",
    category: "Pedidos",
  },

  // =====================================================
  // SERVICIOS
  // =====================================================
  {
    id: "services.view",
    label: "Ver servicios",
    description: "Ver lista y detalle de servicios",
    category: "Servicios",
  },
  {
    id: "services.create",
    label: "Agregar servicio",
    description: "Crear nuevos servicios",
    category: "Servicios",
  },
  {
    id: "services.edit",
    label: "Editar servicio",
    description: "Modificar servicios existentes",
    category: "Servicios",
  },
  {
    id: "services.delete",
    label: "Eliminar servicio",
    description: "Eliminar servicios del sistema",
    category: "Servicios",
  },
  {
    id: "services.status",
    label: "Cambiar estado",
    description: "Activar o desactivar servicios",
    category: "Servicios",
  },

  // =====================================================
  // CITAS MÉDICAS
  // =====================================================
  {
    id: "appointments.create",
    label: "Agregar cita",
    description: "Crear nuevas citas médicas",
    category: "Citas Médicas",
  },
  {
    id: "appointments.calendar",
    label: "Ver calendario",
    description: "Acceder a la vista de calendario de citas",
    category: "Citas Médicas",
  },
  {
    id: "appointments.list",
    label: "Lista de citas",
    description: "Ver listado y detalle de citas",
    category: "Citas Médicas",
  },
  {
    id: "appointments.status",
    label: "Cambiar estado cita",
    description: "Cambiar el estado de una cita",
    category: "Citas Médicas",
  },
  {
    id: "appointments.availability",
    label: "Disponibilidad",
    description: "Gestionar disponibilidad de médicos",
    category: "Citas Médicas",
  },
  {
    id: "appointments.doctors.view",
    label: "Ver médicos",
    description: "Ver lista y detalle de médicos",
    category: "Citas Médicas",
  },
  {
    id: "appointments.doctors.create",
    label: "Agregar médico",
    description: "Registrar nuevos médicos",
    category: "Citas Médicas",
  },
  {
    id: "appointments.doctors.edit",
    label: "Editar médico",
    description: "Modificar datos de médicos",
    category: "Citas Médicas",
  },
  {
    id: "appointments.doctors.delete",
    label: "Eliminar médico",
    description: "Eliminar médicos del sistema",
    category: "Citas Médicas",
  },
  {
    id: "appointments.doctors.status",
    label: "Cambiar estado médico",
    description: "Activar o desactivar médicos",
    category: "Citas Médicas",
  },

  // =====================================================
  // REPORTES
  // =====================================================
  {
    id: "reports.shifts",
    label: "Historial de Turnos",
    description: "Acceder al historial de turnos",
    category: "Reportes",
  },
  {
    id: "reports.performance",
    label: "Desempeño de Empleados",
    description: "Ver métricas de desempeño de empleados",
    category: "Reportes",
  },

  // =====================================================
  // CONFIGURACIÓN
  // =====================================================
  {
    id: "system.roles",
    label: "Gestionar Roles",
    description: "Crear, editar y eliminar roles de usuario",
    category: "Configuración",
  },
  {
    id: "config.service_categories.create",
    label: "Agregar categoría de servicio",
    description: "Crear nuevas categorías de servicio",
    category: "Configuración",
  },
  {
    id: "config.service_categories.edit",
    label: "Editar categoría de servicio",
    description: "Modificar categorías de servicio",
    category: "Configuración",
  },
  {
    id: "config.service_categories.delete",
    label: "Eliminar categoría de servicio",
    description: "Eliminar categorías de servicio",
    category: "Configuración",
  },
  {
    id: "config.payment_methods.create",
    label: "Agregar método de pago",
    description: "Crear nuevos métodos de pago",
    category: "Configuración",
  },
  {
    id: "config.payment_methods.edit",
    label: "Editar método de pago",
    description: "Modificar métodos de pago",
    category: "Configuración",
  },
  {
    id: "config.payment_methods.delete",
    label: "Eliminar método de pago",
    description: "Eliminar métodos de pago",
    category: "Configuración",
  },
  {
    id: "config.document_types.create",
    label: "Agregar tipo de documento",
    description: "Crear nuevos tipos de documento",
    category: "Configuración",
  },
  {
    id: "config.document_types.edit",
    label: "Editar tipo de documento",
    description: "Modificar tipos de documento",
    category: "Configuración",
  },
  {
    id: "config.document_types.delete",
    label: "Eliminar tipo de documento",
    description: "Eliminar tipos de documento",
    category: "Configuración",
  },
];