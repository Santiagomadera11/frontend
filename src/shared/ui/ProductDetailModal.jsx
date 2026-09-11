import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

const ProductDetailModal = ({ product, onClose }) => {
  // Detectar rol para colores dinámicos
  const currentUser = JSON.parse(
    sessionStorage.getItem("syspharma_user") || "{}",
  );
  const isEmployee = currentUser.rol === "Empleado";
  const headerBgColor = isEmployee
    ? "from-blue-50 to-blue-50"
    : "from-green-50 to-emerald-50";
  const badgeBgColor = isEmployee
    ? "bg-blue-100 text-blue-700"
    : "bg-emerald-100 text-emerald-700";

  const title = product?.nombre || product?.name || "Producto";
  const price = Number(product?.precio ?? product?.price ?? 0);
  const isActive = product?.estado !== false;

  // Formas de venta habilitadas (Unidad/Blister/Caja). Si el producto no
  // trae ninguna (catálogos viejos o no-medicamentos), se sintetiza una
  // única forma "Unidad" con el precio del producto.
  const formasVenta = (() => {
    const activas = (product?.formasVenta || []).filter((f) => f.activo !== false);
    return activas.length > 0
      ? activas
      : [{ id: null, tipo: "Unidad", precio: price, factorUnidades: 1, activo: true }];
  })();

  const [formaVentaSeleccionada, setFormaVentaSeleccionada] = useState(
    () => formasVenta.find((f) => f.tipo === "Unidad") || formasVenta[0],
  );

  // Si se abre el modal para otro producto (el mismo componente puede
  // reutilizarse sin desmontar), volvemos a elegir "Unidad" por defecto.
  useEffect(() => {
    setFormaVentaSeleccionada(formasVenta.find((f) => f.tipo === "Unidad") || formasVenta[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (!product) return null;

  const precioSeleccionado = Number(formaVentaSeleccionada?.precio ?? price);

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
                    ${precioSeleccionado.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Selector de Forma de Venta (Unidad / Blister / Caja) */}
              {formasVenta.length > 1 && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-2">
                    Forma de venta
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formasVenta.map((f) => {
                      const isSelected = formaVentaSeleccionada?.tipo === f.tipo;
                      return (
                        <button
                          key={f.tipo}
                          type="button"
                          onClick={() => setFormaVentaSeleccionada(f)}
                          className={`px-3 py-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                            isSelected
                              ? isEmployee
                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                : "border-emerald-600 bg-emerald-50 text-emerald-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          <span className="block">{f.tipo}</span>
                          <span className="block text-[11px] font-bold mt-0.5">
                            ${Number(f.precio).toLocaleString()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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

      </div>
    </div>
  );
};

export default ProductDetailModal;
