import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, ShoppingCart } from "lucide-react";
import useCart from "../context/CartContext";
import QuickPurchaseModal from "./QuickPurchaseModal";

const ProductDetailModal = ({ product, onClose }) => {
  if (!product) return null;

  const [added, setAdded] = useState(false);
  const [showQuickPurchase, setShowQuickPurchase] = useState(false);

  // Detectar rol para colores dinámicos
  const currentUser = JSON.parse(
    sessionStorage.getItem("syspharma_user") || "{}",
  );
  const isEmployee = currentUser.rol === "Empleado";
  const headerBgColor = isEmployee
    ? "from-blue-50 to-blue-50"
    : "from-green-50 to-emerald-50";
  const buttonBgColor = isEmployee
    ? "bg-blue-600 hover:bg-blue-700"
    : "bg-emerald-600 hover:bg-emerald-700";
  const badgeBgColor = isEmployee
    ? "bg-blue-100 text-blue-700"
    : "bg-emerald-100 text-emerald-700";

  const title = product.nombre || product.name || "Producto";
  const price = Number(product.precio ?? product.price ?? 0);
  const isActive = product.estado !== false;

  const cart = useCart();
  const addToCart = () => {
    try {
      cart.addToCart(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Error agregando al carrito", err);
    }
  };

  const blockPurchase = (product.requiereFormula || product.requiereFormulaMedica) && !isEmployee;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r ${headerBgColor} flex-shrink-0`}
        >
          <h2 className="text-lg font-bold text-gray-900">
            Detalle del Producto
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-white/50 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Imagen Thumbnail */}
            <div className="md:col-span-1">
              <div className="rounded-lg border border-gray-200 aspect-square flex items-center justify-center bg-white">
                {product.imagen || product.image ? (
                  <img
                    src={product.imagen || product.image}
                    alt={title}
                    className="max-h-full w-auto object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-300 text-center">
                    <svg
                      className="w-12 h-12"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 16V8a2 2 0 0 0-2-2h-3l-2-2H10L8 6H5a2 2 0 0 0-2 2v8"
                        stroke="#CBD5E1"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-xs mt-2">Sin imagen</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Información en Grid */}
            <div className="md:col-span-2 space-y-4">
              {/* Título y Categoría */}
              <div>
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <div className="flex gap-2 mt-2">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-bold rounded-full uppercase ${badgeBgColor}`}
                  >
                    {product.categoria || "Medicamento"}
                  </span>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${
                      isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              {/* Datos en Grid 2x2 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-gray-200 bg-white">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                    Marca
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {product.marca || "Genérico"}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-gray-200 bg-white">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                    Presentación
                  </p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {product.presentacion || "Sin especificar"}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-gray-200 bg-white">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                    Stock
                  </p>
                  <p
                    className={`text-sm font-semibold ${Number(product.stock) > 0 ? "text-gray-900" : "text-red-600"}`}
                  >
                    {product.stock ?? 0}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-gray-200 bg-white">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                    Precio
                  </p>
                  <p
                    className={`text-sm font-semibold ${isEmployee ? "text-blue-600" : "text-emerald-600"}`}
                  >
                    ${price.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Información del Medicamento */}
              {product.tipoProducto === "Medicamento" && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-2">
                    Información del Medicamento
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {product.viaAdministracion && (
                      <div>
                        <span className="text-gray-600 font-medium">Vía:</span>{" "}
                        <span className="font-semibold">
                          {product.viaAdministracion}
                        </span>
                      </div>
                    )}
                    {product.concentracion && (
                      <div>
                        <span className="text-gray-600 font-medium">Concentración:</span>{" "}
                        <span className="font-semibold">
                          {product.concentracion}
                        </span>
                      </div>
                    )}
                    {product.composicion && (
                      <div className="col-span-2">
                        <span className="text-gray-600 font-medium">Composición:</span>{" "}
                        <span className="font-semibold">
                          {product.composicion}
                        </span>
                      </div>
                    )}
                    {(product.requiereFormula !== undefined || product.requiereFormulaMedica !== undefined) && (
                      <div className="col-span-2 mt-2">
                        {product.requiereFormula || product.requiereFormulaMedica ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Requiere fórmula médica 🩺
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Venta libre 🟢
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(() => {
            const desc = product.descripcion || product.description;
            return desc && desc.trim() !== "" ? (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500 font-bold uppercase mb-2">
                  Descripción
                </p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {desc}
                </p>
              </div>
            ) : null;
          })()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex flex-col gap-3 flex-shrink-0">
          {blockPurchase && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-xs font-semibold leading-relaxed">
              Este medicamento requiere fórmula médica vigente. Por regulación sanitaria, la verificación se realiza únicamente de manera física.
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={addToCart}
              disabled={blockPurchase}
              className={`px-4 py-2 text-sm font-medium text-white ${blockPurchase ? "bg-gray-300 cursor-not-allowed" : buttonBgColor} rounded-lg flex items-center gap-2 transition-all`}
            >
              <ShoppingCart size={16} />
              Agregar
            </button>
            <div className="flex items-center gap-2">
              {added && (
                <span
                  className={`text-xs font-semibold ${isEmployee ? "text-blue-600" : "text-emerald-600"}`}
                >
                  ✓ Agregado
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuickPurchase(true);
                }}
                disabled={blockPurchase}
                className={`px-4 py-2 text-sm font-medium text-white ${blockPurchase ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} rounded-lg flex items-center gap-2 transition-all`}
              >
                <ShoppingCart size={16} />
                Comprar Ahora
              </button>
            </div>
          </div>
        </div>

        {/* Quick Purchase Modal - Renderizado con Portal para evitar contexto de apilamiento */}
        {showQuickPurchase &&
          createPortal(
            <QuickPurchaseModal
              product={product}
              onClose={() => setShowQuickPurchase(false)}
              onSuccess={() => {
                setShowQuickPurchase(false);
                onClose();
              }}
            />,
            document.body,
          )}
      </div>
    </div>
  );
};

export default ProductDetailModal;
