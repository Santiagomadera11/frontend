import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { LS, read, write } from "../services/lsService";
import { cartService } from "../services/cartService";

const CartContext = createContext(null);

// El carrito de un usuario logueado vive en el backend (api/Carrito). Un
// invitado (landing sin sesión) no tiene identidad contra la que persistir,
// así que su carrito sigue viviendo en localStorage hasta que inicia sesión.
const getSessionUserId = () => {
  try {
    const raw = sessionStorage.getItem("syspharma_user");
    const user = raw ? JSON.parse(raw) : null;
    return user?.id || null;
  } catch {
    return null;
  }
};

const fromServerItem = (i) => ({
  id: i.productoId,
  nombre: i.nombre,
  precio: i.precio,
  imagen: i.imagen,
  cantidad: i.cantidad,
  stock: i.stock,
});

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    if (getSessionUserId()) return [];
    try {
      return read(LS.CART) || [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const userIdRef = useRef(getSessionUserId());

  useEffect(() => {
    const usuarioId = userIdRef.current;
    if (usuarioId) {
      cartService
        .getMine(usuarioId)
        .then((items) => setCartItems(items.map(fromServerItem)))
        .catch((e) => console.error("Error cargando carrito:", e));
    }
  }, []);

  useEffect(() => {
    const handleAuthChange = async () => {
      const usuarioId = getSessionUserId();
      const wasGuest = !userIdRef.current;
      userIdRef.current = usuarioId;

      if (!usuarioId) {
        setCartItems(read(LS.CART) || []);
        return;
      }

      // Al iniciar sesión, fusiona lo que el invitado tenía en localStorage.
      if (wasGuest) {
        const localItems = read(LS.CART) || [];
        for (const it of localItems) {
          try {
            await cartService.upsertItem(usuarioId, Number(it.id), Number(it.cantidad) || 1);
          } catch (e) {
            console.error("Error fusionando carrito local:", e);
          }
        }
        if (localItems.length) write(LS.CART, []);
      }

      try {
        const items = await cartService.getMine(usuarioId);
        setCartItems(items.map(fromServerItem));
      } catch (e) {
        console.error("Error cargando carrito:", e);
      }
    };

    const handleLocalCartChange = () => {
      if (!userIdRef.current) setCartItems(read(LS.CART) || []);
    };

    window.addEventListener("syspharma_auth_changed", handleAuthChange);
    window.addEventListener(`${LS.CART}_updated`, handleLocalCartChange);
    window.addEventListener("storage", handleLocalCartChange);
    return () => {
      window.removeEventListener("syspharma_auth_changed", handleAuthChange);
      window.removeEventListener(`${LS.CART}_updated`, handleLocalCartChange);
      window.removeEventListener("storage", handleLocalCartChange);
    };
  }, []);

  const addToCart = async (product) => {
    const id = product.id ?? product._id;
    const usuarioId = userIdRef.current;

    if (usuarioId) {
      const existing = cartItems.find((i) => String(i.id) === String(id));
      const nextQty = (existing ? Number(existing.cantidad) || 0 : 0) + 1;
      try {
        const items = await cartService.upsertItem(usuarioId, Number(id), nextQty);
        setCartItems(items.map(fromServerItem));
      } catch (e) {
        console.error("Error agregando al carrito:", e);
      }
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((i) => String(i.id) === String(id));
      const next = existing
        ? prev.map((it) =>
            String(it.id) === String(id)
              ? { ...it, cantidad: (Number(it.cantidad) || 1) + 1 }
              : it,
          )
        : [
            {
              id,
              nombre: product.nombre || product.name || product.title || "",
              precio: Number(product.precio ?? product.price ?? 0),
              imagen: product.imagen || product.image || null,
              cantidad: 1,
            },
            ...prev,
          ];
      write(LS.CART, next);
      return next;
    });
  };

  const removeFromCart = async (id, qty = 1) => {
    const usuarioId = userIdRef.current;
    const existing = cartItems.find((it) => String(it.id) === String(id));
    if (!existing) return;
    const currentQty = Number(existing.cantidad) || 1;

    if (usuarioId) {
      try {
        const items =
          qty >= currentQty
            ? await cartService.removeItem(usuarioId, Number(id))
            : await cartService.upsertItem(usuarioId, Number(id), currentQty - qty);
        setCartItems(items.map(fromServerItem));
      } catch (e) {
        console.error("Error quitando del carrito:", e);
      }
      return;
    }

    const next =
      qty >= currentQty
        ? cartItems.filter((it) => String(it.id) !== String(id))
        : cartItems.map((it) =>
            String(it.id) === String(id) ? { ...it, cantidad: currentQty - qty } : it,
          );
    setCartItems(next);
    write(LS.CART, next);
  };

  const updateQuantity = async (id, delta) => {
    const existing = cartItems.find((it) => String(it.id) === String(id));
    if (!existing) return;
    const nextQty = (Number(existing.cantidad) || 1) + delta;
    const usuarioId = userIdRef.current;

    if (usuarioId) {
      try {
        const items =
          nextQty > 0
            ? await cartService.upsertItem(usuarioId, Number(id), nextQty)
            : await cartService.removeItem(usuarioId, Number(id));
        setCartItems(items.map(fromServerItem));
      } catch (e) {
        console.error("Error actualizando cantidad:", e);
      }
      return;
    }

    const next = cartItems
      .map((it) =>
        String(it.id) === String(id) ? (nextQty > 0 ? { ...it, cantidad: nextQty } : null) : it,
      )
      .filter(Boolean);
    setCartItems(next);
    write(LS.CART, next);
  };

  const clearCart = async () => {
    const usuarioId = userIdRef.current;
    if (usuarioId) {
      try {
        await cartService.clear(usuarioId);
      } catch (e) {
        console.error("Error vaciando el carrito:", e);
      }
    } else {
      write(LS.CART, []);
    }
    setCartItems([]);
  };

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
