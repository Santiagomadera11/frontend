import React, { useState, useEffect, useRef } from "react";
import { X, Save, Upload } from "lucide-react";

const ProductModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories = [],
  providers = [],
}) => {
  const emptyForm = {
    nombre: "",
    descripcion: "", // <-- AGREGADO
    marca: "",
    tipoProducto: "Producto General",
    categoriaId: "",
    proveedorId: "",
    precio: "",
    porcentajeIva: 0,
    stock: 0,
    estado: true,
    imagen: null,
    composicion: "",
    concentracion: "",
    presentacion: "",
    viaAdministracion: "",
    registroSanitario: "",
    requiereFormula: false,
    esDestacado: false,
    enOferta: false,
    porcentajeDescuento: 0,
    esRecomendado: false,
  };

  const [formData, setFormData] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [showVisibility, setShowVisibility] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...emptyForm,
        ...initialData,
        categoriaId: initialData.categoriaId ? String(initialData.categoriaId) : "",
        proveedorId: initialData.proveedorId ? String(initialData.proveedorId) : "",
      });
      setImagePreview(initialData.imagen || null);
    } else {
      setFormData(emptyForm);
      setImagePreview(null);
    }
  }, [initialData, isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert("La imagen es demasiado grande. El tamaño máximo permitido es 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        setFormData(p => ({ ...p, imagen: base64 }));
        setImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSave({
      ...formData,
      categoriaId: formData.categoriaId ? Number(formData.categoriaId) : null,
      proveedorId: formData.proveedorId ? Number(formData.proveedorId) : null,
      precio: Number(formData.precio),
      porcentajeIva: Number(formData.porcentajeIva) || 0,
      stock: Number(formData.stock),
    });
    onClose();
  };

  const isMedicamento = formData.tipoProducto === "Medicamento";
  const field = (key) => ({ value: formData[key] ?? "", onChange: (e) => setFormData(p => ({ ...p, [key]: e.target.value })) });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h3 className="font-bold text-gray-800 text-sm">{initialData ? "Editar Producto" : "Nuevo Producto"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 no-scrollbar">

          {/* Imagen */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Imagen del Producto</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-500 transition bg-gray-50">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="max-h-32 max-w-full object-contain mb-2 rounded shadow-sm" />
                    <p className="text-xs text-gray-500">Haz clic para cambiar imagen</p>
                  </>
                ) : (
                  <>
                    <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-600">Sube una imagen</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG hasta 500KB</p>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nombre *</label>
            <input type="text" className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500" {...field("nombre")} />
          </div>

          {/* Marca */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Marca</label>
            <input type="text" className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500" placeholder="Ej: Bayer, Roche, Genfar..." {...field("marca")} />
          </div>

          {/* Descripción (AGREGADO) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Descripción</label>
            <textarea className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500" rows="2" 
              placeholder="Ingresa una descripción para el producto..." {...field("descripcion")} />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Producto</label>
            <select className="w-full text-sm border border-gray-300 rounded px-3 py-2" {...field("tipoProducto")}>
              <option value="Producto General">Producto General</option>
              <option value="Medicamento">Medicamento</option>
            </select>
          </div>

          {/* Grid básico */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Categoría</label>
              <select className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                value={formData.categoriaId} onChange={(e) => setFormData(p => ({ ...p, categoriaId: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Presentación</label>
              <input type="text" className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500" placeholder="Ej: Cápsula, Tableta, Jarabe..." {...field("presentacion")} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Precio ($)</label>
              <input type="number" className="w-full text-sm border border-gray-300 rounded px-3 py-2" {...field("precio")} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">IVA (%)</label>
              <select className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-emerald-500"
                value={formData.porcentajeIva} onChange={(e) => setFormData(p => ({ ...p, porcentajeIva: Number(e.target.value) }))}>
                <option value={0}>0% (Exento)</option>
                <option value={5}>5%</option>
                <option value={19}>19%</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Stock</label>
              <input
                type="number"
                readOnly
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed font-medium text-gray-600 focus:outline-none"
                value={formData.stock}
              />
              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                El stock se actualiza automáticamente con las compras registradas.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Estado</label>
              <select className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                value={formData.estado ? "true" : "false"}
                onChange={(e) => setFormData(p => ({ ...p, estado: e.target.value === "true" }))}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Info técnica medicamentos */}
          {isMedicamento && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-bold text-gray-800 text-sm mb-3">Información Técnica</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Composición</label>
                  <textarea className="w-full text-sm border border-gray-300 rounded px-3 py-2" rows="2" placeholder="Ej: Amoxicilina trihidratada..." {...field("composicion")} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Concentración</label>
                    <input type="text" className="w-full text-sm border border-gray-300 rounded px-3 py-2" placeholder="Ej: 500mg" {...field("concentracion")} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Vía de Administración</label>
                  <select className="w-full text-sm border border-gray-300 rounded px-3 py-2" {...field("viaAdministracion")}>
                    <option value="">Seleccionar...</option>
                    {["Oral", "Inyectable", "Tópica", "Inhalatoria", "Sublingual", "Rectal"].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Registro Sanitario</label>
                  <input type="text" className="w-full text-sm border border-gray-300 rounded px-3 py-2" placeholder="Ej: M-12345-2024" {...field("registroSanitario")} />
                </div>
                <div className={`flex items-center justify-between p-3 rounded-lg border ${formData.requiereFormula ? "bg-blue-100 border-blue-400" : "bg-gray-50 border-gray-200"}`}>
                  <label className="text-xs font-bold text-gray-700">Requiere Fórmula Médica</label>
                  <button onClick={() => setFormData(p => ({ ...p, requiereFormula: !p.requiereFormula }))}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all ${formData.requiereFormula ? "bg-blue-600" : "bg-gray-300"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.requiereFormula ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Configuración de Visibilidad */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button type="button" onClick={() => setShowVisibility(v => !v)}
              className="w-full flex items-center justify-between gap-3 p-2 rounded-md hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-800">📍 Configuración de Visibilidad</span>
                <div className="flex items-center gap-2">
                  {formData.esDestacado && <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Destacado</span>}
                  {formData.enOferta && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Oferta</span>}
                  {formData.esRecomendado && <span className="text-[10px] px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">Recomendado</span>}
                </div>
              </div>
              <svg className={`w-4 h-4 text-gray-500 transition-transform ${showVisibility ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </button>

            {showVisibility && (
              <div className="mt-3 space-y-3">
                {[
                  { key: "esDestacado", label: "Mostrar en Destacados" },
                  { key: "esRecomendado", label: "Mostrar en Recomendados" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg border bg-white border-gray-200 hover:border-emerald-300">
                    <label className="text-xs font-bold text-gray-700">{label}</label>
                    <button onClick={() => setFormData(p => ({ ...p, [key]: !p[key] }))}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all ${formData[key] ? "bg-emerald-600" : "bg-gray-300"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-white border-gray-200 hover:border-emerald-300">
                  <label className="text-xs font-bold text-gray-700">Mostrar en Ofertas</label>
                  <button onClick={() => setFormData(p => ({ ...p, enOferta: !p.enOferta }))}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all ${formData.enOferta ? "bg-emerald-600" : "bg-gray-300"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.enOferta ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {formData.enOferta && (
                  <div className="pl-3 pr-3 py-2">
                    <label className="block text-xs font-bold text-gray-700 mb-2">Porcentaje de Descuento (%)</label>
                    <input type="number" min="0" max="100"
                      className="w-full text-sm border border-emerald-300 rounded px-3 py-2 focus:outline-none"
                      value={formData.porcentajeDescuento}
                      onChange={(e) => setFormData(p => ({ ...p, porcentajeDescuento: Math.min(100, Math.max(0, Number(e.target.value))) }))} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded">Cancelar</button>
          <button onClick={handleSubmit} className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded flex items-center gap-1">
            <Save size={14} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;