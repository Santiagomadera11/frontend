import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { LS, read, write } from "../../shared/services/lsService";
import { ToastNotification } from "../../shared/ui/ToastNotification";
import ProductCardGrid, { ProductRowList } from "./components/ProductCard";
import ProductDetailModal from "../../shared/ui/ProductDetailModal";
import farmaciaImage from "../../assets/farmacia.avif";

const ProductCard = ({ product, onAdd }) => {
  // Map from product schema to ProductCardGrid schema, asegurando todos los campos
  const mappedProduct = {
    id: product.id,
    name: product.nombre || product.name || "Sin nombre",
    price: Number(product.precio ?? product.price ?? 0),
    image: product.imagen || product.image || farmaciaImage,
    marca:
      product.laboratorio || product.marca || product.proveedor || "Genérico",
    stock: product.stock ?? product.existencia ?? 0,
  };
  return (
    <ProductCardGrid
      product={mappedProduct}
      onAdd={() => onAdd(product.id)}
      disabled={(product.stock ?? 0) <= 0}
    />
  );
};

const ClientCatalogo = () => {
  const { currentUser } = useCurrentUser();
  const [products, setProducts] = useState([]);
  // Depuración: mostrar productos en consola
  console.log("[DEBUG] Productos en memoria:", products);
  // Generar categorías a partir de los productos cargados
  const categories = Array.from(
    new Set((products || []).map((p) => p.categoria)),
  ).filter(Boolean);
  // Mostrar todos los productos sin filtros
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  // no view mode toggle on home, always grid view
  const [toast, setToast] = useState(null);
  const [userName, setUserName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const listRef = React.useRef(null);

  // scroll to product list whenever a category filter is applied
  useEffect(() => {
    if (categoryFilter && listRef.current) {
      listRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [categoryFilter]);

  // load user from localStorage for greeting
  useEffect(() => {
    if (currentUser && currentUser.nombre) {
      setUserName(currentUser.nombre);
    }
  }, [currentUser]);

  // load products
  useEffect(() => {
    const load = () => {
      try {
        const storedProducts = JSON.parse(
          localStorage.getItem("syspharma_products") || "[]",
        );
        console.log("[DEBUG] Productos cargados:", storedProducts);
        const mappedProducts = Array.isArray(storedProducts)
          ? storedProducts.map((p) => ({
              ...p,
              id: p.id,
              nombre: p.nombre || p.name || "Sin nombre",
              name: p.nombre || p.name || "Sin nombre",
              precio: Number(p.precio ?? p.price ?? 0),
              price: Number(p.precio ?? p.price ?? 0),
              imagen: p.imagen || p.image || farmaciaImage,
              image: p.imagen || p.image || farmaciaImage,
              categoria: p.categoria || "Otros",
              laboratorio:
                p.laboratorio || p.marca || p.proveedor || "Genérico",
              marca:
                p.laboratorio || p.marca || p.proveedor || "Genérico",
              stock: p.stock ?? p.existencia ?? 0,
              requiereFormula: p.requiereFormula,
              requiereFormulaMedica: p.requiereFormulaMedica,
            }))
          : [];
        setProducts(mappedProducts);
      } catch (e) {
        console.error("[DEBUG] Error cargando productos:", e);
        setProducts([]);
      }
    };

    load();

    const handleProductsUpdate = () => load();
    window.addEventListener(`${LS.PRODUCTS}_updated`, handleProductsUpdate);
    return () =>
      window.removeEventListener(
        `${LS.PRODUCTS}_updated`,
        handleProductsUpdate,
      );
  }, []);

  const saveCartAndNotify = (id) => {
    const raw = read(LS.CART) || [];
    const prods = products || [];
    const prod = prods.find((p) => p.id === id || p.id === Number(id));
    const stock = prod ? (prod.stock ?? 0) : 0;

    const arr = (raw || []).map((it) =>
      it && typeof it === "object" ? it : { id: it, cantidad: 1 },
    );
    const existing = arr.find((it) => it.id === id);
    const currentQty = existing ? existing.cantidad : 0;
    if (currentQty >= stock) {
      setToast({
        message: "Stock máximo alcanzado",
        type: "error",
        zIndex: 70,
      });
      return;
    }

    if (existing) {
      existing.cantidad = Math.min(stock, existing.cantidad + 1);
      existing.precio =
        Number(
          prod
            ? (prod.price ?? prod.precio ?? existing.precio)
            : existing.precio,
        ) || 0;
    } else {
      arr.push({
        id,
        cantidad: 1,
        precio: Number(prod ? (prod.price ?? prod.precio ?? 0) : 0) || 0,
      });
    }

    write(LS.CART, arr);
    setToast({
      message: "Producto añadido al carrito",
      type: "success",
      zIndex: 70,
    });
  };



  // Generar categorías a partir de los productos cargados

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- Hero */}
      <div className="bg-white py-16 px-8 text-center">
        <h2 className="text-3xl font-bold">
          ¡Bienvenido{userName ? `, ${userName}` : ""}!
        </h2>
        <p className="text-gray-600 mt-2">
          Explora nuestras ofertas y encuentra lo que necesitas
        </p>
        {/* search inside hero */}
        <div className="mt-6 flex justify-center">
          <div className="relative w-full max-w-xl">
            <Search
              size={20}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar por nombre o marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow"
            />
          </div>
        </div>
      </div>

      {/* --- Categories row (basado en productos cargados) */}
      <div className="px-8 py-6">
        <h3 className="text-xl font-semibold mb-4">Categorías</h3>
        {categories.length === 0 ? (
          <div className="text-gray-400 text-sm">
            No hay categorías disponibles. Registra productos para ver
            categorías.
          </div>
        ) : (
          <div className="flex space-x-4 overflow-x-auto pb-2">
            <button
              onClick={() => setCategoryFilter("")}
              className={`flex-none px-4 py-2 rounded-lg border text-sm ${
                categoryFilter === ""
                  ? "border-emerald-600 text-emerald-600"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`flex-none px-4 py-2 rounded-lg border text-sm ${
                  categoryFilter === cat
                    ? "border-emerald-600 text-emerald-600"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- Featured carousel eliminado por error de variable no definida --- */}

      {/* --- Product list (sin filtros) */}
      <div className="px-8 py-6" ref={listRef}>
        {products.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-100">
            <p className="text-gray-500">
              No hay productos registrados en el sistema
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Verifica que los productos estén creados y sincronizados en el
              administrador.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCardGrid
                key={p.id}
                product={p}
                onAdd={saveCartAndNotify}
                onOpenDetail={setSelectedProduct}
                disabled={(p.stock || 0) <= 0}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          zIndex={toast.zIndex}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ClientCatalogo;
