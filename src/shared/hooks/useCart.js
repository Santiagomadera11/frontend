import { useState, useEffect } from 'react';
import { read, write, LS } from '../services/lsService';

export const useCart = () => {
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

  useEffect(() => {
    const handler = () => {
      try {
        const updated = read(LS.CART) || [];
        setCartItems(Array.isArray(updated) ? updated : []);
      } catch {
        try {
          const raw = localStorage.getItem(LS.CART);
          setCartItems(raw ? JSON.parse(raw) : []);
        } catch {
          setCartItems([]);
        }
      }
    };

    window.addEventListener(`${LS.CART}_updated`, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(`${LS.CART}_updated`, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const saveCart = (items) => {
    setCartItems(items);
    try {
      write(LS.CART, items);
    } catch {
      try {
        localStorage.setItem(LS.CART, JSON.stringify(items));
        try { window.dispatchEvent(new Event(`${LS.CART}_updated`)); } catch (e) {}
        try { window.dispatchEvent(new Event('storage')); } catch (e) {}
      } catch (e) {}
    }
  };

  const addToCart = (product) => {
    const id = product.id ?? product._id ?? String(product.nombre) + String(product.precio);
    const existing = cartItems.find((i) => String(i.id) === String(id));
    if (existing) {
      const updated = cartItems.map((it) =>
        String(it.id) === String(id) ? { ...it, cantidad: (Number(it.cantidad) || 1) + 1 } : it
      );
      saveCart(updated);
    } else {
      const item = {
        id,
        nombre: product.nombre || product.name || product.title || '',
        precio: Number(product.precio ?? product.price ?? 0),
        imagen: product.imagen || product.image || null,
        cantidad: 1,
      };
      saveCart([item, ...cartItems]);
    }
  };

  const removeFromCart = (id) => {
    const updated = cartItems.filter((it) => String(it.id) !== String(id));
    saveCart(updated);
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

  const cartTotal = cartItems.reduce((s, it) => s + (Number(it.precio || 0) * (Number(it.cantidad) || 0)), 0);
  const cartCount = cartItems.reduce((s, it) => s + (Number(it.cantidad) || 0), 0);

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
    isCartOpen,
    setIsCartOpen,
  };
};

export default useCart;
