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
  formaVentaId: i.formaVentaId ?? null,
  formaVentaTipo: i.formaVentaTipo || "Unidad",
  factorUnidades: Number(i.factorUnidades) || 1,
});

// Resuelve la forma de venta a usar al agregar un producto al carrito.
// Si el producto trae formaVentaId explícito (seleccionado en un modal con
// selector), se respeta tal cual. Si no, se busca "Unidad" (o la primera
// activa) dentro de product.formasVenta, para que páginas sin selector de
// forma de venta (grillas de catálogo) sigan agregando "Unidad" por defecto.
const resolveForma = (product) => {
  if (product.formaVentaId !== undefined && product.formaVentaId !== null) {
    return {
      formaVentaId: Number(product.formaVentaId),
      formaVentaTipo: product.formaVentaTipo || "Unidad",
      factorUnidades: Number(product.factorUnidades) || 1,
      precio: product.precio !== undefined ? Number(product.precio) : undefined,
    };
  }
  const formas = Array.isArray(product.formasVenta) ? product.formasVenta : [];
  const activas = formas.filter((f) => f.activo !== false);
  const unidad = activas.find((f) => f.tipo === "Unidad") || activas[0];
  if (unidad) {
    return {
      formaVentaId: unidad.id ?? null,
      formaVentaTipo: unidad.tipo || "Unidad",
      factorUnidades: Number(unidad.factorUnidades) || 1,
      precio: Number(unidad.precio),
    };
  }
  return { formaVentaId: null, formaVentaTipo: "Unidad", factorUnidades: 1, precio: undefined };
};

// Compara un ítem de carrito contra (id, formaVentaId). Cuando formaVentaId
// es undefined (no lo pasó el caller) sólo compara por id, para no romper
// a los llamadores que todavía no distinguen forma de venta.
const sameItem = (it, id, formaVentaId) =>
  String(it.id) === String(id) &&
  (formaVentaId === undefined ||
    String(it.formaVentaId ?? "") === String(formaVentaId ?? ""));

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
            await cartService.upsertItem(
              usuarioId,
              Number(it.id),
              Number(it.cantidad) || 1,
              it.formaVentaId ?? null,
            );
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
    const forma = resolveForma(product);
    const precio =
      forma.precio !== undefined ? forma.precio : Number(product.precio ?? product.price ?? 0);
    const usuarioId = userIdRef.current;

    if (usuarioId) {
      const existing = cartItems.find((i) => sameItem(i, id, forma.formaVentaId));
      const nextQty = (existing ? Number(existing.cantidad) || 0 : 0) + 1;
      try {
        const items = await cartService.upsertItem(
          usuarioId,
          Number(id),
          nextQty,
          forma.formaVentaId,
        );
        setCartItems(items.map(fromServerItem));
      } catch (e) {
        console.error("Error agregando al carrito:", e);
      }
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((i) => sameItem(i, id, forma.formaVentaId));
      const next = existing
        ? prev.map((it) =>
            sameItem(it, id, forma.formaVentaId)
              ? { ...it, cantidad: (Number(it.cantidad) || 1) + 1 }
              : it,
          )
        : [
            {
              id,
              nombre: product.nombre || product.name || product.title || "",
              precio,
              imagen: product.imagen || product.image || null,
              cantidad: 1,
              formaVentaId: forma.formaVentaId,
              formaVentaTipo: forma.formaVentaTipo,
              factorUnidades: forma.factorUnidades,
            },
            ...prev,
          ];
      write(LS.CART, next);
      return next;
    });
  };

  // formaVentaId es opcional: si se omite, sólo se matchea por id (compatibilidad
  // con llamadores que aún no distinguen forma de venta). Pasarlo explícitamente
  // (p. ej. desde CarritoPage) apunta a la línea exacta.
  const removeFromCart = async (id, qty = 1, formaVentaId) => {
    const usuarioId = userIdRef.current;
    const existing = cartItems.find((it) => sameItem(it, id, formaVentaId));
    if (!existing) return;
    const currentQty = Number(existing.cantidad) || 1;

    if (usuarioId) {
      try {
        const items =
          qty >= currentQty
            ? await cartService.removeItem(usuarioId, Number(id), existing.formaVentaId ?? null)
            : await cartService.upsertItem(
                usuarioId,
                Number(id),
                currentQty - qty,
                existing.formaVentaId ?? null,
              );
        setCartItems(items.map(fromServerItem));
      } catch (e) {
        console.error("Error quitando del carrito:", e);
      }
      return;
    }

    const next =
      qty >= currentQty
        ? cartItems.filter((it) => !sameItem(it, id, formaVentaId))
        : cartItems.map((it) =>
            sameItem(it, id, formaVentaId) ? { ...it, cantidad: currentQty - qty } : it,
          );
    setCartItems(next);
    write(LS.CART, next);
  };

  const updateQuantity = async (id, delta, formaVentaId) => {
    const existing = cartItems.find((it) => sameItem(it, id, formaVentaId));
    if (!existing) return;
    const nextQty = (Number(existing.cantidad) || 1) + delta;
    const usuarioId = userIdRef.current;

    if (usuarioId) {
      try {
        const items =
          nextQty > 0
            ? await cartService.upsertItem(
                usuarioId,
                Number(id),
                nextQty,
                existing.formaVentaId ?? null,
              )
            : await cartService.removeItem(usuarioId, Number(id), existing.formaVentaId ?? null);
        setCartItems(items.map(fromServerItem));
      } catch (e) {
        console.error("Error actualizando cantidad:", e);
      }
      return;
    }

    const next = cartItems
      .map((it) =>
        sameItem(it, id, formaVentaId) ? (nextQty > 0 ? { ...it, cantidad: nextQty } : null) : it,
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
