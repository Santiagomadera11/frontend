import React from "react";
import { Plus, Pill } from "lucide-react";

export const fmt = (v) => {
  const n = Number(v) || 0;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
};

export const ProductCardGrid = ({
  product,
  onAdd,
  onQuickBuy,
  onOpenDetail,
  disabled,
  children,
}) => {
  const isOutOfStock = (product.stock ?? 0) <= 0;
  const requiresPrescription = !!(product.requiereFormula || product.requiereFormulaMedica);
  const effectivelyDisabled = disabled || isOutOfStock || requiresPrescription;

  const name = product.name || product.nombre || "Producto";
  const image = product.image || product.imagen || null;
  const price = Number(product.price ?? product.precio ?? product.precioActual ?? 0);
  const marca = product.marca || product.laboratorio || "Genérico";

  return (
  <div
    className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition h-full flex flex-col relative cursor-pointer"
    onClick={() => onOpenDetail && onOpenDetail(product)}
    role={onOpenDetail ? "button" : undefined}
    tabIndex={onOpenDetail ? 0 : undefined}
    onKeyDown={(e) => {
      if (onOpenDetail && (e.key === "Enter" || e.key === " "))
        onOpenDetail(product);
    }}
  >
    <div className="relative h-40 bg-gray-50 flex items-center justify-center overflow-hidden group">
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <Pill size={48} className="text-gray-300" />
      )}

      {/* Badge de fórmula médica */}
      {requiresPrescription && (
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
            Fórmula médica 🩺
          </span>
        </div>
      )}

      {/* Overlay de agotado */}
      {isOutOfStock && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span className="text-white font-bold">Agotado</span>
        </div>
      )}
    </div>
    <div className="p-4 flex flex-col flex-1">
      <div className="flex-1">
        <h4 className="font-semibold text-gray-800 text-sm line-clamp-2">
          {name}
        </h4>
        {marca && (
          <p className="text-xs text-gray-500 mt-1">{marca}</p>
        )}
        {(() => {
          const stockVal = product.stock ?? null;
          if (stockVal === null) return null;
          if (stockVal === 0)
            return (
              <div className="mt-2">
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                  Producto agotado
                </span>
              </div>
            );
          if (stockVal < 50)
            return (
              <div className="mt-2">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                  Pocas unidades
                </span>
              </div>
            );
          return null;
        })()}
      </div>
      <div className="mt-3">
        <div className="text-emerald-600 font-semibold text-lg">
          {fmt(price)}
        </div>
      </div>

      {/* Actions: children override default small overlay actions */}
      {children ? (
        <div className="mt-3">{children}</div>
      ) : (
        <div className="mt-3 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!effectivelyDisabled) onAdd && onAdd(product.id);
              }}
              disabled={effectivelyDisabled}
              className={`${effectivelyDisabled ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white"} p-2 rounded-full transition shadow-sm`}
              title={requiresPrescription ? "Requiere fórmula médica" : (effectivelyDisabled ? "Stock máximo alcanzado" : "Añadir")}
            >
              <Plus size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!effectivelyDisabled) {
                  onQuickBuy ? onQuickBuy(product) : onAdd && onAdd(product.id);
                }
              }}
              disabled={effectivelyDisabled}
              className="bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700 transition shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              title={requiresPrescription ? "Requiere fórmula médica" : "Comprar ahora"}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 6h15l-1.5 9h-13L4 2H2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export const ProductRowList = ({
  product,
  isFav,
  onToggleFav,
  onAdd,
  disabled,
  children,
}) => {
  const requiresPrescription = !!(product.requiereFormula || product.requiereFormulaMedica);
  const effectivelyDisabled = disabled || requiresPrescription;

  const name = product.name || product.nombre || "Producto";
  const image = product.image || product.imagen || null;
  const price = Number(product.price ?? product.precio ?? product.precioActual ?? 0);
  const marca = product.marca || product.laboratorio || "Genérico";

  return (
  <div className="bg-white border border-gray-100 rounded-lg p-4 flex items-center gap-4 hover:shadow-sm transition">
    <div className="h-20 w-20 bg-gray-50 rounded flex-shrink-0 flex items-center justify-center">
      {image ? (
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover rounded"
        />
      ) : (
        <Pill size={32} className="text-gray-300" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-gray-800">{name}</h4>
      {marca && (
        <p className="text-sm text-gray-500">{marca}</p>
      )}
      {requiresPrescription && (
        <div className="mt-1">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Fórmula médica 🩺
          </span>
        </div>
      )}
      {typeof product.stock !== "undefined" && (
        <div className="mt-1">
          {product.stock === 0 ? (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
              Producto agotado
            </span>
          ) : product.stock < 50 ? (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
              Pocas unidades
            </span>
          ) : null}
        </div>
      )}
    </div>
    <div className="flex items-center gap-3 flex-shrink-0">
      <div className="text-right">
        <div className="text-emerald-600 font-bold text-lg">
          {fmt(price)}
        </div>
      </div>
      {!children && (
        <>
          <button
            onClick={() => onAdd && onAdd(product.id)}
            disabled={effectivelyDisabled}
            className={`${effectivelyDisabled ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white"} px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition`}
            title={requiresPrescription ? "Requiere fórmula médica" : (disabled ? "Stock máximo alcanzado" : "Añadir")}
          >
            <Plus size={14} /> {requiresPrescription ? "Restringido" : (disabled ? "Stock máximo" : "Añadir")}
          </button>
        </>
      )}
      {children}
    </div>
  </div>
  );
};

export default ProductCardGrid;
