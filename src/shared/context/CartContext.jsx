import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { LS, read, write } from "../services/lsService";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      return read(LS.CART) || [];
    } catch {
      try {
        const raw = localStorage.getItem(LS.CART);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // keep storage in sync
  useEffect(() => {
    try {
      write(LS.CART, cartItems);
    } catch {
      try {
        localStorage.setItem(LS.CART, JSON.stringify(cartItems));
      } catch (e) {}
    }
  }, [cartItems]);

  // listen for external updates, but avoid feedback loops by comparing
  const cartRef = useRef(cartItems);
  useEffect(() => {
    cartRef.current = cartItems;
  }, [cartItems]);

  useEffect(() => {
    const handler = () => {
      try {
        const updated = read(LS.CART) || [];
        const normalized = Array.isArray(updated) ? updated : [];
        const current = cartRef.current || [];
        // compare simple JSON to detect real changes and avoid loops
        try {
          if (JSON.stringify(normalized) !== JSON.stringify(current)) {
            setCartItems(normalized);
          }
        } catch (e) {
          // fallback: set only if lengths differ
          if (normalized.length !== current.length) setCartItems(normalized);
        }
      } catch {
        try {
          const raw = localStorage.getItem(LS.CART);
          const parsed = raw ? JSON.parse(raw) : [];
          const current = cartRef.current || [];
          if (JSON.stringify(parsed) !== JSON.stringify(current))
            setCartItems(parsed);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener(`${LS.CART}_updated`, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(`${LS.CART}_updated`, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const saveCart = (items) => setCartItems(items);

  const addToCart = (product) => {
    const id =
      product.id ??
      product._id ??
      String(product.nombre) + String(product.precio);
    setCartItems((prev) => {
      const existing = prev.find((i) => String(i.id) === String(id));
      if (existing) {
        return prev.map((it) =>
          String(it.id) === String(id)
            ? { ...it, cantidad: (Number(it.cantidad) || 1) + 1 }
            : it,
        );
      }
      const item = {
        id,
        nombre: product.nombre || product.name || product.title || "",
        precio: Number(product.precio ?? product.price ?? 0),
        imagen: product.imagen || product.image || null,
        cantidad: 1,
      };
      return [item, ...prev];
    });
  };

  const removeFromCart = (id, qty = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((it) => String(it.id) === String(id));
      if (!existing) return prev;
      const currentQty = Number(existing.cantidad) || 1;
      if (qty >= currentQty) {
        return prev.filter((it) => String(it.id) !== String(id));
      }
      // decrement
      return prev.map((it) =>
        String(it.id) === String(id)
          ? { ...it, cantidad: currentQty - qty }
          : it,
      );
    });
  };

  const updateQuantity = (id, delta) => {
    const updated = cartItems
      .map((it) => {
        if (String(it.id) !== String(id)) return it;
        const next = (Number(it.cantidad) || 1) + delta;
        return next > 0 ? { ...it, cantidad: next } : null;
      })
      .filter(Boolean);
    saveCart(updated);
  };

  const clearCart = () => saveCart([]);

  const toggleCart = () => setIsCartOpen((s) => !s);

  const cartTotal = cartItems.reduce(
    (s, it) => s + Number(it.precio || 0) * (Number(it.cantidad) || 0),
    0,
  );
  const cartCount = cartItems.reduce(
    (s, it) => s + (Number(it.cantidad) || 0),
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export default useCart;
