import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useEffect, useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import {
  LS,
  read,
  write,
  pushNotification,
} from "../../shared/services/lsService";
import { getPaymentMethods } from "../settings/services/parameterService";
import { ToastNotification } from "../../shared/ui/ToastNotification";
import { ordersService } from "../sales/orders/services/ordersService";
import farmaciaImage from "../../assets/farmacia.avif";
import { useNavigate } from "react-router-dom";

const CarritoPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [toast, setToast] = useState(null);

  // Estados para Checkout
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState("");
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [checkoutError, setCheckoutError] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    load();
    const onCartUpdated = () => load();
    window.addEventListener(`${LS.CART}_updated`, onCartUpdated);
    return () => window.removeEventListener(`${LS.CART}_updated`, onCartUpdated);
  }, []);

  function load() {
    const cart = read(LS.CART) || [];
    const prods = JSON.parse(localStorage.getItem("syspharma_products") || "[]");
    const normalized = (cart || []).map((item) => {
      const p = prods.find((x) => x.id === item.id || x.id === Number(item)) || {};
      return {
        id: p.id || item.id,
        nombre: p.nombre || item.nombre || "Producto",
        imagen: p.imagen || item.imagen,
        precioActual: Number(p.precio || item.precio || 0),
        cantidad: item.cantidad || 1,
        producto: p,
        marca: p.marca || p.laboratorio || p.proveedor || item.marca || "",
        concentracion: p.concentracion || p.medicamento?.concentracion || item.concentracion || "",
        presentacion: p.presentacion || item.presentacion || "",
        requiereFormula: p.requiereFormula !== undefined ? p.requiereFormula : (p.medicamento?.requiereFormula || false),
        requiereFormulaMedica: p.requiereFormulaMedica !== undefined ? p.requiereFormulaMedica : (p.medicamento?.requiereFormula || false),
      };
    });
    setCartItems(normalized);
  }

  const changeQty = (id, delta) => {
    const cart = read(LS.CART) || [];
    const updated = cart.map(it => it.id === id ? { ...it, cantidad: Math.max(1, (it.cantidad || 1) + delta) } : it);
    write(LS.CART, updated);
    load();
  };

  const handleRemove = (id) => {
    const cart = read(LS.CART) || [];
    const updated = cart.filter(it => it.id !== id);
    write(LS.CART, updated);
    load();
    setToast({ message: "Producto eliminado", type: "success" });
  };

  const total = cartItems.reduce((s, it) => s + (it.precioActual * it.cantidad), 0);
  const formatCurrency = (amount) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount);

  const handleAbrirCheckout = () => {
    const { currentUser } = useCurrentUser();
  const user = currentUser || {};
    const methods = getPaymentMethods();
    setPaymentMethods(methods || []);
    // Pre-llenar con la dirección del perfil si existe
    setDireccionEntrega(user.direccion || "");
    setCheckoutOpen(true);
  };

  return (
    <div className="p-6 font-sans">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-black text-gray-900">Tu Carrito</h2>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20 text-gray-400">Tu carrito está vacío</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Productos */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((it) => {
              const isRestricted = !!(it.requiereFormula || it.requiereFormulaMedica);
              return (
                <div key={it.id} className="flex items-center gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                  <img src={it.imagen || farmaciaImage} className="w-20 h-20 object-cover rounded-xl" alt="" />
                  <div className="flex-1">
                    <h4 className={`font-bold ${isRestricted ? "line-through text-gray-400" : "text-gray-900"}`}>{it.nombre}</h4>
                    {(() => {
                      const parts = [it.marca, it.concentracion, it.presentacion].filter(Boolean);
                      return parts.length > 0 ? (
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">{parts.join(" · ")}</p>
                      ) : null;
                    })()}
                    {isRestricted && (
                      <p className="text-[11px] text-red-600 font-bold mt-1">
                        ⚠️ Requiere fórmula médica física. Elimínalo para poder comprar.
                      </p>
                    )}
                    <p className="text-emerald-600 font-black mt-1">{formatCurrency(it.precioActual)}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl">
                    <button onClick={() => changeQty(it.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white border rounded-lg">-</button>
                    <span className="font-bold w-4 text-center">{it.cantidad}</span>
                    <button onClick={() => changeQty(it.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white border rounded-lg">+</button>
                  </div>
                  <button onClick={() => handleRemove(it.id)} className="p-2 text-red-400 hover:text-red-600">✕</button>
                </div>
              );
            })}
          </div>

          {/* Resumen de Pago */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit space-y-4">
            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Resumen</h3>
            <div className="flex justify-between items-center text-xl font-black text-gray-900 border-t pt-4">
              <span>Total:</span>
              <span className="text-emerald-600">{formatCurrency(total)}</span>
            </div>
            {(() => {
              const hasRestricted = cartItems.some(it => it.requiereFormula || it.requiereFormulaMedica);
              return (
                <>
                  {hasRestricted && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-xs font-semibold leading-relaxed">
                      ⚠️ Hay productos en tu carrito que requieren fórmula médica física. Por favor elimínalos para continuar con la compra.
                    </div>
                  )}
                  <button
                    onClick={handleAbrirCheckout}
                    disabled={hasRestricted}
                    className={`w-full py-4 rounded-2xl font-bold transition-all ${
                      hasRestricted
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100 active:scale-95"
                    }`}
                  >
                    Finalizar Compra
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-gray-900 mb-6">Confirmar Pedido</h3>

            {/* Método de Pago */}
            <div className="mb-5">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                Método de Pago
              </label>
              <select
                value={selectedPaymentId}
                onChange={(e) => setSelectedPaymentId(e.target.value)}
                className="w-full border-2 border-gray-100 p-3 rounded-2xl outline-none focus:border-emerald-500 font-medium"
              >
                <option value="">Seleccione cómo desea pagar...</option>
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>{m.value}</option>
                ))}
              </select>
            </div>

            {/* Dirección de Entrega */}
            <div className="mb-6">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                Dirección de Entrega <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={direccionEntrega}
                  onChange={(e) => setDireccionEntrega(e.target.value)}
                  placeholder="Ej: Calle 123 #45-67, Medellín"
                  className="w-full border-2 border-gray-100 pl-9 pr-3 py-3 rounded-2xl outline-none focus:border-emerald-500 font-medium text-sm"
                />
              </div>
              {!direccionEntrega.trim() && (
                <p className="text-[10px] text-amber-500 font-bold mt-1 ml-1">
                  ⚠️ Ingresá la dirección donde querés recibir tu pedido
                </p>
              )}
            </div>

            {checkoutError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold mb-6 border border-red-100">
                {checkoutError}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setCheckoutOpen(false)}
                className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={processing || !selectedPaymentId || !direccionEntrega.trim()}
                onClick={async () => {
                  setProcessing(true);
                  setCheckoutError(null);
                  try {
                    const user = JSON.parse(sessionStorage.getItem("syspharma_user") || "null");

                    if (!user || !user.id) {
                      throw new Error("No hay una sesión activa. Por favor, inicia sesión de nuevo.");
                    }

                    const dataParaGuardar = {
                      usuarioId: Number(user.id),
                      clienteNombre: user.nombre,
                      clienteEmail: user.email,
                      clienteDocumento: user.documento || null,
                      clienteTelefono: user.telefono || null,
                      direccion: direccionEntrega.trim(),
                      metodoPagoId: Number(selectedPaymentId),
                      porcentajeIva: 0,
                      detalles: cartItems.map(it => ({
                        productoId: Number(it.id),
                        nombre: it.nombre,
                        cantidad: Number(it.cantidad),
                        precioUnitario: Number(it.precioActual)
                      }))
                    };

                    await ordersService.create(dataParaGuardar);

                    write(LS.CART, []);
                    setCheckoutOpen(false);
                    pushNotification({
                      title: "¡Gracias por tu compra!",
                      message: "Tu pedido se ha registrado con éxito.",
                      date: new Date().toISOString(),
                      path: "/client/mis-pedidos"
                    });

                    window.location.href = "/client/mis-pedidos";

                  } catch (err) {
                    const msg = err.response?.data?.message || err.message;
                    setCheckoutError(msg);
                  } finally {
                    setProcessing(false);
                  }
                }}
                className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-100 disabled:opacity-50 transition-all active:scale-95"
              >
                {processing ? "Procesando..." : "Confirmar Pago"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default CarritoPage;