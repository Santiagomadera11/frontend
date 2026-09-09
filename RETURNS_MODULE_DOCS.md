# Módulo Returns (Devoluciones) - Documentación

## ✅ Estado de Implementación
Todos los archivos están creados y listos para usar. El módulo está completamente integrado en el router.

## 📁 Estructura de Archivos

```
src/features/returns/
├── pages/
│   └── ReturnsPage.jsx                    # Página principal
├── components/
│   ├── ReturnList.jsx                     # Tabla de devoluciones con búsqueda y filtros
│   ├── ReturnForm.jsx                     # Formulario 2-pasos para crear devoluciones
│   └── ReturnDetailModal.jsx              # Modal para ver/gestionar detalle
├── services/
│   └── returnService.js                   # Servicio API
└── hooks/
    └── useReturns.js                      # Hook personalizado para estado
```

## 🛣️ Rutas Disponibles

### Admin Dashboard
- `GET /admin/ventas/devoluciones` - Acceso solo con permiso `sales.view`

### Employee Panel
- `GET /employee/ventas/devoluciones` - Acceso solo con permiso `sales.view`

## 🔧 Funcionalidades Implementadas

### 1. **ReturnList** - Tabla de devoluciones
- ✅ Búsqueda por número de venta, nombre cliente o documento
- ✅ Filtro por estado (Pendiente, Aprobada, Rechazada)
- ✅ Paginación (5 items por página)
- ✅ Badges de color por estado
- ✅ Botón "Ver detalle"
- ✅ Botón "Nueva devolución"

### 2. **ReturnForm** - Formulario para crear devolución
**Paso 1:**
- Input para buscar venta por ID o número
- Validación que la venta exista

**Paso 2:**
- Tabla de productos de la venta
- Inputs para cantidad a devolver (validados vs cantidad vendida)
- Campo motivo (requerido)
- Campo observaciones (opcional)
- Cálculo automático de total a devolver

### 3. **ReturnDetailModal** - Ver y gestionar devoluciones
- ✅ Información de cliente y venta
- ✅ Total y fecha de devolución
- ✅ Tabla de productos devueltos
- ✅ Botones Aprobar/Rechazar si estado es Pendiente
- ✅ Muestra motivo y observaciones

## 📡 Endpoints API Utilizados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/devolucion` | Listar todas las devoluciones |
| GET | `/api/devolucion/{id}` | Detalle de una devolución |
| GET | `/api/devolucion/venta/{ventaId}` | Cargar venta para devolver |
| GET | `/api/devolucion/estados` | Listar estados |
| POST | `/api/devolucion` | Crear nueva devolución |
| PATCH | `/api/devolucion/{id}/gestionar` | Aprobar o rechazar |

## 🔐 Seguridad

- ✅ Token automáticamente inyectado en headers por `apiClient`
- ✅ Rutas protegidas por `ProtectedRoute` con verificación de permisos
- ✅ Datos del usuario desde `sessionStorage` con clave `syspharma_user`
- ✅ Token desde `localStorage` con clave `token`

## 🎨 Estilos y Componentes

### Colores por Estado
- **Pendiente (ID=1)**: Amarillo 🟨 - `text-yellow-700`, `bg-yellow-50`
- **Aprobada (ID=2)**: Verde 🟩 - `text-emerald-700`, `bg-emerald-50`
- **Rechazada (ID=3)**: Rojo 🟥 - `text-red-700`, `bg-red-50`

### Componentes Compartidos Usados
- `ToastNotification` - Para mensajes de éxito/error
- `apiClient` - Para peticiones HTTP
- Iconos de `lucide-react` (Eye, Plus, Search, etc.)

## 🚀 Cómo Usar

### 1. **Acceder al módulo desde Admin**
```
Ir a: http://localhost:5173/admin/ventas/devoluciones
```

### 2. **Crear una nueva devolución**
1. Clic en botón "Nueva devolución"
2. Buscar venta por ID (ej: 5)
3. Seleccionar cantidades a devolver
4. Ingresa motivo y observaciones
5. Clic en "Confirmar Devolución"

### 3. **Gestionar una devolución**
1. Clic en "Ver detalle"
2. Si está Pendiente, aparecer botones Aprobar/Rechazar
3. Clic en el botón deseado

### 4. **Buscar y filtrar**
- Campo de búsqueda: por número de venta, cliente o documento
- Filtro de estado: Todos, Pendiente, Aprobada, Rechazada

## 📝 Estados de Carga

- ✅ Loading spinner mientras se cargan datos
- ✅ Toast notifications para éxito/error
- ✅ Mensajes de error específicos de API
- ✅ Validaciones en formulario

## 🐛 Manejo de Errores

- Errores de API se capturan y muestran en Toast
- Validaciones del lado del cliente (motivo requerido, cantidades válidas)
- Mensajes amigables al usuario

## 📌 Notas Importantes

1. El usuario autenticado se obtiene de `sessionStorage` con clave `syspharma_user`
2. El hook `useReturns` auto-carga las devoluciones al montar
3. Las fechas se formatean en locale `es-CO`
4. Los montos se formatean como moneda colombiana (COP)
5. El componente actualiza la lista automáticamente después de crear/gestionar una devolución

## ✨ Características Adicionales

- Búsqueda en tiempo real (sin necesidad de botón)
- Paginación inteligente
- Filtros combinables
- Modal responsive
- Validación de cantidad máxima permitida
- Cálculo automático de totales
