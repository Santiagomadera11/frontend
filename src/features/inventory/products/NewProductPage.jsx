import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, DollarSign, Package, X, CheckCircle, AlertCircle, Barcode, Loader2 } from "lucide-react";
import { productService } from "./services/productService";
import { categoryService } from "../categories/services/categoryService";
import { providerService } from "../providers/services/providerService";
import { brandService } from "../brands/services/brandService";
import { presentationService } from "../presentations/services/presentationService";
import { uploadService } from "../../../shared/services/uploadService";

const NewProductPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [brands, setBrands] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "", // <-- AGREGADO
    codigoBarras: "",
    marcaId: "",
    tipoProducto: "Producto General",
    categoriaId: "",
    proveedorId: "",
    precio: "",
    porcentajeIva: 0,
    stock: 0,
    estado: true,
    composicion: "",
    concentracion: "",
    presentacionId: "",
    viaAdministracion: "",
    registroSanitario: "",
    requiereFormula: false,
    imagen: null,
    formasVenta: {
      blister: { habilitado: false, precio: "", factorUnidades: "", precioAuto: true },
      caja: { habilitado: false, precio: "", factorUnidades: "", blisteresPorCaja: "", precioAuto: true },
    },
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState({
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
  });
  const fileRef = React.createRef();

  useEffect(() => {
    const loadData = async () => {
      const cats = await categoryService.getAll();
      const provs = await providerService.getAll();
      const brds = await brandService.getAll();
      const press = await presentationService.getAll();
      setCategories(cats);
      setProviders(provs);
      setBrands(brds);
      setPresentations(press);
    };
    loadData();

    const product = location.state?.product;
    if (product) {
      try {
        setIsEditing(true);
        setEditingProductId(product.id);
        setFormData({
          nombre: product.nombre || "",
          descripcion: product.descripcion || "", // <-- AGREGADO
          codigoBarras: product.codigoBarras || "",
          marcaId: product.marcaId ? String(product.marcaId) : "",
          presentacionId: product.presentacionId ? String(product.presentacionId) : "",
          tipoProducto: product.tipoProducto || "Producto General",
          categoriaId: product.categoriaId || "",
          proveedorId: product.proveedorId || "",
          precio: product.precio || "",
          porcentajeIva: product.porcentajeIva ?? 0,
          stock: product.stock ?? 0,
          estado: product.estado !== undefined ? product.estado : true,
          composicion: product.composicion || "",
          concentracion: product.concentracion || "",
          presentacion: product.presentacion || "",
          viaAdministracion: product.viaAdministracion || "",
          registroSanitario: product.registroSanitario || "",
          requiereFormula: product.requiereFormula || false,
          imagen: product.imagen || null,
          formasVenta: (() => {
            const formas = Array.isArray(product.formasVenta) ? product.formasVenta : [];
            const blister = formas.find((f) => f.tipo === "Blister" && f.activo !== false);
            const caja = formas.find((f) => f.tipo === "Caja" && f.activo !== false);
            return {
              blister: blister
                ? { habilitado: true, precio: blister.precio ?? "", factorUnidades: blister.factorUnidades ?? "", precioAuto: false }
                : { habilitado: false, precio: "", factorUnidades: "", precioAuto: true },
              caja: caja
                ? { habilitado: true, precio: caja.precio ?? "", factorUnidades: caja.factorUnidades ?? "", blisteresPorCaja: "", precioAuto: false }
                : { habilitado: false, precio: "", factorUnidades: "", blisteresPorCaja: "", precioAuto: true },
            };
          })(),
        });
        if (product.imagen) setImagePreview(product.imagen);
      } catch (error) {
        console.error("Error reading editing product:", error);
      }
    }

    const onChange = async () => {
      const cats = await categoryService.getAll();
      const provs = await providerService.getAll();
      const brds = await brandService.getAll();
      const press = await presentationService.getAll();
      setCategories(cats);
      setProviders(provs);
      setBrands(brds);
      setPresentations(press);
    };

    window.addEventListener("categories:changed", onChange);
    window.addEventListener("providers:changed", onChange);
    window.addEventListener("brands:changed", onChange);
    window.addEventListener("presentations:changed", onChange);
    return () => {
      window.removeEventListener("categories:changed", onChange);
      window.removeEventListener("providers:changed", onChange);
      window.removeEventListener("brands:changed", onChange);
      window.removeEventListener("presentations:changed", onChange);
    };
    // Solo lee el estado de navegación inicial al montar; no debe re-ejecutar si location cambia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showError("Imagen Demasiado Grande", "La imagen es demasiado grande. El tamaño máximo permitido es 5MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadService.uploadImage(file, "productos");
      setImagePreview(url);
      setFormData((f) => ({ ...f, imagen: url }));
    } catch (err) {
      showError("Error al subir la imagen", err.response?.data?.message || "No se pudo subir la imagen. Intenta nuevamente.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Auto-calcula el precio del blister/caja a partir del precio de la unidad,
  // y las unidades de la caja a partir de los blisteres que trae (si se indican).
  // No pisa un precio que el usuario haya editado a mano (precioAuto: false).
  useEffect(() => {
    const precioUnidad = Number(formData.precio);
    if (!precioUnidad || precioUnidad <= 0) return;

    setFormData((f) => {
      let changed = false;
      const blister = { ...f.formasVenta.blister };
      const caja = { ...f.formasVenta.caja };

      if (blister.habilitado && blister.precioAuto) {
        const factor = Number(blister.factorUnidades);
        if (factor > 0) {
          const nuevoPrecio = Math.round(precioUnidad * factor * 100) / 100;
          if (Number(blister.precio) !== nuevoPrecio) {
            blister.precio = nuevoPrecio;
            changed = true;
          }
        }
      }

      if (caja.habilitado) {
        if (blister.habilitado && caja.blisteresPorCaja) {
          const blisteresPorCaja = Number(caja.blisteresPorCaja);
          const factorBlister = Number(blister.factorUnidades);
          if (blisteresPorCaja > 0 && factorBlister > 0) {
            const unidadesCaja = blisteresPorCaja * factorBlister;
            if (Number(caja.factorUnidades) !== unidadesCaja) {
              caja.factorUnidades = unidadesCaja;
              changed = true;
            }
          }
        }
        if (caja.precioAuto) {
          const factorCaja = Number(caja.factorUnidades);
          if (factorCaja > 0) {
            const nuevoPrecioCaja = Math.round(precioUnidad * factorCaja * 100) / 100;
            if (Number(caja.precio) !== nuevoPrecioCaja) {
              caja.precio = nuevoPrecioCaja;
              changed = true;
            }
          }
        }
      }

      return changed ? { ...f, formasVenta: { blister, caja } } : f;
    });
  }, [
    formData.precio,
    formData.formasVenta.blister.habilitado,
    formData.formasVenta.blister.factorUnidades,
    formData.formasVenta.blister.precioAuto,
    formData.formasVenta.caja.habilitado,
    formData.formasVenta.caja.blisteresPorCaja,
    formData.formasVenta.caja.precioAuto,
  ]);

  const showError = (title, message) => {
    setConfirmData({ type: "error", title, message, onConfirm: () => setShowConfirmModal(false) });
    setShowConfirmModal(true);
  };

  const handleSave = async () => {
    if (uploadingImage) return showError("Espera un momento", "La imagen todavía se está subiendo.");
    if (!formData.nombre.trim()) return showError("Campo Requerido", "Por favor ingresa el nombre del producto");
    if (!formData.categoriaId) return showError("Campo Requerido", "Por favor selecciona una categoría");
    if (!formData.precio || Number(formData.precio) <= 0) return showError("Precio Inválido", "Por favor ingresa un precio válido mayor a 0");
    if (formData.stock !== undefined && Number(formData.stock) < 0) return showError("Stock Inválido", "El stock no puede ser negativo");

    const { blister, caja } = formData.formasVenta;
    if (blister.habilitado) {
      if (!blister.precio || Number(blister.precio) <= 0)
        return showError("Precio Inválido", "Ingresa un precio válido mayor a 0 para la venta por Blister");
      if (!Number.isInteger(Number(blister.factorUnidades)) || Number(blister.factorUnidades) < 1)
        return showError("Unidades Inválidas", "Ingresa un número entero de unidades por blister (mínimo 1)");
    }
    if (caja.habilitado) {
      if (!caja.precio || Number(caja.precio) <= 0)
        return showError("Precio Inválido", "Ingresa un precio válido mayor a 0 para la venta por Caja");
      if (!Number.isInteger(Number(caja.factorUnidades)) || Number(caja.factorUnidades) < 1)
        return showError("Unidades Inválidas", "Ingresa un número entero de unidades por caja (mínimo 1)");
    }

    const payload = {
      nombre: formData.nombre.trim(),
      tipoProducto: formData.tipoProducto,
      marcaId: formData.marcaId ? Number(formData.marcaId) : null,
      presentacionId: formData.presentacionId ? Number(formData.presentacionId) : null,
      categoriaId: Number(formData.categoriaId),
      proveedorId: formData.proveedorId ? Number(formData.proveedorId) : null,
      precio: Number(formData.precio),
      porcentajeIva: Number(formData.porcentajeIva) || 0,
      precioCompra: null,
      stock: Number(formData.stock) || 0,
      imagen: formData.imagen || null,
      descripcion: formData.descripcion ? formData.descripcion.trim() : null, // <-- MODIFICADO (Antes null)
      sku: null,
      codigoBarras: formData.codigoBarras ? formData.codigoBarras.trim() : null,
      
      // Detalles del medicamento
      composicion: formData.composicion,
      concentracion: formData.concentracion,
      viaAdministracion: formData.viaAdministracion,
      registroSanitario: formData.registroSanitario,
      requiereFormula: formData.requiereFormula,

      formasVenta: [
        ...(formData.formasVenta.blister.habilitado
          ? [{ tipo: "Blister", precio: Number(formData.formasVenta.blister.precio), factorUnidades: Number(formData.formasVenta.blister.factorUnidades) }]
          : []),
        ...(formData.formasVenta.caja.habilitado
          ? [{ tipo: "Caja", precio: Number(formData.formasVenta.caja.precio), factorUnidades: Number(formData.formasVenta.caja.factorUnidades) }]
          : []),
      ],
    };

    try {
      if (isEditing) {
        await productService.update({ id: editingProductId, ...payload });

        window.dispatchEvent(new CustomEvent("products:changed"));
        window.dispatchEvent(new Event("syspharma_products_updated"));
        setConfirmData({
          type: "success",
          title: "Producto Actualizado",
          message: `${formData.nombre} se ha actualizado correctamente`,
          onConfirm: () => { setShowConfirmModal(false); navigate("/admin/productos"); },
        });
      } else {
        await productService.create(payload);

        window.dispatchEvent(new CustomEvent("products:changed"));
        window.dispatchEvent(new Event("syspharma_products_updated"));

        setConfirmData({
          type: "success",
          title: "Producto Registrado",
          message: `${formData.nombre} creado exitosamente`,
          onConfirm: () => {
            setShowConfirmModal(false);
            setFormData({
              nombre: "", descripcion: "", codigoBarras: "", marcaId: "", tipoProducto: "Producto General", categoriaId: "", proveedorId: "",
              precio: "", porcentajeIva: 0, stock: "", estado: true, composicion: "", concentracion: "",
              presentacionId: "", viaAdministracion: "", registroSanitario: "", requiereFormula: false, imagen: null,
              formasVenta: {
                blister: { habilitado: false, precio: "", factorUnidades: "", precioAuto: true },
                caja: { habilitado: false, precio: "", factorUnidades: "", blisteresPorCaja: "", precioAuto: true },
              },
            });
            setImagePreview(null);
            navigate("/admin/productos");
          },
        });
      }
      setShowConfirmModal(true);
    } catch (error) {
      const msg = error?.response?.data?.message || "Error al guardar el producto. Intenta nuevamente.";
      showError("Error", msg);
      console.error("Error:", error);
    }
  };

  return (
    <div className="h-full p-6 font-sans text-gray-800 bg-white md:bg-transparent">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-md hover:bg-gray-100 border border-gray-100">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-lg font-bold">{isEditing ? "Editar Producto" : "Agregar Producto"}</h1>
              <p className="text-xs text-gray-500">{isEditing ? `Editando: ${formData.nombre}` : "Crear un nuevo producto en el inventario"}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={handleSave} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md text-sm font-medium shadow-sm">
              <Save size={14} /> Guardar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
            <div className="space-y-4">

              {/* Imagen */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Imagen del Producto</label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-500 transition bg-gray-50">
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploadingImage} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingImage} className="w-full flex flex-col items-center disabled:opacity-60">
                    {uploadingImage ? (
                      <div className="flex flex-col items-center py-2">
                        <Loader2 size={24} className="text-emerald-500 animate-spin mb-2" />
                        <p className="text-xs font-semibold text-gray-600">Subiendo imagen...</p>
                      </div>
                    ) : imagePreview ? (
                      <div className="flex flex-col items-center">
                        <img src={imagePreview} alt="Preview" className="max-h-36 max-w-full object-contain mb-2 rounded" />
                        <p className="text-xs text-gray-500">Haz clic para cambiar imagen</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Package size={28} className="text-gray-400 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-gray-600">Sube una imagen</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG hasta 5MB</p>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
                <input type="text" className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                  value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
              </div>

              {/* Marca */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Marca</label>
                <select className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white"
                  value={formData.marcaId} onChange={(e) => setFormData({ ...formData, marcaId: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.nombre}</option>)}
                </select>
              </div>

              {/* Descripción (AGREGADO) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Descripción</label>
                <textarea className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500" rows={2}
                  placeholder="Ingresa una descripción para el producto..."
                  value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Producto</label>
                <select className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                  value={formData.tipoProducto} onChange={(e) => setFormData({ ...formData, tipoProducto: e.target.value })}>
                  <option value="Producto General">Producto General</option>
                  <option value="Medicamento">Medicamento</option>
                </select>
              </div>

              {/* Categoría - usa id */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Categoría</label>
                <select className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                  value={formData.categoriaId}
                  onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Presentación */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Presentación</label>
                <select className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white"
                  value={formData.presentacionId} onChange={(e) => setFormData({ ...formData, presentacionId: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {presentations.map(pres => <option key={pres.id} value={pres.id}>{pres.nombre}</option>)}
                </select>
              </div>

              {/* Proveedor */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Proveedor</label>
                <select className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white"
                  value={formData.proveedorId} onChange={(e) => setFormData({ ...formData, proveedorId: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {providers.map(prov => <option key={prov.id} value={prov.id}>{prov.nombre}</option>)}
                </select>
              </div>

              {/* Código de barras */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Código de Barras</label>
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="text" autoComplete="off"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-emerald-500"
                    placeholder="Escanea o escribe el código..."
                    value={formData.codigoBarras}
                    onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Con el cursor aquí, solo pasa el lector — el código queda listo para usarse en el punto de venta.</p>
              </div>

              {/* Precio, IVA y Stock */}
              <div className="grid grid-cols-3 gap-3">
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Precio ($)</label>
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="number" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded"
                    value={formData.precio} onChange={(e) => setFormData({ ...formData, precio: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">IVA (%)</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-emerald-500"
                    value={formData.porcentajeIva} onChange={(e) => setFormData({ ...formData, porcentajeIva: Number(e.target.value) })}>
                    <option value={0}>0% (Exento)</option>
                    <option value={5}>5%</option>
                    <option value={19}>19%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Stock</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="number" readOnly className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded bg-gray-100 cursor-not-allowed font-medium text-gray-600"
                      value={formData.stock} />
                  </div>
                </div>
              </div>

              {/* Formas de venta */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-bold text-gray-800 text-sm mb-3">Formas de Venta</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 border-gray-200">
                    <label className="text-xs font-bold text-gray-700">Unidad</label>
                    <span className="text-xs font-semibold text-gray-600">$ {formData.precio || "0"}</span>
                  </div>

                  <div className="p-3 rounded-lg border border-gray-200">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        checked={formData.formasVenta.blister.habilitado}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            formasVenta: { ...f.formasVenta, blister: { ...f.formasVenta.blister, habilitado: e.target.checked } },
                          }))
                        }
                      />
                      Vender por Blister
                    </label>
                    {formData.formasVenta.blister.habilitado && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-gray-700">Precio por blister ($)</label>
                            {!formData.formasVenta.blister.precioAuto && (
                              <button
                                type="button"
                                className="text-[10px] font-semibold text-emerald-600 hover:underline"
                                onClick={() =>
                                  setFormData((f) => ({
                                    ...f,
                                    formasVenta: { ...f.formasVenta, blister: { ...f.formasVenta.blister, precioAuto: true } },
                                  }))
                                }
                              >
                                Calcular automático
                              </button>
                            )}
                          </div>
                          <input
                            type="number"
                            className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                            value={formData.formasVenta.blister.precio}
                            onChange={(e) =>
                              setFormData((f) => ({
                                ...f,
                                formasVenta: { ...f.formasVenta, blister: { ...f.formasVenta.blister, precio: e.target.value, precioAuto: false } },
                              }))
                            }
                          />
                          {formData.formasVenta.blister.precioAuto && (
                            <p className="text-[10px] text-gray-400 mt-1">Calculado desde el precio unitario.</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Unidades por blister</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                            value={formData.formasVenta.blister.factorUnidades}
                            onChange={(e) =>
                              setFormData((f) => ({
                                ...f,
                                formasVenta: { ...f.formasVenta, blister: { ...f.formasVenta.blister, factorUnidades: e.target.value } },
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg border border-gray-200">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        checked={formData.formasVenta.caja.habilitado}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            formasVenta: { ...f.formasVenta, caja: { ...f.formasVenta.caja, habilitado: e.target.checked } },
                          }))
                        }
                      />
                      Vender por Caja
                    </label>
                    {formData.formasVenta.caja.habilitado && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-gray-700">Precio por caja ($)</label>
                            {!formData.formasVenta.caja.precioAuto && (
                              <button
                                type="button"
                                className="text-[10px] font-semibold text-emerald-600 hover:underline"
                                onClick={() =>
                                  setFormData((f) => ({
                                    ...f,
                                    formasVenta: { ...f.formasVenta, caja: { ...f.formasVenta.caja, precioAuto: true } },
                                  }))
                                }
                              >
                                Calcular automático
                              </button>
                            )}
                          </div>
                          <input
                            type="number"
                            className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                            value={formData.formasVenta.caja.precio}
                            onChange={(e) =>
                              setFormData((f) => ({
                                ...f,
                                formasVenta: { ...f.formasVenta, caja: { ...f.formasVenta.caja, precio: e.target.value, precioAuto: false } },
                              }))
                            }
                          />
                          {formData.formasVenta.caja.precioAuto && (
                            <p className="text-[10px] text-gray-400 mt-1">Calculado desde el precio unitario.</p>
                          )}
                        </div>

                        {formData.formasVenta.blister.habilitado ? (
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Blísteres por caja</label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="Ej: 10"
                              className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                              value={formData.formasVenta.caja.blisteresPorCaja}
                              onChange={(e) =>
                                setFormData((f) => ({
                                  ...f,
                                  formasVenta: { ...f.formasVenta, caja: { ...f.formasVenta.caja, blisteresPorCaja: e.target.value } },
                                }))
                              }
                            />
                            <p className="text-[10px] text-gray-400 mt-1">
                              {formData.formasVenta.caja.blisteresPorCaja && formData.formasVenta.blister.factorUnidades
                                ? `= ${Number(formData.formasVenta.caja.blisteresPorCaja) * Number(formData.formasVenta.blister.factorUnidades)} unidades por caja`
                                : "Se calculan las unidades por caja automáticamente."}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Unidades por caja</label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                              value={formData.formasVenta.caja.factorUnidades}
                              onChange={(e) =>
                                setFormData((f) => ({
                                  ...f,
                                  formasVenta: { ...f.formasVenta, caja: { ...f.formasVenta.caja, factorUnidades: e.target.value } },
                                }))
                              }
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Medicamento */}
              {formData.tipoProducto === "Medicamento" && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-bold text-gray-800 text-sm mb-3">Información Técnica</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Composición</label>
                      <textarea className="w-full text-sm border border-gray-300 rounded px-3 py-2" rows={2}
                        value={formData.composicion} onChange={(e) => setFormData({ ...formData, composicion: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Concentración</label>
                        <input type="text" className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                          value={formData.concentracion} onChange={(e) => setFormData({ ...formData, concentracion: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Vía de Administración</label>
                      <select className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                        value={formData.viaAdministracion} onChange={(e) => setFormData({ ...formData, viaAdministracion: e.target.value })}>
                        <option value="">Seleccionar...</option>
                        <option value="Oral">Oral</option>
                        <option value="Inyectable">Inyectable</option>
                        <option value="Tópica">Tópica</option>
                        <option value="Inhalatoria">Inhalatoria</option>
                        <option value="Sublingual">Sublingual</option>
                        <option value="Rectal">Rectal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Registro Sanitario</label>
                      <input type="text" className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                        value={formData.registroSanitario} onChange={(e) => setFormData({ ...formData, registroSanitario: e.target.value })} />
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${formData.requiereFormula ? "bg-blue-100 border-blue-400" : "bg-gray-50 border-gray-200"}`}>
                      <label className="text-xs font-bold text-gray-700">Requiere Fórmula Médica</label>
                      <button onClick={() => setFormData({ ...formData, requiereFormula: !formData.requiereFormula })}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all ${formData.requiereFormula ? "bg-blue-600" : "bg-gray-300"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.requiereFormula ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 bg-white border-t border-gray-100 p-4 sticky bottom-0 z-20">
          <div className="max-w-6xl mx-auto flex items-center justify-end">
            <button onClick={() => navigate(-1)} className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded mr-3">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded flex items-center gap-2">
              <Save size={14} /> Guardar
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden flex flex-col">
            <div className={`px-6 py-4 border-b flex justify-between items-center ${confirmData.type === "success" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-3">
                {confirmData.type === "success" ? <CheckCircle size={24} className="text-emerald-600" /> : <AlertCircle size={24} className="text-red-600" />}
                <h3 className="font-bold text-gray-900 text-lg">{confirmData.title}</h3>
              </div>
              <button onClick={() => setShowConfirmModal(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-sm leading-relaxed">{confirmData.message}</p>
            </div>
            <div className={`px-6 py-4 border-t ${confirmData.type === "success" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <button onClick={() => confirmData.onConfirm && confirmData.onConfirm()}
                className={`w-full px-4 py-2 rounded font-semibold text-white text-sm ${confirmData.type === "success" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewProductPage;