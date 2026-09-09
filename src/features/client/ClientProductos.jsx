import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import ProductCardGrid from "./components/ProductCard";
import FilterSidebar from "./components/FilterSidebar";
import ProductDetailModal from "../../shared/ui/ProductDetailModal";
import useCart from "../../shared/context/CartContext";

// Map product schema used by backend to the interface expected by ProductCardGrid
const ProductCard = ({ product, onAdd, onOpenDetail }) => {
  const mappedProduct = {
    ...product,
    id: product.id,
    name: product.nombre,
    price: product.precio,
    image: product.imagen || "",
    marca: product.laboratorio || "",
    stock: product.stock ?? product.existencia ?? 0,
    requiereFormula: product.requiereFormula,
    requiereFormulaMedica: product.requiereFormulaMedica,
  };
  return (
    <ProductCardGrid
      product={mappedProduct}
      onAdd={() => onAdd(product.id)}
      onOpenDetail={onOpenDetail}
      disabled={(product.stock ?? 0) <= 0}
    />
  );
};

const ClientProductos = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const cart = useCart();

  useEffect(() => {
    // Cargar productos desde localStorage
    try {
      const products = JSON.parse(
        localStorage.getItem("syspharma_products") || "[]",
      );
      setAllProducts(Array.isArray(products) ? products : []);
    } catch {
      setAllProducts([]);
    }

    // Escuchar actualizaciones de productos
    const handleProductsUpdate = () => {
      try {
        const products = JSON.parse(
          localStorage.getItem("syspharma_products") || "[]",
        );
        setAllProducts(Array.isArray(products) ? products : []);
      } catch {
        setAllProducts([]);
      }
    };

    window.addEventListener("syspharma_products_updated", handleProductsUpdate);
    return () => {
      window.removeEventListener(
        "syspharma_products_updated",
        handleProductsUpdate,
      );
    };
  }, []);



  const saveCartAndNotify = (id) => {
    try {
      // find product object in allProducts
      const prod = allProducts.find((p) => String(p.id) === String(id)) || {};
      cart.addToCart(prod);
      try {
        window.dispatchEvent(new Event("syspharma_cart_updated"));
      } catch {
        // Error dispatching event
      }
    } catch {
      console.error("Error adding to cart");
    }
  };

  const filterBySearchAndCategory = (productList) => {
    return productList.filter((p) => {
      const matchesCategory =
        !selectedCategory || p.categoria === selectedCategory;
      const matchesSearch =
        !searchValue ||
        p.nombre.toLowerCase().includes(searchValue.toLowerCase());
      const matchesPrice = p.precio >= priceRange[0] && p.precio <= priceRange[1];
      return matchesCategory && matchesSearch && matchesPrice;
    });
  };

  // Filtros dinámicos basados en los switches del admin
  // Ya no necesitamos estas variables porque se calculan inline en el render

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
        <p className="text-sm text-gray-500">Todos los productos</p>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1">
        {/* Sidebar Filtros */}
        <FilterSidebar
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          priceRange={priceRange}
          onPriceChange={setPriceRange}
        />

        {/* Main Content Area */}
        <main className="flex-1 bg-gray-50">
          <div className="px-8 py-8">
            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Busca por nombre, laboratorio, marca..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                />
              </div>
            </div>

            {/* Todos los Productos */}
            {(() => {
              const filtered = filterBySearchAndCategory(allProducts);
              return filtered.length > 0 ? (
                <div className="mb-12">
                  <div className="flex items-baseline justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Todos los Productos
                    </h2>
                    <p className="text-sm text-gray-500">
                      Mostrando {filtered.length} de {allProducts.length} productos
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAdd={saveCartAndNotify}
                        onOpenDetail={setSelectedProduct}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-12 bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                  <p className="text-emerald-800 text-sm">
                    ℹ️ No hay productos que coincidan con los filtros. Agrega productos desde el administrador.
                  </p>
                </div>
              );
            })()}
          </div>
        </main>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};

export default ClientProductos;
