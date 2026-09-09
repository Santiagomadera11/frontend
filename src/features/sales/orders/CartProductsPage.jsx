import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Package, Trash2 } from "lucide-react";
import { productService } from "../../inventory/products/services/productService";
import { read, write, LS } from '../../../shared/services/lsService';

export const CartProductsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState([]);
  const [stockError, setStockError] = useState(null);

  const getReturnPath = () => {
    if (location.pathname.includes("/employee/")) {
      return "/employee/ventas/nueva";
    } else {
      return "/admin/ventas/nueva";
    }
  };

  // Sincronizar stock del carrito con inventario (async)
  const syncCartStock = useCallback(async (cartItems) => {
    let hasAdjustments = false;
    const syncedCart = await Promise.all(
      cartItems.map(async (cartItem) => {
        try {
          const currentProduct = await productService.getById(cartItem.id);
          if (currentProduct) {
            if (currentProduct.stock < cartItem.cantidad) {
              hasAdjustments = true;
              setStockError(
                `Stock insuficiente para ${cartItem.nombre}. Cantidad ajustada de ${cartItem.cantidad} a ${currentProduct.stock}.`
              );
            }
            const adjustedQuantity = Math.min(cartItem.cantidad, currentProduct.stock);
            return { ...cartItem, stock: currentProduct.stock, cantidad: adjustedQuantity };
          }
        } catch {
          // Si falla la llamada, devolver el item sin cambios
        }
        return cartItem;
      })
    );

    if (!hasAdjustments) {
      setTimeout(() => setStockError(null), 5000);
    }

    return syncedCart;
  }, []);

  useEffect(() => {
    const savedCart = read(LS.CART) || [];
    if (Array.isArray(savedCart) && savedCart.length > 0) {
      syncCartStock(savedCart).then((synced) => setCart(synced));
    }

    // Refrescar stock cada 5 segundos
    const interval = setInterval(() => {
      setCart((currentCart) => {
        if (currentCart.length === 0) return currentCart;
        syncCartStock(currentCart).then((synced) => {
          write(LS.CART, synced);
          setCart(synced);
        });
        return currentCart;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [syncCartStock]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleChangeQuantity = async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    try {
      const product = await productService.getById(productId);
      if (!product) {
        setStockError(`Producto no encontrado`);
        return;
      }
      if (newQuantity > product.stock) {
        setStockError(
          `Stock insuficiente. Solo hay ${product.stock} unidades disponibles de ${product.nombre}`
        );
        return;
      }
      setStockError(null);
      const updatedCart = cart.map((item) =>
        item.id === productId ? { ...item, cantidad: newQuantity } : item
      );
      setCart(updatedCart);
      write(LS.CART, updatedCart);
    } catch {
      setStockError("Error al verificar stock");
    }
  };

  const handleRemoveFromCart = (productId) => {
    const updatedCart = cart.filter((item) => item.id !== productId);
    setCart(updatedCart);
    write(LS.CART, updatedCart);
  };

  const total = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  return (
    <div className="h-full flex flex-col p-4 font-sans text-gray-800 bg-white md:bg-transparent">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(getReturnPath())}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold">Productos en el Carrito</h1>
            <p className="text-xs text-gray-500">Productos agregados para la venta/pedido</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        {stockError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700">{stockError}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setStockError(null)}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-400 hover:bg-red-100"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No hay productos en el carrito</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={index} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Package size={18} className="text-blue-500" />
                        <h3 className="font-semibold text-gray-900 text-sm">{item.nombre}</h3>
                      </div>
                      <p className="text-xs text-gray-600">{formatCurrency(item.precio)} c/u</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleChangeQuantity(item.id, item.cantidad - 1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                        >
                          <span className="text-lg font-medium">-</span>
                        </button>
                        <div className="w-12 h-8 rounded-lg border border-gray-300 bg-white flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-900">{item.cantidad}</span>
                        </div>
                        <button
                          onClick={() => handleChangeQuantity(item.id, item.cantidad + 1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                        >
                          <span className="text-lg font-medium">+</span>
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Subtotal:</span>
                      <span className="text-sm font-bold text-blue-600">
                        {formatCurrency(item.precio * item.cantidad)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex justify-end items-center flex-shrink-0">
            <div className="text-right">
              <p className="text-sm text-gray-600">Total del carrito:</p>
              <p className="text-base font-bold text-emerald-600">{formatCurrency(total)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartProductsPage;