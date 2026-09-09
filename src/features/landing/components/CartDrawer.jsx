import React, { useState } from "react";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  CheckCircle,
  Loader2,
  Package,
  AlertCircle,
} from "lucide-react";
import useCart from "../../../shared/context/CartContext";
import { ordersService } from "../../sales/orders/services/ordersService";
import toast from "../../../shared/utils/toast";

export const CartDrawer = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    cartTotal,
    clearCart,
    setIsCartOpen,
    isCartOpen,
  } = useCart();
  const [isCheckout, setIsCheckout] = useState(false);
  const [customerData, setCustomerData] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    itemId: null,
    itemName: "",
  });

  const enrichedCartItems = React.useMemo(() => {
    try {
      const stored = localStorage.getItem("syspharma_products");
      const products = JSON.parse(stored || "[]");
      return cartItems.map(item => {
        const found = products.find(p => String(p.id) === String(item.id));
        if (found) {
          return {
            ...item,
            marca: found.marca || found.laboratorio || found.proveedor || item.marca || "",
            concentracion: found.concentracion || found.medicamento?.concentracion || item.concentracion || "",
            presentacion: found.presentacion || item.presentacion || "",
            requiereFormula: found.requiereFormula !== undefined ? found.requiereFormula : (found.medicamento?.requiereFormula || false),
            requiereFormulaMedica: found.requiereFormulaMedica !== undefined ? found.requiereFormulaMedica : (found.medicamento?.requiereFormula || false),
          };
        }
        return item;
      });
    } catch (e) {
      console.error("Error enriching cart items:", e);
      return cartItems;
    }
  }, [cartItems]);

  const hasPrescriptionItems = React.useMemo(() => {
    return enrichedCartItems.some(item => item.requiereFormula || item.requiereFormulaMedica);
  }, [enrichedCartItems]);

  if (!isCartOpen) return null;

  const handleCheckout = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const orderData = {
          cliente: `${customerData.nombre}`,
          documento: "",
          productos: cartItems,
          total: cartTotal,
          notas: "",
          telefono: customerData.telefono,
          direccion: customerData.direccion,
          origin: "web",
          creadoPor: "Invitado",
        };

        ordersService.create(orderData);

        // ordersService already dispatches required events; keep for backward compat
        try {
          window.dispatchEvent(
            new CustomEvent("syspharma_orders_updated", { detail: {} }),
          );
        } catch {
          // ignore if CustomEvent not supported
        }
        try {
          window.dispatchEvent(new Event("syspharma_orders_updated"));
        } catch {
          // ignore if Event not supported
        }
        try {
          window.dispatchEvent(new Event("storage"));
        } catch {
          // ignore if Event not supported
        }

        clearCart();
        setIsSubmitting(false);
        setIsCheckout(false);
        setIsCartOpen(false);
        toast.success("¡Pedido realizado con éxito!");
      } catch (e) {
        console.error("Error creating order from cart:", e);
        setIsSubmitting(false);
        toast.error("Error al procesar el pedido");
      }
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsCartOpen(false)}
      ></div>

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="text-emerald-600" /> Tu Carrito
          </h2>
          <button
            onClick={() => {
              setIsCartOpen(false);
            }}
            className="p-2 hover:bg-gray-200 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingBag size={64} className="mb-4 opacity-20" />
              <p>Tu carrito está vacío</p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                }}
                className="mt-4 text-emerald-600 font-bold text-sm hover:underline"
              >
                Ver productos
              </button>
            </div>
          ) : isCheckout ? (
            <form
              id="checkout-form"
              onSubmit={handleCheckout}
              className="space-y-4 animate-in fade-in"
            >
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4">
                Completa tus datos para enviarte el pedido. Pago contra entrega.
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  required
                  type="text"
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="Tu nombre"
                  value={customerData.nombre}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, nombre: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  required
                  type="tel"
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="WhatsApp / Celular"
                  value={customerData.telefono}
                  onChange={(e) =>
                    setCustomerData({
                      ...customerData,
                      telefono: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Dirección
                </label>
                <textarea
                  required
                  rows="3"
                  className="w-full border rounded-lg p-2 text-sm resize-none"
                  placeholder="Dirección exacta de entrega"
                  value={customerData.direccion}
                  onChange={(e) =>
                    setCustomerData({
                      ...customerData,
                      direccion: e.target.value,
                    })
                  }
                />
              </div>
              <button
                type="button"
                onClick={() => setIsCheckout(false)}
                className="text-sm text-gray-500 hover:underline"
              >
                Volver al carrito
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {enrichedCartItems.map((item) => {
                const isRestricted = !!(item.requiereFormula || item.requiereFormulaMedica);
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 border-b border-gray-100 pb-4"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.imagen ? (
                        <img
                          src={item.imagen}
                          alt=""
                          className="h-12 object-contain"
                        />
                      ) : (
                        <Package size={24} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-sm line-clamp-1 ${isRestricted ? "line-through text-gray-400" : "text-gray-800"}`}>
                        {item.nombre}
                      </h3>
                      {(() => {
                        const parts = [item.marca, item.concentracion, item.presentacion].filter(Boolean);
                        return parts.length > 0 ? (
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">{parts.join(" · ")}</p>
                        ) : null;
                      })()}
                      {isRestricted && (
                        <p className="text-[11px] text-red-600 font-bold mt-1">
                          ⚠️ Requiere fórmula médica física. Retírelo para comprar.
                        </p>
                      )}
                      <p className="text-emerald-600 font-bold text-sm mt-1">
                        $ {Number(item.precio).toLocaleString()}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-2 py-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:text-red-500"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:text-green-500"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() =>
                            setConfirmDelete({
                              show: true,
                              itemId: item.id,
                              itemName: item.nombre,
                            })
                          }
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-5 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium">Total:</span>
              <span className="text-2xl font-bold text-emerald-600">
                $ {cartTotal.toLocaleString()}
              </span>
            </div>
            {hasPrescriptionItems && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-xs font-semibold mb-4 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                <span>No es posible comprar medicamentos controlados que requieren fórmula médica por este medio. Por favor retire el medicamento de su carrito para proceder.</span>
              </div>
            )}
            {isCheckout ? (
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting || hasPrescriptionItems}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <CheckCircle />
                )}{" "}
                Confirmar Pedido
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => !hasPrescriptionItems && setIsCheckout(true)}
                  disabled={hasPrescriptionItems}
                  className={`w-full py-3 rounded-xl font-bold shadow-lg transition-all ${
                    hasPrescriptionItems
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gray-900 hover:bg-gray-800 text-white active:scale-95"
                  }`}
                >
                  Continuar Compra
                </button>
                <button
                  onClick={() => {
                    clearCart();
                    toast("Carrito vaciado");
                  }}
                  className="w-full py-2 text-sm text-gray-600 hover:underline"
                >
                  Vaciar carrito
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {confirmDelete.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="bg-red-50 px-5 py-3 border-b border-red-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <AlertCircle size={18} className="text-red-600" />
                Eliminar del carrito
              </h3>
              <button
                onClick={() =>
                  setConfirmDelete({ show: false, itemId: null, itemName: "" })
                }
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              <p className="text-sm text-gray-700">
                ¿Deseas eliminar <strong>{confirmDelete.itemName}</strong> del
                carrito?
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Esta acción no se puede deshacer.
              </p>
            </div>

            {/* Footer */}
            <div className="bg-red-50 px-5 py-3 border-t border-red-200 flex justify-end gap-2">
              <button
                onClick={() =>
                  setConfirmDelete({ show: false, itemId: null, itemName: "" })
                }
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  removeFromCart(confirmDelete.itemId, 1);
                  setConfirmDelete({ show: false, itemId: null, itemName: "" });
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center gap-1 shadow-sm"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartDrawer;
