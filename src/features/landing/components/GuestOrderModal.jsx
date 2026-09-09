import React, { useState } from "react";
import {
  X,
  ShoppingBag,
  MapPin,
  User,
  Phone,
  CheckCircle,
  Loader2,
} from "lucide-react";
import toast from "../../../shared/utils/toast";
import { ordersService } from "../../sales/orders/services/ordersService";

const GuestOrderModal = ({ isOpen, onClose, product }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    cantidad: 1,
    notas: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !product) return null;

  const total =
    Number(product.precio ?? product.price ?? 0) * formData.cantidad;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const orderData = {
          cliente: `${formData.nombre}`,
          documento: "",
          productos: [
            {
              id: product.id,
              nombre: product.nombre || product.name,
              precio: Number(product.precio ?? product.price ?? 0),
              cantidad: formData.cantidad,
              subtotal: total,
            },
          ],
          total: total,
          notas: formData.notas,
          origin: "web",
          creadoPor: "Invitado",
        };

        // Use the canonical ordersService so business rules apply
        ordersService.create(orderData);

        // Emit events so admin/employee listeners pick it up
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

        setIsSuccess(true);
        toast.success("¡Pedido realizado con éxito!");
      } catch (error) {
        console.error("Error creating guest order:", error);
        toast.error("Error al procesar el pedido");
      } finally {
        setIsSubmitting(false);
      }
    }, 800);
  };

  const handleClose = () => {
    setIsSuccess(false);
    setFormData({
      nombre: "",
      telefono: "",
      direccion: "",
      cantidad: 1,
      notas: "",
    });
    onClose && onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 bg-white/50 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>

        {isSuccess ? (
          <div className="p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              ¡Pedido Recibido!
            </h2>
            <p className="text-gray-600 mb-6">
              Gracias <strong>{formData.nombre}</strong>. Nos pondremos en
              contacto al <strong>{formData.telefono}</strong> para coordinar la
              entrega.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all"
            >
              Entendido, gracias
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full max-h-[90vh]">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
              <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded text-blue-50 mb-2 inline-block">
                Compra Rápida
              </span>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag size={20} /> {product.nombre}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Completa tus datos para el envío
              </p>
            </div>

            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Precio Unitario</p>
                      <p className="font-bold text-gray-700">
                        ${" "}
                        {Number(
                          product.precio ?? product.price ?? 0,
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-gray-500">
                        Cant:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.cantidad}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cantidad: Number(e.target.value),
                          })
                        }
                        className="w-16 p-1 text-center border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  {(product.marca || product.presentacion || product.concentracion) && (
                    <div className="border-t border-gray-200/60 pt-2 grid grid-cols-3 gap-2 text-[11px] text-gray-600">
                      {product.marca && (
                        <div>
                          <span className="font-bold uppercase text-[9px] text-gray-400 block">Marca</span>
                          <span className="font-medium text-gray-800">{product.marca}</span>
                        </div>
                      )}
                      {product.concentracion && (
                        <div>
                          <span className="font-bold uppercase text-[9px] text-gray-400 block">Concentración</span>
                          <span className="font-medium text-gray-800">{product.concentracion}</span>
                        </div>
                      )}
                      {product.presentacion && (
                        <div>
                          <span className="font-bold uppercase text-[9px] text-gray-400 block">Presentación</span>
                          <span className="font-medium text-gray-800">{product.presentacion}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Tu Nombre
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <input
                        required
                        type="text"
                        placeholder="Ej: Ana Pérez"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Teléfono / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <input
                        required
                        type="tel"
                        placeholder="Para confirmar entrega"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.telefono}
                        onChange={(e) =>
                          setFormData({ ...formData, telefono: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Dirección de Entrega
                    </label>
                    <div className="relative">
                      <MapPin
                        className="absolute left-3 top-3 text-gray-400"
                        size={16}
                      />
                      <textarea
                        required
                        rows="2"
                        placeholder="Calle, Número, Barrio, Referencias..."
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        value={formData.direccion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            direccion: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600 font-medium">
                      Total a Pagar:
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      $ {total.toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        {" "}
                        <Loader2 size={20} className="animate-spin" />{" "}
                        Procesando...{" "}
                      </>
                    ) : (
                      <>
                        {" "}
                        Confirmar Pedido <CheckCircle size={20} />{" "}
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-gray-400 mt-2">
                    Pago contra entrega disponible.
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestOrderModal;
