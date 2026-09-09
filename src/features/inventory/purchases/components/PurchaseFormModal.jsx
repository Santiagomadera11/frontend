import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect, useCallback } from "react";
import { X, Save, Plus, Trash2, CheckCircle } from "lucide-react";
import { apiClient } from "/src/shared/utils/apiClient";
import { purchaseService } from "../services/purchaseService";

const API_URL = "/api";
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${sessionStorage.getItem("syspharma_token")}` },
});

const PurchaseModal = ({ isOpen, onClose, initialData = null, mode = "create", onSave }) => {
  const { currentUser } = useCurrentUser();
  const isEmployee = currentUser.rol === "Empleado";
  const headerBg = isEmployee ? "bg-blue-50" : "bg-green-50";
  const headerBorder = isEmployee ? "border-blue-200" : "border-green-200";
  const btnBg = isEmployee ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700";
  const focusBorder = isEmployee ? "focus:border-blue-500" : "focus:border-emerald-500";
  const iconColor = isEmployee ? "text-blue-600" : "text-green-600";

  const emptyForm = {
    proveedorId: "", fechaEntrega: "", observaciones: "", notas: "", porcentajeIva: 19,
  };

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
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [formErrorMsg, setFormErrorMsg] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [prodsRes, provsRes] = await Promise.all([
        apiClient.get(`${API_URL}/Producto`, getAuthHeaders()),
        apiClient.get(`${API_URL}/Proveedor`, getAuthHeaders()),
      ]);
      setProducts(Array.isArray(prodsRes.data) ? prodsRes.data : []);
      setProviders(Array.isArray(provsRes.data) ? provsRes.data : []);
    } catch {
      console.warn("Error loading products and providers");
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen, loadData]);

  useEffect(() => {
    if (!isOpen) return;

    const loadPurchaseDetails = async () => {
      // Crear nueva compra — resetear todo
      if (!initialData || !initialData.id) {
        setFormData(emptyForm);
        setPurchaseItems([]);
        setSelectedProduct(""); setProductCost(""); setProductQuantity(1);
        return;
      }

      // BUG 1 FIX: SIEMPRE hacer getById en view/edit para traer detalles frescos del back
      if (mode === "view" || mode === "edit") {
        setLoadingDetails(true);
        try {
          const fullPurchase = await purchaseService.getById(initialData.id);

          setFormData({
            proveedorId: fullPurchase.proveedorId ? String(fullPurchase.proveedorId) : "",
            fechaEntrega: fullPurchase.fechaEntrega ? fullPurchase.fechaEntrega.split("T")[0] : "",
            observaciones: fullPurchase.observaciones || "",
            notas: fullPurchase.notas || "",
            porcentajeIva: fullPurchase.porcentajeIva ?? 19,
            id: fullPurchase.id,
            estadoId: fullPurchase.estadoId,
          });

          // BUG 2 FIX: mapear detalles correctamente con todos los posibles nombres de campo
          const detalles = fullPurchase.detalles || fullPurchase.items || fullPurchase.productos || [];
          setPurchaseItems(detalles.map(d => ({
            id: d.id || Date.now() + Math.random(),
            productoId: d.productoId,
            nombre: d.productoNombre || d.nombreProducto || d.nombre || "Producto",
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario || d.costoUnitario || d.precio || 0,
            subtotal: d.subtotal || (d.cantidad * (d.precioUnitario || d.costoUnitario || d.precio || 0)),
          })));
        } catch (err) {
          console.error("Error loading purchase details:", err);
          // Fallback: usar lo que vino en initialData si el getById falla
          setFormData({
            proveedorId: initialData.proveedorId ? String(initialData.proveedorId) : "",
            fechaEntrega: initialData.fechaEntrega ? initialData.fechaEntrega.split("T")[0] : "",
            observaciones: initialData.observaciones || "",
            notas: initialData.notas || "",
            porcentajeIva: initialData.porcentajeIva ?? 19,
            id: initialData.id,
            estadoId: initialData.estadoId,
          });
          setPurchaseItems([]);
        } finally {
          setLoadingDetails(false);
        }
      }

      setSelectedProduct(""); setProductCost(""); setProductQuantity(1);
    };

    loadPurchaseDetails();
  }, [initialData?.id, isOpen, mode]); // solo depende del ID, no del objeto entero

  if (!isOpen) return null;
  const isView = mode === "view";

  // Productos filtrados por búsqueda
  const filteredProducts = products.filter(p =>
    p.nombre.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleAddProduct = () => {
    setFormErrorMsg("");
    if (!selectedProduct) { setFormErrorMsg("Selecciona un producto."); return; }
    if (!productCost || Number(productCost) <= 0) { setFormErrorMsg("Ingresa un costo unitario válido mayor a 0."); return; }
    if (!productQuantity || Number(productQuantity) <= 0) { setFormErrorMsg("Ingresa una cantidad válida mayor a 0."); return; }

    const product = products.find(p => String(p.id) === String(selectedProduct));
    if (!product) return;

    if (product.tipoProducto === "Medicamento") {
      if (!productLote || !productLote.trim()) {
        setFormErrorMsg("El lote es obligatorio para medicamentos.");
        return;
      }
      if (!productFechaVencimiento) {
        setFormErrorMsg("La fecha de vencimiento es obligatoria para medicamentos.");
        return;
      }
      if (new Date(productFechaVencimiento + "T00:00:00") <= new Date().setHours(0, 0, 0, 0)) {
        setFormErrorMsg("La fecha de vencimiento del medicamento debe ser una fecha futura.");
        return;
      }
    }

    const cantidad = Number(productQuantity);
    const precio = Number(productCost);
    setPurchaseItems(prev => [...prev, {
      id: Date.now(),
      productoId: product.id,
      nombre: product.nombre,
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

  const handleRemoveItem = (id) => setPurchaseItems(prev => prev.filter(i => i.id !== id));

  const total = purchaseItems.reduce((s, i) => s + i.subtotal, 0);

  const handleSave = async () => {
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
        observaciones: formData.observaciones || null,
        fechaEntrega: formData.fechaEntrega || null,
        detalles: purchaseItems.map(i => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          lote: i.lote || null,
          fechaVencimiento: i.fechaVencimiento || null,
        })),
      };

      if (mode === "edit" && formData.id) {
        payload.id = formData.id;
        payload.estadoId = formData.estadoId;
      }

      if (onSave) await onSave(payload);
      setIsConfirmationOpen(true);
    } catch (err) {
      setFormErrorMsg(err?.response?.data?.message || "Error al guardar la compra");
    } finally {
      setLoading(false);
    }
  };

  // Nombre del proveedor para modo view
  const proveedorNombre =
    providers.find(p => String(p.id) === String(formData.proveedorId))?.nombre ||
    initialData?.proveedorNombre || "-";

  const proveedorDocumento =
    providers.find(p => String(p.id) === String(formData.proveedorId))?.documento ||
    initialData?.proveedorDocumento || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className={`${headerBg} px-4 py-3 border-b ${headerBorder} flex justify-between items-center flex-shrink-0`}>
          <h3 className="font-bold text-gray-900 text-lg">
            {isView ? "Ver Compra" : mode === "edit" ? "Editar Compra" : "Registrar Compra"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
        </div>

        {/* Loading overlay para detalles */}
        {loadingDetails && (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <span className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent"></span>
            Cargando detalles...
          </div>
        )}

        {/* Body */}
        {!loadingDetails && (
          <div className="p-4 flex-1">
            {formErrorMsg && (
              <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 font-medium">
                ⚠️ {formErrorMsg}
              </div>
            )}
            {isView ? (
              // Vista de detalle — BUG 2 FIX: usa proveedorNombre desde formData/providers, y purchaseItems para la tabla
              <div>
                <div className="grid grid-cols-3 gap-6 mb-6 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-1">PROVEEDOR</p>
                    <p className="font-bold text-gray-900">{proveedorNombre}</p>
                    {proveedorDocumento && <p className="text-[11px] text-gray-500 font-semibold mt-0.5">NIT/C.C.: {proveedorDocumento}</p>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-1">NÚMERO</p>
                    <p className="font-bold text-gray-900">{initialData?.numeroCompra || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-1">FECHA</p>
                    <p className="font-bold text-gray-900">
                      {initialData?.fechaCompra ? new Date(initialData.fechaCompra).toLocaleDateString("es-CO") : "-"}
                    </p>
                  </div>
                </div>

                <table className="w-full text-sm mb-6">
                  <thead className="border-b border-gray-300">
                    <tr>
                      <th className="text-left px-2 py-2 text-xs font-bold text-gray-700">Producto</th>
                      <th className="text-center px-2 py-2 text-xs font-bold text-gray-700">Cant</th>
                      <th className="text-right px-2 py-2 text-xs font-bold text-gray-700">Costo Unit.</th>
                      <th className="text-right px-2 py-2 text-xs font-bold text-gray-700">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-2 py-6 text-center text-xs text-gray-400 italic">
                          Sin productos registrados
                        </td>
                      </tr>
                    ) : (
                      purchaseItems.map(item => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-2 py-3 text-gray-800">{item.nombre}</td>
                          <td className="px-2 py-3 text-center text-gray-700">{item.cantidad}</td>
                          <td className="px-2 py-3 text-right text-gray-700">${Number(item.precioUnitario || 0).toLocaleString()}</td>
                          <td className="px-2 py-3 text-right font-bold text-gray-900">${Number(item.subtotal || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div className="flex justify-end">
                  <div className={`${headerBg} border-2 ${headerBorder} rounded-lg px-8 py-4`}>
                    <p className="text-xs text-gray-600 font-bold mb-1 uppercase">Total</p>
                    <p className={`text-3xl font-bold ${iconColor}`}>${total.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              // Formulario crear/editar
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Proveedor *</label>
                    <select
                      className={`w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none ${focusBorder} bg-white`}
                      value={formData.proveedorId}
                      onChange={e => setFormData(p => ({ ...p, proveedorId: e.target.value }))}>
                      <option value="">Seleccionar...</option>
                      {providers.map(prov => <option key={prov.id} value={prov.id}>{prov.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Entrega</label>
                    <input type="date"
                      className={`w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none ${focusBorder}`}
                      value={formData.fechaEntrega}
                      onChange={e => setFormData(p => ({ ...p, fechaEntrega: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">IVA (%)</label>
                    <input type="number"
                      className={`w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none ${focusBorder}`}
                      value={formData.porcentajeIva}
                      onChange={e => setFormData(p => ({ ...p, porcentajeIva: e.target.value }))} />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Notas</label>
                    <input type="text"
                      className={`w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none ${focusBorder}`}
                      placeholder="Notas adicionales..."
                      value={formData.notas}
                      onChange={e => setFormData(p => ({ ...p, notas: e.target.value }))} />
                  </div>
                </div>

                {/* Agregar items */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 border-b border-gray-200 pb-1">Agregar Productos</h4>
                  <div className="flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex-1 relative">
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">Producto</label>
                      <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setSelectedProduct("");
                          setShowProductDropdown(true);
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                        className={`w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none ${focusBorder} bg-white`}
                      />
                      {/* Dropdown de resultados */}
                      {showProductDropdown && productSearch && filteredProducts.length > 0 && (
                        <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                          {filteredProducts.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedProduct(String(p.id));
                                setProductSearch(p.nombre);
                                setShowProductDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                            >
                              {p.nombre}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Sin resultados */}
                      {showProductDropdown && productSearch && filteredProducts.length === 0 && (
                        <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 px-3 py-4 text-center text-xs text-gray-400">
                          No se encontraron productos
                        </div>
                      )}
                    </div>
                    <div className="w-32">
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">Costo Unit.</label>
                      <input type="number" placeholder="0" value={productCost} onChange={e => setProductCost(e.target.value)}
                        className={`w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none ${focusBorder}`} />
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">Cantidad</label>
                      <input type="number" placeholder="1" value={productQuantity} onChange={e => setProductQuantity(e.target.value)}
                        className={`w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none ${focusBorder}`} />
                    </div>
                    <div className="w-28">
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">Lote</label>
                      <input type="text" placeholder="Lote" value={productLote} onChange={e => setProductLote(e.target.value)}
                        className={`w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none ${focusBorder}`} />
                    </div>
                    <div className="w-32">
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">Fecha Venc.</label>
                      <input type="date" value={productFechaVencimiento} onChange={e => setProductFechaVencimiento(e.target.value)}
                        className={`w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none ${focusBorder}`} />
                    </div>
                    <button onClick={handleAddProduct}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 shadow-sm">
                      <Plus size={14} /> Agregar
                    </button>
                  </div>
                </div>

                {/* Tabla items */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-bold">
                      <tr>
                        <th className="px-4 py-2 text-left">Producto</th>
                        <th className="px-4 py-2 text-center">Cant</th>
                        <th className="px-4 py-2 text-right">Costo Unit.</th>
                        <th className="px-4 py-2 text-center">Lote</th>
                        <th className="px-4 py-2 text-center">Vencimiento</th>
                        <th className="px-4 py-2 text-right">Subtotal</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {purchaseItems.length === 0 ? (
                        <tr><td colSpan={7} className="px-4 py-6 text-center text-xs text-gray-400 italic">No hay productos agregados</td></tr>
                      ) : (
                        purchaseItems.map(item => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 text-xs font-medium text-gray-700">{item.nombre}</td>
                            <td className="px-4 py-2 text-center text-xs text-gray-600">{item.cantidad}</td>
                            <td className="px-4 py-2 text-right text-xs text-gray-600">${Number(item.precioUnitario).toLocaleString()}</td>
                            <td className="px-4 py-2 text-center text-xs text-gray-600">{item.lote || "---"}</td>
                            <td className="px-4 py-2 text-center text-xs text-gray-600">{item.fechaVencimiento || "---"}</td>
                            <td className="px-4 py-2 text-right text-xs font-bold text-gray-800">${Number(item.subtotal).toLocaleString()}</td>
                            <td className="px-4 py-2 text-center">
                              <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total:</td>
                        <td className={`px-4 py-3 text-right text-sm font-bold ${iconColor}`}>${total.toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className={`${headerBg} border-t ${headerBorder} p-4 flex-shrink-0 flex gap-3`}>
          {isView ? (
            <button onClick={onClose} className={`w-full px-4 py-2 text-sm font-bold text-white ${btnBg} rounded flex items-center justify-center gap-2 shadow-sm`}>
              Cerrar
            </button>
          ) : (
            <button onClick={handleSave} disabled={loading || purchaseItems.length === 0}
              className={`w-full px-4 py-2 text-sm font-bold text-white ${btnBg} disabled:bg-gray-400 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2 shadow-sm`}>
              <Save size={16} /> {loading ? "Guardando..." : mode === "edit" ? "Guardar" : "Finalizar Compra"}
            </button>
          )}
        </div>
      </div>

      {/* Modal confirmación */}
      {isConfirmationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden">
            <div className={`${headerBg} px-6 py-4 border-b ${headerBorder} flex justify-between items-center`}>
              <h3 className="font-bold text-gray-900 text-lg">Compra Guardada</h3>
              <button onClick={() => { setIsConfirmationOpen(false); onClose(); }} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="p-6 flex flex-col items-center text-center">
              <CheckCircle size={48} className={`${iconColor} mb-4`} />
              <p className="text-gray-700 font-medium text-sm mb-2">✅ Compra guardada con éxito</p>
              <p className="text-gray-500 text-xs">El stock se actualizará automáticamente al marcar la compra como recibida.</p>
            </div>
            <div className={`${headerBg} border-t ${headerBorder} p-4`}>
              <button onClick={() => { setIsConfirmationOpen(false); onClose(); }}
                className={`w-full px-4 py-2 text-sm font-bold text-white ${btnBg} rounded shadow-sm`}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseModal;