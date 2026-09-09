import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, AlertCircle, Search } from "lucide-react";
import { ProductsSearchView } from "../components/ProductsSearchView";
import { ServicesSearchView } from "../components/ServicesSearchView";
import { IntegratedCart } from "../components/IntegratedCart";
import { salesService } from "../services/salesService";
import { turnService } from "../services/turnService";
import { ordersService } from "./services/ordersService";
import { authService } from "../../auth/authService";
import { fetchPaymentMethods, getPaymentMethods } from "../../settings/services/parameterService";
import { ToastNotification } from "../../../shared/ui/ToastNotification";
import { apiClient } from "../../../shared/utils/apiClient";

// ============ NUEVO: Servicio de clientes (ajusta la ruta según tu proyecto) ============
// Si no tienes clientService, créalo o usa axios directamente
const API_URL = "/api";
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${sessionStorage.getItem("syspharma_token")}` },
});

export const CreateOrderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const esUnPedido = location.pathname.toLowerCase().includes("pedido");
  const isEmployeePath = location.pathname.startsWith("/employee");
  const { currentUser } = useCurrentUser();
  const isEmployeeRole = (currentUser.rol || "") === "Empleado";

  const primary = isEmployeeRole ? "#2563eb" : "#059669";
  const primaryLight = isEmployeeRole ? "#eff6ff" : "#ecfdf5";
  const primaryBorder = isEmployeeRole ? "#93c5fd" : "#6ee7b7";

  const [activeTab, setActiveTab] = useState("productos");
  const [productCart, setProductCart] = useState([]);
  const [serviceCart, setServiceCart] = useState([]);
  const [clientInfo, setClientInfo] = useState({
    documento: "", nombre: "", telefono: "", correo: "", metodoPagoId: "",
  });
  const [montoRecibido, setMontoRecibido] = useState("");
  const [referenciaPago, setReferenciaPago] = useState("");

  useEffect(() => {
    setMontoRecibido("");
    setReferenciaPago("");
  }, [clientInfo.metodoPagoId]);

  // ============ NUEVO: Estado para IVA ============
  const [porcentajeIva, setPorcentajeIva] = useState(19);

  // ============ NUEVO: Estado para lista de usuarios ============
  const [usuarios, setUsuarios] = useState([]);

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [turnoLoading, setTurnoLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchingClient, setSearchingClient] = useState(false);

  const LOCAL_TURNO_KEY = "activeTurno";

  useEffect(() => {
    fetchPaymentMethods()
      .then((methods) => {
        setPaymentMethods(methods);
        if (methods.length > 0)
          setClientInfo((p) => ({ ...p, metodoPagoId: String(methods[0].id) }));
      })
      .catch(() => {
        const local = getPaymentMethods();
        setPaymentMethods(local);
        if (local.length > 0)
          setClientInfo((p) => ({ ...p, metodoPagoId: String(local[0].id) }));
      });

    const loadActiveTurn = async () => {
      try {
        const userId = currentUser?.id;
        if (!userId) return;
        const turno = await turnService.getActiveTurn(userId);
        if (turno && (turno.id || turno.turnoId)) {
          const idReal = turno.id || turno.turnoId;
          setTurnoActivo({ ...turno, id: idReal });
          localStorage.setItem(LOCAL_TURNO_KEY, JSON.stringify({ ...turno, id: idReal }));
        } else {
          setTurnoActivo(null);
          localStorage.removeItem(LOCAL_TURNO_KEY);
        }
      } catch {
        const saved = JSON.parse(localStorage.getItem(LOCAL_TURNO_KEY) || "null");
        setTurnoActivo(saved);
      } finally {
        setTurnoLoading(false);
      }
    };

    loadActiveTurn();

    // ============ NUEVO: Cargar usuarios al montar ============
    const cargarUsuarios = async () => {
      try {
        const response = await apiClient.get(`${API_URL}/Usuario`);
        setUsuarios(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
      }
    };
    cargarUsuarios();
  }, [currentUser?.id]);

  // ============ CORREGIDO: Buscar cliente por documento (búsqueda local) ============
  const handleSearchClient = () => {
    if (!clientInfo.documento || clientInfo.documento.length < 3) {
      setNotification({ message: "Ingrese al menos 3 caracteres del documento", type: "warning" });
      return;
    }

    const usuarioEncontrado = usuarios.find(u =>
      (u.documento || u.numeroDocumento || u.identificacion || "") === clientInfo.documento ||
      (u.documento || "").includes(clientInfo.documento)
    );

    if (usuarioEncontrado) {
      setClientInfo(prev => ({
        ...prev,
        nombre: usuarioEncontrado.nombre || usuarioEncontrado.name || usuarioEncontrado.nombres || prev.nombre,
        telefono: usuarioEncontrado.telefono || usuarioEncontrado.phone || usuarioEncontrado.celular || prev.telefono,
        correo: usuarioEncontrado.correo || usuarioEncontrado.email || prev.correo,
      }));
      setNotification({ message: "Cliente cargado exitosamente", type: "success" });
    } else {
      setNotification({ message: "No se encontró usuario con ese documento", type: "warning" });
    }
  };

  // ============ NUEVO: Función para calcular totales con IVA ============
  const calcularTotales = useCallback(() => {
    const subtotalProds = productCart.reduce((sum, p) => sum + p.cantidad * p.precio, 0);
    const subtotalServs = serviceCart.reduce((sum, s) => sum + s.precio, 0);
    const subtotal = subtotalProds + subtotalServs;
    const iva = subtotal * (porcentajeIva / 100);
    const total = subtotal + iva;
    return { subtotal, iva, total };
  }, [productCart, serviceCart, porcentajeIva]);

  const handleAddProduct = useCallback((product, cantidad) => {
    setProductCart((prev) => {
      const existing = prev.find((p) => p.id === product.id && p.loteId === product.loteId);
      if (existing)
        return prev.map((p) => p.id === product.id && p.loteId === product.loteId ? { ...p, cantidad: p.cantidad + cantidad } : p);
      return [...prev, { ...product, cantidad }];
    });
  }, []);

  const handleRemoveProduct = useCallback((id, loteId) => {
    setProductCart((prev) => prev.filter((p) => !(p.id === id && p.loteId === loteId)));
  }, []);

  const handleUpdateQty = useCallback((id, loteId, newQty) => {
    if (newQty <= 0) {
      handleRemoveProduct(id, loteId);
    } else {
      setProductCart((prev) =>
        prev.map((p) => {
          if (!(p.id === id && p.loteId === loteId)) return p;
          let maxStock = p.stock ?? Infinity;
          if (p.loteId) {
            const lote = p.lotes?.find(l => l.id === p.loteId);
            if (lote) maxStock = lote.cantidad;
          }
          const cappedQty = Math.min(newQty, maxStock);
          return { ...p, cantidad: cappedQty };
        })
      );
    }
  }, [handleRemoveProduct]);

  const handleAddService = useCallback((service) => {
    setServiceCart((prev) => [...prev, service]);
    if (service.paciente || service.documento) {
      setClientInfo((prevClient) => ({
        ...prevClient,
        nombre: service.paciente || prevClient.nombre,
        documento: service.documento || prevClient.documento,
        telefono: service.telefono || prevClient.telefono || "",
        correo: service.email || prevClient.correo || "",
      }));
    }
  }, []);

  const handleRemoveService = useCallback((id) => {
    setServiceCart((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleConfirmOrder = async () => {
    if (productCart.length === 0 && serviceCart.length === 0) {
      setNotification({ message: "El carrito está vacío. Agrega productos o servicios.", type: "error" });
      return;
    }
    if (!clientInfo.nombre || !clientInfo.nombre.trim()) {
      setNotification({ message: "El nombre del cliente es obligatorio", type: "error" });
      return;
    }
    if (clientInfo.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientInfo.correo)) {
      setNotification({ message: "El correo electrónico ingresado no es válido", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const user = authService.getCurrentUser();
      const userId = user?.id || currentUser?.id;

      const savedTurno = JSON.parse(localStorage.getItem(LOCAL_TURNO_KEY) || "null");
      const currentTurnoId = turnoActivo?.id || savedTurno?.id;

      if (isEmployeeRole && (!currentTurnoId || currentTurnoId === 0)) {
        throw new Error("No se puede procesar: No tienes una caja abierta.");
      }

      // ============ NUEVO: Calcular totales con IVA ============
      const { subtotal, iva, total } = calcularTotales();

      if (esUnPedido) {
        const pedidoPayload = {
          usuarioId: Number(userId),
          clienteNombre: clientInfo.nombre,
          clienteDocumento: clientInfo.documento || "",
          clienteTelefono: clientInfo.telefono || "",
          clienteEmail: clientInfo.correo || "",
          metodoPagoId: Number(clientInfo.metodoPagoId),
          porcentajeIva: porcentajeIva, // ← CAMBIO: usar variable de estado
          notas: [
            clientInfo.correo ? `Email: ${clientInfo.correo}` : "",
            ...serviceCart.map((s) => s.notas).filter(Boolean)
          ].filter(Boolean).join(" | ") || "Pedido realizado desde terminal",
          origen: "Terminal",
          subtotal: subtotal,  // ← NUEVO
          iva: iva,            // ← NUEVO
          total: total,        // ← NUEVO
          detalles: productCart.map((p) => ({
            productoId: Number(p.id),
            nombre: p.nombre || p.name || p.nombreProducto || p.descripcion || "Producto",
            cantidad: Number(p.cantidad),
            precioUnitario: Number(p.precio),
            subtotal: Number(p.cantidad * p.precio), // ← NUEVO
          })),
          citaIds: serviceCart.map((s) => s.appointmentId).filter(Boolean), // ← NUEVO
        };

        const pedidoResponse = await ordersService.create(pedidoPayload);

        // ── Actualizar stock en localStorage para reflejar el pedido ──
        try {
          const stored = localStorage.getItem("syspharma_products");
          if (stored) {
            const localProds = JSON.parse(stored);
            const updatedProds = localProds.map((lp) => {
              const vendido = productCart.find((pc) => Number(pc.id) === Number(lp.id));
              if (vendido) {
                return { ...lp, stock: Math.max(0, (lp.stock ?? 0) - Number(vendido.cantidad)) };
              }
              return lp;
            });
            localStorage.setItem("syspharma_products", JSON.stringify(updatedProds));
            window.dispatchEvent(new Event("syspharma_products_updated"));
          }
        } catch (_) { /* silencioso */ }

        window.dispatchEvent(new Event("orders:changed"));
        setNotification({ message: "Pedido guardado con éxito", type: "success" });
        
        setTimeout(() => {
          navigate(isEmployeePath ? "/employee/pedidos" : "/admin/pedidos");
        }, 1500);

      } else {
        const ventaPayload = {
          turnoId: Number(currentTurnoId),
          usuarioId: Number(userId),
          clienteNombre: clientInfo.nombre,
          clienteDocumento: clientInfo.documento || "",
          clienteTelefono: clientInfo.telefono || "",
          metodoPagoId: Number(clientInfo.metodoPagoId),
          referenciasPago: referenciaPago || null,
          porcentajeIva: porcentajeIva,
          subtotal: subtotal,
          iva: iva,
          total: total,
          notas: [
            clientInfo.correo ? `Email: ${clientInfo.correo}` : "",
            ...serviceCart.map((s) => s.notas).filter(Boolean)
          ].filter(Boolean).join(" | ") || null,
          detalles: productCart.map((p) => ({
            productoId: Number(p.id),
            cantidad: Number(p.cantidad),
            precioUnitario: Number(p.precio),
            descuento: 0,
            subtotal: Number(p.cantidad * p.precio),
            loteId: p.loteId ? Number(p.loteId) : null,
          })),
          servicios: serviceCart.map((s) => ({
            servicioId: Number(s.servicioId),
            cantidad: 1,
            precioUnitario: Number(s.precio),
            descuento: 0,
            subtotal: Number(s.precio),
            citaId: s.appointmentId || null,
          })),
        };

        const ventaResponse = await salesService.create(ventaPayload);

        // ── Actualizar stock en localStorage para reflejar la venta ──
        try {
          const stored = localStorage.getItem("syspharma_products");
          if (stored) {
            const localProds = JSON.parse(stored);
            const updatedProds = localProds.map((lp) => {
              const vendido = productCart.find((pc) => Number(pc.id) === Number(lp.id));
              if (vendido) {
                return { ...lp, stock: Math.max(0, (lp.stock ?? 0) - Number(vendido.cantidad)) };
              }
              return lp;
            });
            localStorage.setItem("syspharma_products", JSON.stringify(updatedProds));
            window.dispatchEvent(new Event("syspharma_products_updated"));
          }
        } catch (_) { /* silencioso */ }

        window.dispatchEvent(new Event("sales:changed"));
        setNotification({ message: "Transacción exitosa", type: "success" });
        
        setTimeout(() => {
          navigate(isEmployeePath ? "/employee/ventas" : "/admin/ventas");
        }, 1500);
      }

    } catch (err) {
      console.error("❌ Error API completo:", JSON.stringify(err.response?.data, null, 2));
      setNotification({
        message: err.response?.data?.message || err.message || "Error al procesar",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (turnoLoading)
    return <div className="h-full flex items-center justify-center">Cargando caja...</div>;

  if (isEmployeeRole && !turnoActivo) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center border border-red-100">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Caja Cerrada</h2>
          <p className="text-gray-500 mb-6 text-sm">Debes tener un turno activo para realizar esta operación.</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-gray-900 text-white rounded-xl">Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-sans bg-[#f8fafc]">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100" style={{ color: primary }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest" style={{ color: primary }}>
              {esUnPedido ? "Nuevo Pedido" : "Terminal SysPharma"}
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab("productos")} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeTab === "productos" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>📦 PRODUCTOS</button>
          <button onClick={() => setActiveTab("servicios")} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeTab === "servicios" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>🏥 SERVICIOS</button>
        </div>

        <div className="text-right">
          <p className="text-xs font-black text-gray-900">{currentUser.nombre}</p>
          {turnoActivo && <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded">CAJA #{turnoActivo.id}</span>}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex p-4 gap-4">
        <div className="flex-1 min-w-0">
          {activeTab === "productos" ? (
            <ProductsSearchView cart={productCart} onAddProduct={handleAddProduct} onRemoveProduct={handleRemoveProduct} onUpdateQty={handleUpdateQty} primary={primary} primaryLight={primaryLight} primaryBorder={primaryBorder} />
          ) : (
            <ServicesSearchView cart={serviceCart} onAddService={handleAddService} onRemoveService={handleRemoveService} primary={primary} primaryLight={primaryLight} />
          )}
        </div>

        <div className="w-96 h-full flex flex-col gap-4 overflow-y-auto pr-1 no-scrollbar">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="space-y-3">
              {/* Documento */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Documento</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={clientInfo.documento} 
                    onChange={e => setClientInfo(p => ({ ...p, documento: e.target.value }))} 
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none" 
                  />
                  <button
                    onClick={handleSearchClient}
                    disabled={searchingClient}
                    className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {searchingClient ? "..." : <Search size={14} />}
                  </button>
                </div>
              </div>
              
              {/* Nombre completo */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Nombre completo *</label>
                <input 
                  type="text" 
                  value={clientInfo.nombre} 
                  onChange={e => setClientInfo(p => ({ ...p, nombre: e.target.value }))} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none" 
                />
              </div>

              {/* Teléfono y Método de pago */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Teléfono</label>
                  <input 
                    type="tel" 
                    value={clientInfo.telefono} 
                    onChange={e => setClientInfo(p => ({ ...p, telefono: e.target.value }))} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none" 
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Método de pago</label>
                  <select 
                    value={clientInfo.metodoPagoId} 
                    onChange={e => setClientInfo(p => ({ ...p, metodoPagoId: e.target.value }))} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none"
                  >
                    {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.value}</option>)}
                  </select>
                </div>
              </div>
              
              {/* IVA % */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">IVA %</label>
                <input 
                  type="number" 
                  value={porcentajeIva} 
                  onChange={e => setPorcentajeIva(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  min="0"
                  max="100"
                  disabled={currentUser.rol?.toLowerCase() !== "administrador"}
                />
              </div>
              
              <button onClick={() => setClientInfo({ documento: "222222222", nombre: "Consumidor Final", telefono: "-", correo: "-", metodoPagoId: paymentMethods[0]?.id?.toString() || "" })} className="w-full py-2 text-[10px] font-black text-blue-600 border border-blue-100 bg-blue-50 rounded-lg uppercase mt-1">Cargar Genérico</button>
            </div>
          </div>

          <div className="flex-shrink-0">
            {/* ============ NUEVO: Pasar totales calculados al carrito ============ */}
            <IntegratedCart 
              products={productCart} 
              services={serviceCart} 
              onConfirm={handleConfirmOrder} 
              isLoading={loading} 
              primary={primary} 
              disabled={!clientInfo.nombre || (isEmployeeRole && !turnoActivo)}
              porcentajeIva={porcentajeIva}
              esUnPedido={esUnPedido}
              metodoPagoId={clientInfo.metodoPagoId}
              paymentMethods={paymentMethods}
              montoRecibido={montoRecibido}
              setMontoRecibido={setMontoRecibido}
              referenciaPago={referenciaPago}
              setReferenciaPago={setReferenciaPago}
            />
          </div>
        </div>
      </div>

      {notification && <ToastNotification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
    </div>
  );
};

export default CreateOrderPage;