import React, { useState, useEffect } from "react";
import { X, ShoppingCart } from "lucide-react";
import { ordersService } from "../../features/sales/orders/services/ordersService";

const QuickPurchaseModal = ({ product, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    documento: "",
    direccion: "",
    telefono: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Cargar datos del usuario si existe sesión
  useEffect(() => {
    try {
      const userStr = sessionStorage.getItem("syspharma_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setFormData({
          nombre: user.nombre || "",
          documento: user.documento || "",
          direccion: user.direccion || "",
          telefono: user.telefono || "",
        });
      }
    } catch (error) {
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= (product.stock || 999)) {
      setQuantity(newQuantity);
    }
  };

  const handleFinalizeOrder = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombre.trim()) {
      setMessage("El nombre es requerido");
      return;
    }
    if (!formData.documento.trim()) {
      setMessage("El documento es requerido");
      return;
    }
    if (!formData.direccion.trim()) {
      setMessage("La dirección es requerida");
      return;
    }
    if (!formData.telefono.trim()) {
      setMessage("El teléfono es requerido");
      return;
    }
    if (quantity < 1) {
      setMessage("La cantidad debe ser mayor a 0");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Obtener usuario actual si existe
      const userStr = sessionStorage.getItem("syspharma_user");
      const user = userStr ? JSON.parse(userStr) : null;

      // Calcular total
      const precio = Number(product.precio || 0);
      const total = precio * quantity;

      // Crear estructura del producto para el pedido
      const productForOrder = {
        id: product.id,
        nombre: product.nombre || product.name,
        precio: precio,
        categoria: product.categoria,
        tipoProducto: product.tipoProducto,
        cantidad: quantity,
        subtotal: total,
        imagen: product.imagen,
      };

      // Crear datos del pedido
      const orderData = {
        cliente: formData.nombre,
        documento: formData.documento,
        direccion: formData.direccion,
        telefono: formData.telefono,
        productos: [productForOrder],
        cantidadProductos: quantity,
        total: total,
        userId: user?.id || null,
        userName: user?.nombre || formData.nombre,
        origin: user?.rol === "Empleado" ? "empleado" : "web",
        estado: user ? "Pendiente" : "Pendientes de Validación",
        creadoPor: user?.nombre || "Visitante",
        notas: "",
      };

      // Crear el pedido
      const createdOrder = ordersService.create(orderData);

      // Mostrar mensaje de éxito
      setMessage(`✓ Pedido ${createdOrder.id} creado exitosamente`);

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          onClose();
        }
      }, 2000);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      console.error("Error al crear pedido:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  const precio = Number(product.precio || 0);
  const total = precio * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-50">
          <h2 className="text-lg font-bold text-gray-900">Comprar Ahora</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-white/50 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleFinalizeOrder} className="p-6 space-y-6">
          {/* Resumen del Producto */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex gap-4">
              {product.imagen && (
                <img
                  src={product.imagen}
                  alt={product.nombre}
                  className="w-20 h-20 object-contain rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {product.nombre}
                </h3>
                {product.marca && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    Marca: {product.marca}
                  </p>
                )}
                {product.concentracion && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    Concentración: {product.concentracion}
                  </p>
                )}
                {product.presentacion && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    Presentación: {product.presentacion}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-0.5">
                  {product.categoria && `Categoría: ${product.categoria}`}
                </p>
                <p className="text-lg font-bold text-blue-600 mt-2">
                  ${precio.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Cantidad
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(Number(e.target.value))}
                min="1"
                max={product.stock || 999}
                className="w-16 text-center border border-gray-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= (product.stock || 999)}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                +
              </button>
              <span className="text-sm text-gray-500 ml-auto">
                Stock disponible: {product.stock || "∞"}
              </span>
            </div>
          </div>

          {/* Datos de Envío */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-4">Datos de Envío</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Documento (CC/NIT)
                </label>
                <input
                  type="text"
                  name="documento"
                  value={formData.documento}
                  onChange={handleChange}
                  placeholder="Ej: 123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Ej: Calle 123 #45-67, Apt 8B"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Ej: 3001234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Resumen de Compra */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Subtotal ({quantity} x ${precio.toLocaleString()})
                </span>
                <span className="font-semibold text-gray-900">
                  ${total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Impuestos</span>
                <span>Incluido</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-bold text-gray-900">Total a pagar</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Mensaje de Estado */}
          {message && (
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                message.startsWith("✓")
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-red-100 text-red-700 border border-red-300"
              }`}
            >
              {message}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingCart size={18} />
              {loading ? "Procesando..." : "Finalizar Pedido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickPurchaseModal;
