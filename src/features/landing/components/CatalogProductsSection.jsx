import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import useCart from "../../../shared/context/CartContext";
import GuestOrderModal from "./GuestOrderModal";
import ProductDetailModal from "../../../shared/ui/ProductDetailModal";
import { toast } from "../../../shared/utils/toast";
import ProductCardGrid from "../../client/components/ProductCard";

export const CatalogProductsSection = () => {
  // Estado para productos originales (lista completa sin modificar)
  const [productosOriginales, setProductosOriginales] = useState([]);
  // Estado para productos filtrados
  const [filteredProducts, setFilteredProducts] = useState([]);
  // Array de categorías disponibles
  const [categorias, setCategorias] = useState([]);
  // Filtros
  const [searchValue, setSearchValue] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [guestProduct, setGuestProduct] = useState(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const cart = useCart();

  // Cargar productos y categorías del localStorage al montar el componente
  useEffect(() => {
    cargarDatos();
    window.addEventListener("syspharma_products_updated", cargarDatos);

    return () => {
      window.removeEventListener("syspharma_products_updated", cargarDatos);
    };
  }, []);

  const cargarDatos = () => {
    try {
      // La página pública carga productos desde localStorage
      // Los productos se sincronizan desde el admin/employee cuando crean nuevos

      const stored = localStorage.getItem("syspharma_products");

      let products = JSON.parse(stored || "[]");

      if (products.length > 0) {
      }

      // Filtrar solo productos activos (estado === true o estado === "Activo")
      const activeProducts = products.filter((p) => {
        const isActive = p.estado === true || p.estado === "Activo" || p.estado === undefined || p.estado === null;
        if (!isActive) {
        }
        return isActive;
      });

      if (activeProducts.length > 0) {
      }

      // Guardar en estado original
      setProductosOriginales(activeProducts);

      // Extraer categorías únicas de los productos activos
      const uniqueCategories = [
        ...new Set(activeProducts.map((p) => p.categoria || p.categoría).filter(Boolean)),
      ].sort();

      setCategorias(uniqueCategories);

    } catch (error) {
      console.error("❌ Error loading products:", error);
      setProductosOriginales([]);
      setCategorias([]);
    }
  };

  // FUNCIÓN ÚNICA DE FILTRADO: aplica todos los filtros simultáneamente
  const filtrarProductos = () => {

    const filtered = productosOriginales.filter((product) => {
      // Filtro 1: Búsqueda por nombre
      const matchesSearch =
        !searchValue ||
        (product.nombre &&
          product.nombre.toLowerCase().includes(searchValue.toLowerCase()));

      // Filtro 2: Categoría (si no es "Todas", filtra por la categoría seleccionada)
      const categoria = product.categoria || product.categoría;
      const matchesCategory =
        categoriaSeleccionada === "Todas" ||
        categoria === categoriaSeleccionada;

      // Filtro 3: Rango de precio
      const matchesPrice =
        product.precio >= priceRange[0] && product.precio <= priceRange[1];

      const passes = matchesSearch && matchesCategory && matchesPrice;

      if (!passes) {
      }

      return passes;
    });

    setFilteredProducts(filtered);
  };

  // Ejecutar filtrado cuando cambien los filtros
  useEffect(() => {
    filtrarProductos();
  }, [searchValue, categoriaSeleccionada, priceRange, productosOriginales]);

  const handleCategoryChange = (category) => {
    setCategoriaSeleccionada(category);
  };

  // Función para aplicar el filtro de precio - convierte números y valida
  const applyPriceFilter = () => {
    // Quitar $ y espacios si existen y convertir a números
    const minStr = minPriceInput
      ? String(minPriceInput).replace(/[$\s,]/g, "")
      : "0";
    const maxStr = maxPriceInput
      ? String(maxPriceInput).replace(/[$\s,]/g, "")
      : "500000";

    const min = parseInt(minStr) || 0;
    const max = parseInt(maxStr) || 500000;

    // Asegurar que min no sea mayor a max
    if (min > max) {
      toast("El precio mínimo no puede ser mayor al máximo", "error");
      return;
    }

    setPriceRange([min, max]);
  };

  const clearFilters = () => {
    setSearchValue("");
    setCategoriaSeleccionada("Todas");
    setPriceRange([0, 500000]);
    setMinPriceInput("");
    setMaxPriceInput("");
  };



  // Replaced local ProductCard component with the unified ProductCardGrid import.

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ASIDE - SIDEBAR DE FILTROS */}
      <aside className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto hidden lg:block">
        <h2 className="text-lg font-bold text-gray-900 mb-8">Filtros</h2>

        {/* CATEGORÍAS */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">
            Categorías
          </h3>
          <div className="space-y-3">
            {/* Opción "Todas" */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="categoria"
                value="Todas"
                checked={categoriaSeleccionada === "Todas"}
                onChange={() => handleCategoryChange("Todas")}
                className="w-4 h-4 text-emerald-600 cursor-pointer"
              />
              <span className="text-gray-700 text-sm group-hover:text-emerald-600 transition font-medium">
                Todas
              </span>
            </label>

            {/* Categorías dinámicas */}
            {categorias.map((categoria) => (
              <label
                key={categoria}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="categoria"
                  value={categoria}
                  checked={categoriaSeleccionada === categoria}
                  onChange={() => handleCategoryChange(categoria)}
                  className="w-4 h-4 text-emerald-600 cursor-pointer"
                />
                <span className="text-gray-700 text-sm group-hover:text-emerald-600 transition capitalize">
                  {categoria}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* RANGO DE PRECIO */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">
            Rango de Precio
          </h3>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Mínimo"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="number"
              placeholder="Máximo"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={applyPriceFilter}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded text-sm font-medium transition"
            >
              Aplicar
            </button>
            <button
              onClick={() => {
                setMinPriceInput("");
                setMaxPriceInput("");
                setPriceRange([0, 500000]);
              }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-2 rounded text-sm font-medium transition"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* LIMPIAR TODOS LOS FILTROS */}
        <button
          onClick={clearFilters}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-2 rounded text-sm font-medium transition"
        >
          Limpiar Filtros
        </button>
      </aside>

      {/* MAIN - CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col">
        {/* BUSCADOR SUPERIOR */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 p-6 overflow-auto">
          {/* CONTADOR */}
          {filteredProducts.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Mostrando{" "}
                <span className="font-semibold text-gray-900">
                  {filteredProducts.length}
                </span>{" "}
                de{" "}
                <span className="font-semibold text-gray-900">
                  {productosOriginales.length}
                </span>{" "}
                productos
              </p>
            </div>
          )}

          {/* GRID DE PRODUCTOS */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const mapped = {
                  ...product,
                  id: product.id,
                  name: product.nombre || product.name || "Producto",
                  marca: product.laboratorio || product.marca || product.proveedor || "",
                  price: Number(product.precio ?? product.price ?? 0),
                  image: product.imagen || product.image || null,
                  stock: product.stock ?? product.existencia ?? 0,
                  requiereFormula: product.requiereFormula,
                  requiereFormulaMedica: product.requiereFormulaMedica,
                };
                return (
                  <ProductCardGrid
                    key={product.id}
                    product={mapped}
                    onOpenDetail={() => setSelectedProduct(product)}
                    onAdd={() => {
                      try {
                        cart.addToCart(product);
                        toast.success(`¡${product.nombre} agregado al carrito!`);
                      } catch (e) {
                        console.error(e);
                        toast.error("Error al agregar al carrito");
                      }
                    }}
                    onQuickBuy={() => {
                      setGuestProduct(product);
                      setIsGuestModalOpen(true);
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <p className="text-gray-500 text-lg">
                  No hay productos que coincidan con los filtros
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALES */}
      {selectedProduct &&
        createPortal(
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />,
          document.body
        )}
      {guestProduct && (
        <GuestOrderModal
          isOpen={isGuestModalOpen}
          onClose={() => {
            setIsGuestModalOpen(false);
            setGuestProduct(null);
          }}
          product={guestProduct}
        />
      )}
    </div>
  );
};

export default CatalogProductsSection;
