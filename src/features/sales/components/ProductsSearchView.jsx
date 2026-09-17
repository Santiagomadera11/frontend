import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Search, Plus, Minus, X, Package } from "lucide-react";
import { productService } from "../../inventory/products/services/productService";

const fmt = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

export const ProductsSearchView = ({ onAddProduct, primary, primaryLight }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quickQty, setQuickQty] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [scanError, setScanError] = useState("");
  const searchInputRef = useRef(null);

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

  // Foco automático para poder escanear apenas se abre la pantalla de venta
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

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
  const [selectedFormaVentaId, setSelectedFormaVentaId] = useState(null);

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

  // Formas de venta habilitadas del producto (Unidad/Blister/Caja). Si el
  // producto no tiene más que "Unidad" (caso normal hoy), este array queda
  // con 0 o 1 elementos y no se muestra selector alguno.
  const activeFormasVenta = useMemo(() => {
    if (!selectedProduct || !Array.isArray(selectedProduct.formasVenta)) return [];
    return selectedProduct.formasVenta.filter(f => f.activo !== false);
  }, [selectedProduct]);

  const formaSeleccionada = useMemo(() => {
    if (!activeFormasVenta.length) return null;
    return (
      activeFormasVenta.find(f => f.id === selectedFormaVentaId) ||
      activeFormasVenta.find(f => f.tipo === "Unidad") ||
      activeFormasVenta[0]
    );
  }, [activeFormasVenta, selectedFormaVentaId]);

  const precioActual = formaSeleccionada ? formaSeleccionada.precio : (selectedProduct?.precio ?? 0);
  const factorActual = formaSeleccionada ? (formaSeleccionada.factorUnidades || 1) : 1;

  // Cantidad máxima vendible en la forma elegida: el stock siempre se guarda
  // en unidades sueltas, así que si la forma tiene factor > 1 (ej. Blister
  // x10) hay que convertir el stock disponible a "cantidad de esa forma".
  const maxCantidad = useMemo(() => {
    if (!selectedProduct) return 1;
    const stockUnidades = selectedLote ? selectedLote.cantidad : (selectedProduct.stock || 0);
    return Math.max(0, Math.floor(stockUnidades / factorActual));
  }, [selectedProduct, selectedLote, factorActual]);

  useEffect(() => {
    setQuickQty(prev => {
      if (maxCantidad <= 0) return 0;
      return Math.min(Math.max(prev, 1), maxCantidad);
    });
  }, [maxCantidad]);

  const handleLoteChange = (loteId) => {
    setSelectedLoteId(loteId);
  };

  const handleSelectProduct = (product) => {
    if (product.stock <= 0) return;
    setSelectedProduct(product);
    setQuickQty(1);

    const formas = Array.isArray(product.formasVenta) ? product.formasVenta.filter(f => f.activo !== false) : [];
    const defaultForma = formas.find(f => f.tipo === "Unidad") || formas[0] || null;
    setSelectedFormaVentaId(defaultForma ? defaultForma.id : null);

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
    if (!selectedProduct || maxCantidad < 1) return;
    onAddProduct({
      ...selectedProduct,
      loteId: selectedLote ? selectedLote.id : null,
      numeroLote: selectedLote ? selectedLote.numeroLote : null,
      precio: precioActual,
      formaVentaId: formaSeleccionada ? formaSeleccionada.id : null,
      formaVentaTipo: formaSeleccionada ? formaSeleccionada.tipo : "Unidad",
      factorUnidades: factorActual,
    }, quickQty);
    setShowModal(false);
    setSearchTerm("");
    setSelectedProduct(null);
    setSelectedLoteId("");
    setSelectedFormaVentaId(null);
    searchInputRef.current?.focus();
  };

  // Lector de código de barras: escribe el código y envía Enter automáticamente.
  // Si el código coincide exacto con un producto, se agrega directo (1 unidad,
  // lote más próximo a vencer) sin pasar por el modal, para que el flujo de
  // venta sea "escanear y listo".
  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const term = searchTerm.trim();
    if (!term) return;

    const match = products.find(
      (p) => (p.codigoBarras || "").toLowerCase() === term.toLowerCase()
    );
    if (!match) return;

    e.preventDefault();
    setScanError("");

    if (match.stock <= 0) {
      setScanError(`${match.nombre} no tiene stock disponible`);
      setSearchTerm("");
      return;
    }

    const productLotes = Array.isArray(match.lotes)
      ? [...match.lotes].filter(l => l.cantidad > 0).sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento))
      : [];
    const lote = productLotes[0] || null;

    // El escaneo siempre agrega "Unidad" (comportamiento actual preservado),
    // pero igual hay que propagar el formaVentaId de esa forma para que el
    // backend pueda resolver el factor/precio congelado correctamente.
    const unidadForma = Array.isArray(match.formasVenta)
      ? match.formasVenta.find(f => f.tipo === "Unidad")
      : null;

    onAddProduct({
      ...match,
      loteId: lote ? lote.id : null,
      numeroLote: lote ? lote.numeroLote : null,
      precio: unidadForma ? unidadForma.precio : match.precio,
      formaVentaId: unidadForma ? unidadForma.id : null,
      formaVentaTipo: "Unidad",
      factorUnidades: 1,
    }, 1);

    setSearchTerm("");
    setShowDropdown(false);
    searchInputRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Búsqueda */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            ref={searchInputRef}
            type="text"
            autoComplete="off"
            placeholder="Buscar o escanear código de barras..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(e.target.value.trim().length > 0);
              if (scanError) setScanError("");
            }}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => searchTerm.trim().length > 0 && setShowDropdown(true)}
            className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-xs"
          />
        </div>

        {scanError && (
          <p className="text-[11px] text-red-600 font-semibold mt-1">{scanError}</p>
        )}

        {/* Dropdown de Resultados */}
        {showDropdown && filteredProducts.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-80 overflow-y-auto">
            {filteredProducts.map((product) => {
              const sinStock = product.stock === 0;
              return (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  disabled={sinStock}
                  className="w-full px-3 py-2 hover:bg-emerald-50 border-b border-gray-100 last:border-0 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: primaryLight }}>
                    <Package size={16} style={{ color: primary, opacity: 0.4 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900 truncate text-xs">{product.nombre}</p>
                      {product.marca && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: primaryLight, color: primary }}>
                          {product.marca}
                        </span>
                      )}
                    </div>
                    {(() => {
                      const parts = [product.concentracion, product.presentacion].filter(Boolean);
                      return parts.length > 0 ? (
                        <p className="text-[10px] text-gray-500 font-medium truncate">{parts.join(" · ")}</p>
                      ) : null;
                    })()}
                    <p className="text-[10px] text-gray-400">Stock: {product.stock}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-xs" style={{ color: primary }}>
                      {fmt(product.precio)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {showDropdown && searchTerm.trim().length > 0 && filteredProducts.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg z-40 p-3 text-center text-gray-500 text-xs">
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
                <Package size={32} style={{ color: primary, opacity: 0.4 }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-bold text-gray-900">{selectedProduct.nombre}</p>
                  {selectedProduct.marca && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: primaryLight, color: primary }}>
                      {selectedProduct.marca}
                    </span>
                  )}
                </div>
                {(() => {
                  const parts = [selectedProduct.concentracion, selectedProduct.presentacion].filter(Boolean);
                  return parts.length > 0 ? (
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{parts.join(" · ")}</p>
                  ) : null;
                })()}
                <p className="text-sm text-gray-500 mt-1">Precio: {fmt(precioActual)}</p>
                <p className="text-sm text-gray-500">Stock: {selectedProduct.stock}</p>
              </div>
            </div>

            {/* Selector de forma de venta: solo aparece si el producto tiene
                más de una forma habilitada (ej. Unidad + Blister). Si solo
                tiene "Unidad" (caso normal hoy), no se muestra nada. */}
            {activeFormasVenta.length > 1 && (
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-600 block mb-2">Forma de venta</label>
                <div className="flex gap-1.5 flex-wrap">
                  {activeFormasVenta.map((f) => {
                    const active = formaSeleccionada?.id === f.id;
                    return (
                      <label
                        key={f.id}
                        className="flex-1 min-w-[90px] cursor-pointer rounded-lg border-2 px-2 py-1.5 text-center transition"
                        style={{
                          borderColor: active ? primary : "#e5e7eb",
                          background: active ? primaryLight : "#fff",
                        }}
                      >
                        <input
                          type="radio"
                          name="formaVenta"
                          className="sr-only"
                          checked={active}
                          onChange={() => setSelectedFormaVentaId(f.id)}
                        />
                        <span className="block text-xs font-bold text-gray-800">
                          {f.tipo}{f.factorUnidades > 1 ? ` x${f.factorUnidades}` : ""}
                        </span>
                        <span className="block text-[10px] text-gray-500">{fmt(f.precio)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

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
                  disabled={maxCantidad < 1}
                  className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min="1"
                  max={maxCantidad}
                  value={quickQty}
                  disabled={maxCantidad < 1}
                  onChange={(e) => {
                    setQuickQty(Math.min(maxCantidad, Math.max(1, parseInt(e.target.value) || 1)));
                  }}
                  className="flex-1 text-center font-bold text-lg bg-transparent border-0 focus:outline-none disabled:opacity-40"
                />
                <button
                  onClick={() => setQuickQty(Math.min(maxCantidad, quickQty + 1))}
                  disabled={maxCantidad < 1 || quickQty >= maxCantidad}
                  className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                </button>
              </div>
              {maxCantidad < 1 && (
                <p className="text-xs text-red-500 font-semibold mt-1">
                  Sin stock suficiente para vender esta forma ({formaSeleccionada?.tipo || "Unidad"}).
                </p>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Subtotal: <span className="font-bold" style={{ color: primary }}>
                {fmt(precioActual * quickQty)}
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
                disabled={maxCantidad < 1}
                className="flex-1 py-2.5 rounded-xl text-white font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: maxCantidad < 1 ? "#94a3b8" : primary }}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estado vacío / hint — el carrito real vive en la columna central */}
      {!showDropdown && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 rounded-lg border-2 border-dashed border-gray-100">
          <Search size={28} className="mb-1.5 opacity-40" />
          <p className="text-xs font-semibold text-gray-400">Busca un producto para agregarlo</p>
          <p className="text-[10px] text-gray-300 mt-0.5">Por nombre o código de barras</p>
        </div>
      )}
    </div>
  );
};
