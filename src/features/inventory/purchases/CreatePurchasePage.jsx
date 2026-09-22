import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Search, Plus, Trash2, Package, AlertCircle, Truck } from "lucide-react";
import { productService } from "../products/services/productService";
import { providerService } from "../providers/services/providerService";
import { purchaseService } from "./services/purchaseService";
import { ToastNotification } from "../../../shared/ui/ToastNotification";

const emptyForm = { proveedorId: "", fechaEntrega: "", notas: "", porcentajeIva: 19 };

const fmt = (v) => `$ ${Number(v || 0).toLocaleString("es-CO")}`;

export const CreatePurchasePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEmployeePath = location.pathname.startsWith("/employee");
  const { currentUser } = useCurrentUser();
  const user = currentUser || {};
  // useCurrentUser ya normaliza el rol a minúsculas ("empleado"/"administrador"), así que
  // comparar contra "Empleado" (con mayúscula) nunca daba true: por eso esta pantalla
  // salía siempre en verde sin importar quién la abriera.
  const isEmployeeRole = (user.rol || "").toLowerCase().trim() !== "administrador";

  const primary = isEmployeeRole ? "#2563eb" : "#059669";
  const primaryLight = isEmployeeRole ? "#eff6ff" : "#ecfdf5";

  const editingPurchase = location.state?.purchase || null;
  const isEditing = !!editingPurchase;

  const [formData, setFormData] = useState(emptyForm);
  const [products, setProducts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [productCost, setProductCost] = useState("");
  const [productQuantity, setProductQuantity] = useState(1);
  const [productLote, setProductLote] = useState("");
  const [productFechaVencimiento, setProductFechaVencimiento] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(isEditing);
  const [formErrorMsg, setFormErrorMsg] = useState("");
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prods, provs] = await Promise.all([
          productService.getAll(),
          providerService.getAll(),
        ]);
        setProducts(Array.isArray(prods) ? prods : []);
        setProviders(Array.isArray(provs) ? provs : []);
      } catch {
        setNotification({ message: "No se pudieron cargar productos/proveedores", type: "error" });
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    const loadDetails = async () => {
      setLoadingDetails(true);
      try {
        const full = await purchaseService.getById(editingPurchase.id);
        setFormData({
          proveedorId: full.proveedorId ? String(full.proveedorId) : "",
          fechaEntrega: full.fechaEntrega ? full.fechaEntrega.split("T")[0] : "",
          notas: full.notas || "",
          porcentajeIva: full.porcentajeIva ?? 19,
        });
        const detalles = full.detalles || full.items || full.productos || [];
        setPurchaseItems(detalles.map((d) => ({
          id: d.id || Date.now() + Math.random(),
          productoId: d.productoId,
          nombre: d.productoNombre || d.nombreProducto || d.nombre || "Producto",
          marca: d.marca || d.marcaNombre || "",
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario || d.costoUnitario || d.precio || 0,
          subtotal: d.subtotal || (d.cantidad * (d.precioUnitario || d.costoUnitario || d.precio || 0)),
          lote: d.lote || null,
          fechaVencimiento: d.fechaVencimiento || null,
        })));
      } catch {
        setFormErrorMsg("No se pudo cargar el detalle de la compra.");
      } finally {
        setLoadingDetails(false);
      }
    };
    loadDetails();
  }, [isEditing, editingPurchase?.id]);

  const filteredProducts = products.filter((p) =>
    p.nombre.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.marca || "").toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedProductData = products.find((p) => String(p.id) === String(selectedProduct));
  const requiereLote = selectedProductData?.tipoProducto === "Medicamento";

  const handleAddProduct = () => {
    setFormErrorMsg("");
    if (!selectedProduct) { setFormErrorMsg("Selecciona un producto."); return; }
    if (!productCost || Number(productCost) <= 0) { setFormErrorMsg("Ingresa un costo unitario válido mayor a 0."); return; }
    if (!productQuantity || Number(productQuantity) <= 0) { setFormErrorMsg("Ingresa una cantidad válida mayor a 0."); return; }

    const product = products.find((p) => String(p.id) === String(selectedProduct));
    if (!product) return;

    if (product.tipoProducto === "Medicamento") {
      if (!productLote || !productLote.trim()) { setFormErrorMsg("El lote es obligatorio para medicamentos."); return; }
      if (!productFechaVencimiento) { setFormErrorMsg("La fecha de vencimiento es obligatoria para medicamentos."); return; }
      if (new Date(productFechaVencimiento + "T00:00:00") <= new Date().setHours(0, 0, 0, 0)) {
        setFormErrorMsg("La fecha de vencimiento del medicamento debe ser una fecha futura."); return;
      }
    }

    const cantidad = Number(productQuantity);
    const precio = Number(productCost);
    setPurchaseItems((prev) => [...prev, {
      id: Date.now(),
      productoId: product.id,
      nombre: product.nombre,
      marca: product.marca || "",
      presentacion: product.presentacion || "",
      cantidad,
      precioUnitario: precio,
      subtotal: cantidad * precio,
      lote: productLote || null,
      fechaVencimiento: productFechaVencimiento || null,
    }]);
    setSelectedProduct("");
    setProductSearch("");
    setProductCost("");
    setProductQuantity(1);
    setProductLote("");
    setProductFechaVencimiento("");
    setFormErrorMsg("");
  };

  const handleRemoveItem = (id) => setPurchaseItems((prev) => prev.filter((i) => i.id !== id));

  const subtotal = purchaseItems.reduce((s, i) => s + i.subtotal, 0);
  const iva = subtotal * (Number(formData.porcentajeIva || 0) / 100);
  const total = subtotal + iva;

  const handleSubmit = async () => {
    setFormErrorMsg("");
    if (purchaseItems.length === 0) { setFormErrorMsg("Agrega al menos un producto a la compra."); return; }
    if (!formData.proveedorId) { setFormErrorMsg("Selecciona un proveedor."); return; }

    setLoading(true);
    try {
      const payload = {
        proveedorId: Number(formData.proveedorId),
        usuarioId: currentUser?.id || 1,
        porcentajeIva: Number(formData.porcentajeIva) || 0,
        notas: formData.notas || null,
        fechaEntrega: formData.fechaEntrega || null,
        detalles: purchaseItems.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          lote: i.lote || null,
          fechaVencimiento: i.fechaVencimiento || null,
        })),
      };

      let successMessage;
      if (isEditing) {
        payload.id = editingPurchase.id;
        payload.estadoId = editingPurchase.estadoId;
        await purchaseService.update(payload);
        successMessage = "Compra actualizada correctamente";
      } else {
        await purchaseService.create(payload);
        successMessage = "Compra registrada correctamente";
      }

      navigate(isEmployeePath ? "/employee/compras" : "/admin/compras", {
        state: { notification: { message: successMessage, type: "success" } },
      });
      return;
    } catch (err) {
      setFormErrorMsg(err?.response?.data?.message || "Error al guardar la compra");
    } finally {
      setLoading(false);
    }
  };

  if (loadingDetails) {
    return <div className="h-full flex items-center justify-center text-gray-400 text-sm">Cargando compra...</div>;
  }

  return (
    <div className="h-full flex flex-col font-sans bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100" style={{ color: primary }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xs font-black uppercase tracking-widest" style={{ color: primary }}>
              {isEditing ? "Editar Compra" : "Registrar Compra"}
            </h1>
            <p className="text-[9px] text-gray-400 font-bold uppercase">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <p className="text-[11px] font-black text-gray-900">{user.nombre}</p>
      </div>

      {formErrorMsg && (
        <div className="mx-3 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium flex items-center gap-2 flex-shrink-0">
          <AlertCircle size={14} /> {formErrorMsg}
        </div>
      )}

      <div className="flex-1 overflow-hidden flex p-3 gap-3">
        {/* Columna principal: buscar + tabla de items */}
        <div className="flex-1 min-w-0 h-full flex flex-col gap-3">
          {/* Buscar y agregar productos */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex-shrink-0">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Agregar Productos</h3>
            <div className="flex flex-col md:flex-row gap-2 items-end mb-2">
              <div className="flex-1 relative min-w-0">
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Producto</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o laboratorio..."
                    value={productSearch}
                    onChange={(e) => { setProductSearch(e.target.value); setSelectedProduct(""); setShowProductDropdown(true); }}
                    onFocus={() => setShowProductDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                    className="w-full pl-8 pr-2 text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none bg-white"
                  />
                </div>
                {showProductDropdown && productSearch && filteredProducts.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-56 overflow-y-auto">
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setSelectedProduct(String(p.id)); setProductSearch(p.nombre); setShowProductDropdown(false); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{p.nombre}</p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {p.presentacion || "Sin presentación"} · Stock: {p.stock ?? 0}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: primaryLight, color: primary }}>
                          {p.marca || "Genérico"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {showProductDropdown && productSearch && filteredProducts.length === 0 && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-30 px-3 py-4 text-center text-xs text-gray-400">
                    No se encontraron productos
                  </div>
                )}
              </div>
              <div className="w-full md:w-28">
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Costo Unit.</label>
                <input type="number" placeholder="0" value={productCost} onChange={(e) => setProductCost(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none" />
              </div>
              <div className="w-full md:w-20">
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Cantidad</label>
                <input type="number" placeholder="1" value={productQuantity} onChange={(e) => setProductQuantity(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2 items-end">
              <div className="w-full md:w-40">
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Lote{requiereLote ? " *" : ""}</label>
                <input type="text" placeholder="Lote" value={productLote} onChange={(e) => setProductLote(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none" />
              </div>
              <div className="w-full md:w-40">
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Fecha Venc.{requiereLote ? " *" : ""}</label>
                <input type="date" value={productFechaVencimiento} onChange={(e) => setProductFechaVencimiento(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none" />
              </div>
              <button onClick={handleAddProduct}
                className="w-full md:w-auto text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                style={{ background: primary }}>
                <Plus size={14} /> Agregar
              </button>
            </div>
          </div>

          {/* Tabla de items */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs table-fixed">
                <colgroup>
                  <col className="w-auto" />
                  <col className="w-20" />
                  <col className="w-12" />
                  <col className="w-16" />
                  <col className="w-28" />
                  <col className="w-20" />
                  <col className="w-8" />
                </colgroup>
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-2 text-left">Producto</th>
                    <th className="px-2 py-2 text-left">Lab</th>
                    <th className="px-2 py-2 text-center">Cant</th>
                    <th className="px-2 py-2 text-right">Costo</th>
                    <th className="px-2 py-2 text-center">Lote / Vence</th>
                    <th className="px-2 py-2 text-right">Subtotal</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchaseItems.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 italic">Aún no has agregado productos</td></tr>
                  ) : (
                    purchaseItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2 font-medium text-gray-800">
                          <span className="block truncate" title={item.nombre}>{item.nombre}</span>
                        </td>
                        <td className="px-2 py-2 text-gray-600">
                          {item.marca ? (
                            <span className="block truncate text-[10px] font-bold px-1.5 py-0.5 rounded text-center" style={{ background: primaryLight, color: primary }} title={item.marca}>{item.marca}</span>
                          ) : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-2 py-2 text-center text-gray-600">{item.cantidad}</td>
                        <td className="px-2 py-2 text-right text-gray-600">{fmt(item.precioUnitario)}</td>
                        <td className="px-2 py-2 text-center text-gray-600">
                          <span className="block truncate text-[10px]" title={`${item.lote || "Sin lote"} · ${item.fechaVencimiento || "Sin vencimiento"}`}>
                            {item.lote || "---"}{item.fechaVencimiento ? ` · ${item.fechaVencimiento}` : ""}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right font-bold text-gray-900">{fmt(item.subtotal)}</td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Columna lateral: proveedor + totales */}
        <div className="w-[300px] flex-shrink-0 h-full flex flex-col gap-3 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm flex-shrink-0">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><Truck size={12} /> Proveedor</h3>
            <div className="space-y-2">
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Proveedor *</label>
                <select value={formData.proveedorId} onChange={(e) => setFormData((p) => ({ ...p, proveedorId: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium outline-none">
                  <option value="">Seleccionar...</option>
                  {providers.map((prov) => <option key={prov.id} value={prov.id}>{prov.nombre}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Fecha Entrega</label>
                <input type="date" value={formData.fechaEntrega} onChange={(e) => setFormData((p) => ({ ...p, fechaEntrega: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none" />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">IVA %</label>
                <input type="number" value={formData.porcentajeIva} onChange={(e) => setFormData((p) => ({ ...p, porcentajeIva: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none" min="0" max="100" />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Notas</label>
                <textarea value={formData.notas} onChange={(e) => setFormData((p) => ({ ...p, notas: e.target.value }))}
                  placeholder="Notas adicionales..." rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none resize-none" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm flex-shrink-0 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span><span className="font-semibold text-gray-700">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>IVA ({formData.porcentajeIva || 0}%)</span><span className="font-semibold text-gray-700">{fmt(iva)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase">Total</span>
              <span className="text-xl font-black" style={{ color: primary }}>{fmt(total)}</span>
            </div>
            <button onClick={handleSubmit} disabled={loading || purchaseItems.length === 0}
              className="w-full mt-2 py-2.5 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: primary }}>
              {loading ? "Guardando..." : isEditing ? "Guardar Cambios" : "Finalizar Compra"}
            </button>
          </div>
        </div>
      </div>

      {notification && <ToastNotification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
    </div>
  );
};

export default CreatePurchasePage;
