import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Search, Plus, Minus, X, Package } from "lucide-react";
import { productService } from "../../inventory/products/services/productService";

const fmt = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

export const ProductsSearchView = ({ cart, onAddProduct, onRemoveProduct, onUpdateQty, primary, primaryLight }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quickQty, setQuickQty] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const data = await productService.getAll();
      setProducts(Array.isArray(data) ? data.filter(p => p.estado) : []);
    } catch {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return products
      .filter(p =>
        (p.nombre || "").toLowerCase().includes(term) ||
        (p.codigoBarras || "").toLowerCase().includes(term)
      )
      .slice(0, 10);
  }, [products, searchTerm]);

  const [selectedLoteId, setSelectedLoteId] = useState("");

  const activeLotes = useMemo(() => {
    if (!selectedProduct || !selectedProduct.lotes) return [];
    return [...selectedProduct.lotes]
      .filter(l => l.cantidad > 0)
      .sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));
  }, [selectedProduct]);

  const selectedLote = useMemo(() => {
    if (!selectedLoteId || !activeLotes.length) return null;
    return activeLotes.find(l => l.id === Number(selectedLoteId));
  }, [selectedLoteId, activeLotes]);

  const handleLoteChange = (loteId) => {
    setSelectedLoteId(loteId);
    const lote = activeLotes.find(l => l.id === Number(loteId));
    const limit = lote ? lote.cantidad : (selectedProduct?.stock || 1);
    setQuickQty(prev => Math.min(limit, prev));
  };

  const handleSelectProduct = (product) => {
    if (product.stock <= 0) return;
    setSelectedProduct(product);
    setQuickQty(1);

    const productLotes = Array.isArray(product.lotes)
      ? [...product.lotes].filter(l => l.cantidad > 0).sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento))
      : [];
    if (productLotes.length > 0) {
      setSelectedLoteId(String(productLotes[0].id));
    } else {
      setSelectedLoteId("");
    }

    setShowModal(true);
    setShowDropdown(false);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    onAddProduct({
      ...selectedProduct,
      loteId: selectedLote ? selectedLote.id : null,
      numeroLote: selectedLote ? selectedLote.numeroLote : null,
    }, quickQty);
    setShowModal(false);
    setSearchTerm("");
    setSelectedProduct(null);
    setSelectedLoteId("");
  };

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Búsqueda */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar producto (nombre, código de barras...)"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(e.target.value.trim().length > 0);
            }}
            onFocus={() => searchTerm.trim().length > 0 && setShowDropdown(true)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>

        {/* Dropdown de Resultados */}
        {showDropdown && filteredProducts.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-40 max-h-96 overflow-y-auto">
            {filteredProducts.map((product) => {
              const sinStock = product.stock === 0;
              return (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  disabled={sinStock}
                  className="w-full px-4 py-3 hover:bg-emerald-50 border-b border-gray-100 last:border-0 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: primaryLight }}>
                    {product.imagen ? (
                      <img src={product.imagen} alt={product.nombre} className="w-full h-full object-contain p-1" />
                    ) : (
                      <Package size={20} style={{ color: primary, opacity: 0.4 }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate text-sm">{product.nombre}</p>
                    {(() => {
                      const parts = [product.concentracion, product.presentacion].filter(Boolean);
                      return parts.length > 0 ? (
                        <p className="text-[11px] text-gray-500 font-medium truncate mb-0.5">{parts.join(" · ")}</p>
                      ) : null;
                    })()}
                    <p className="text-xs text-gray-400">Stock: {product.stock}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm" style={{ color: primary }}>
                      {fmt(product.precio)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {showDropdown && searchTerm.trim().length > 0 && filteredProducts.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-40 p-4 text-center text-gray-500 text-sm">
            Sin resultados
          </div>
        )}
      </div>

      {/* Modal de Cantidad */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Agregar producto</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="w-24 h-24 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: primaryLight }}>
                {selectedProduct.imagen ? (
                  <img src={selectedProduct.imagen} alt={selectedProduct.nombre} className="w-full h-full object-contain p-1" />
                ) : (
                  <Package size={32} style={{ color: primary, opacity: 0.4 }} />
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{selectedProduct.nombre}</p>
                {(() => {
                  const parts = [selectedProduct.marca, selectedProduct.concentracion, selectedProduct.presentacion].filter(Boolean);
                  return parts.length > 0 ? (
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{parts.join(" · ")}</p>
                  ) : null;
                })()}
                <p className="text-sm text-gray-500 mt-1">Precio: {fmt(selectedProduct.precio)}</p>
                <p className="text-sm text-gray-500">Stock: {selectedProduct.stock}</p>
              </div>
            </div>

            {/* Lotes selector */}
            {activeLotes.length > 0 && (
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-600 block mb-1">Seleccionar Lote (FEFO)</label>
                <select
                  value={selectedLoteId}
                  onChange={(e) => handleLoteChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 font-medium"
                >
                  {activeLotes.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.numeroLote} - Vence: {l.fechaVencimiento} (Stock: {l.cantidad})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-600 block mb-2">Cantidad</label>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                <button
                  onClick={() => setQuickQty(Math.max(1, quickQty - 1))}
                  className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200 transition"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min="1"
                  max={selectedLote ? selectedLote.cantidad : selectedProduct.stock}
                  value={quickQty}
                  onChange={(e) => {
                    const limit = selectedLote ? selectedLote.cantidad : selectedProduct.stock;
                    setQuickQty(Math.min(limit, Math.max(1, parseInt(e.target.value) || 1)));
                  }}
                  className="flex-1 text-center font-bold text-lg bg-transparent border-0 focus:outline-none"
                />
                <button
                  onClick={() => {
                    const limit = selectedLote ? selectedLote.cantidad : selectedProduct.stock;
                    setQuickQty(Math.min(limit, quickQty + 1));
                  }}
                  className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200 transition"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Subtotal: <span className="font-bold" style={{ color: primary }}>
                {fmt(selectedProduct.precio * quickQty)}
              </span>
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddToCart}
                className="flex-1 py-2.5 rounded-xl text-white font-semibold transition-all active:scale-95"
                style={{ background: primary }}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carrito de Productos */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 h-96 flex flex-col">
        <h3 className="font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">📦 Productos en carrito</h3>
        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Package size={40} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Sin productos</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2">
            {cart.map((item) => {
              const maxStock = item.loteId ? (item.lotes?.find(l => l.id === item.loteId)?.cantidad ?? item.stock) : item.stock;
              return (
                <div key={`${item.id}-${item.loteId || 'no-lote'}`} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{item.nombre}</p>
                      {item.numeroLote && (
                        <p className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 inline-block my-0.5">
                          Lote: {item.numeroLote}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">{fmt(item.precio)} c/u</p>
                      {maxStock != null && (
                        <p className="text-xs text-gray-400">Stock disponible: {maxStock}</p>
                      )}
                    </div>
                    <button onClick={() => onRemoveProduct(item.id, item.loteId)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-white rounded border border-gray-200">
                      <button onClick={() => onUpdateQty(item.id, item.loteId, item.cantidad - 1)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.cantidad}</span>
                      <button
                        onClick={() => onUpdateQty(item.id, item.loteId, item.cantidad + 1)}
                        disabled={maxStock != null && item.cantidad >= maxStock}
                        className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={maxStock != null && item.cantidad >= maxStock ? "Stock máximo alcanzado" : "Aumentar cantidad"}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="font-bold text-sm" style={{ color: primary }}>
                      {fmt(item.precio * item.cantidad)}
                    </p>
                  </div>
                  {maxStock != null && item.cantidad >= maxStock && (
                    <p className="text-xs text-red-500 mt-1 font-medium">⚠ Stock máximo alcanzado</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
