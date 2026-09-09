import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { LS, read, write } from "../../shared/services/lsService";
import { ToastNotification } from "../../shared/ui/ToastNotification";
import ProductCardGrid from "./components/ProductCard";

const FavoritosPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    load();
    const onFavUpdated = () => load();
    window.addEventListener(`${LS.FAVORITES}_updated`, onFavUpdated);
    window.addEventListener(`${LS.PRODUCTS}_updated`, onFavUpdated);
    return () => {
      window.removeEventListener(`${LS.FAVORITES}_updated`, onFavUpdated);
      window.removeEventListener(`${LS.PRODUCTS}_updated`, onFavUpdated);
    };
  }, []);

  function load() {
    const fav = read(LS.FAVORITES) || [];
    const prods = read(LS.PRODUCTS) || [];
    // Map favorites to current product data. Favorites may be stored as IDs or objects.
    const mapped = (fav || []).map((f) => {
      const id = f && typeof f === "object" ? (f.id ?? f) : f;
      const p =
        prods.find((x) => x.id === id || x.id === Number(id)) ||
        (typeof f === "object" ? f : null) ||
        {};
      return {
        id: p.id ?? id,
        nombre: p.nombre ?? p.name ?? "",
        precio: p.precio ?? p.price ?? 0,
        imagen: p.imagen ?? p.image ?? "",
        laboratorio: p.laboratorio ?? p.marca ?? "",
        stock: p.stock ?? p.existencia ?? 0,
        enOferta: p.enOferta,
        porcentajeDescuento: p.porcentajeDescuento,
      };
    });
    setFavorites(mapped);
  }

  const handleRemove = (id) => {
    const raw = read(LS.FAVORITES) || [];
    const arr = raw.filter((f) => {
      if (f && typeof f === "object") return f.id !== id;
      return f !== id;
    });
    write(LS.FAVORITES, arr);
    setToast({
      message: "Eliminado de favoritos",
      type: "success",
      zIndex: 70,
    });
  };

  const addToCartAndRemove = (id) => {
    const prods = read(LS.PRODUCTS) || [];
    const prod = prods.find((p) => p.id === id) || {};
    const stock = prod.stock ?? prod.existencia ?? 0;
    if (stock <= 0) {
      setToast({ message: "Producto agotado", type: "error", zIndex: 70 });
      return;
    }

    // add to cart (normalize)
    const rawCart = read(LS.CART) || [];
    const normCart = (rawCart || []).map((it) =>
      it && typeof it === "object" ? it : { id: it, cantidad: 1, precio: 0 },
    );
    const found = normCart.find((it) => it.id === id);
    if (found) {
      found.cantidad = Math.min(stock, (found.cantidad || 0) + 1);
      found.precio =
        Number((prod.precio ?? prod.price ?? found.precio) || 0) || 0;
    } else {
      normCart.push({
        id,
        cantidad: 1,
        precio: Number((prod.precio ?? prod.price ?? 0) || 0) || 0,
      });
    }
    write(LS.CART, normCart);

    // remove from favorites (persist and update state)
    const rawFav = read(LS.FAVORITES) || [];
    const nextFav = rawFav.filter((f) =>
      f && typeof f === "object" ? f.id !== id : f !== id,
    );
    write(LS.FAVORITES, nextFav);
    // update local state immediately
    setFavorites((prev) => prev.filter((p) => p.id !== id));

    setToast({
      message: "Añadido al carrito y eliminado de favoritos",
      type: "success",
      zIndex: 70,
    });
  };

  if (!favorites || favorites.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Volver"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h2 className="text-xl font-bold">Tus Favoritos</h2>
        </div>
        <p>Tu lista de deseos está vacía. ¡Explora el catálogo!</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Volver"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <h2 className="text-xl font-bold">Tus Favoritos</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {favorites.map((p) => (
          <ProductCardGrid
            key={p.id}
            product={{
              id: p.id,
              name: p.nombre,
              price: p.precio,
              image: p.imagen,
              marca: p.laboratorio,
              stock: p.stock,
            }}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => addToCartAndRemove(p.id)}
                disabled={(p.stock || 0) <= 0}
                className={`${(p.stock || 0) <= 0 ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white"} px-4 py-2 rounded-lg font-medium`}
              >
                {(p.stock || 0) <= 0 ? "Agotado" : "Añadir al Carrito"}
              </button>
              <button
                onClick={() => handleRemove(p.id)}
                className="px-3 py-2 border rounded text-sm"
              >
                Eliminar
              </button>
            </div>
          </ProductCardGrid>
        ))}
      </div>
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

export default FavoritosPage;
