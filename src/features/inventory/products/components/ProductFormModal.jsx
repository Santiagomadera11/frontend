import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

const emptyForm = {
  nombre: "",
  descripcion: "", // <-- AGREGADO
  marcaId: "",
  tipoProducto: "Producto General",
  categoriaId: "",
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
  indicaciones: "",
  posologia: "",
  unidadesPorEnvase: "",
  requiereRefrigeracion: false,
  afectaConduccion: false,
  fotosensible: false,
};

const ProductModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories = [],
  brands = [],
  presentations = [],
}) => {

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...emptyForm,
        ...initialData,
        categoriaId: initialData.categoriaId ? String(initialData.categoriaId) : "",
        marcaId: initialData.marcaId ? String(initialData.marcaId) : "",
        presentacionId: initialData.presentacionId ? String(initialData.presentacionId) : "",
      });
    } else {
      setFormData(emptyForm);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSave({
      ...formData,
      categoriaId: formData.categoriaId ? Number(formData.categoriaId) : null,
      marcaId: formData.marcaId ? Number(formData.marcaId) : null,
      presentacionId: formData.presentacionId ? Number(formData.presentacionId) : null,
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

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nombre *</label>
            <input type="text" className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500" {...field("nombre")} />
          </div>

          {/* Marca */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Marca</label>
            <select className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500 bg-white"
              value={formData.marcaId} onChange={(e) => setFormData(p => ({ ...p, marcaId: e.target.value }))}>
              <option value="">Seleccionar...</option>
              {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.nombre}</option>)}
            </select>
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
              <select className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500 bg-white"
                value={formData.presentacionId} onChange={(e) => setFormData(p => ({ ...p, presentacionId: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {presentations.map(pres => <option key={pres.id} value={pres.id}>{pres.nombre}</option>)}
              </select>
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
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Unidades por envase</label>
                    <input type="number" min="0" className="w-full text-sm border border-gray-300 rounded px-3 py-2" placeholder="Ej: 12" {...field("unidadesPorEnvase")} />
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
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Indicaciones (para qué sirve)</label>
                  <textarea className="w-full text-sm border border-gray-300 rounded px-3 py-2" rows="2" placeholder="Ej: Alivio del dolor leve o moderado y estados febriles" {...field("indicaciones")} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Posología (modo de empleo)</label>
                  <textarea className="w-full text-sm border border-gray-300 rounded px-3 py-2" rows="2" placeholder="Ej: Tomar 1 comprimido cada 8 horas, máximo 3 al día" {...field("posologia")} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Símbolos de advertencia</label>
                  <div className="space-y-2">
                    {[
                      { key: "requiereFormula", label: "Requiere Fórmula Médica" },
                      { key: "requiereRefrigeracion", label: "Requiere refrigeración (cadena de frío)" },
                      { key: "afectaConduccion", label: "Puede afectar la capacidad de conducir" },
                      { key: "fotosensible", label: "Puede producir sensibilidad al sol" },
                    ].map(({ key, label }) => (
                      <div key={key} className={`flex items-center justify-between p-3 rounded-lg border ${formData[key] ? "bg-blue-100 border-blue-400" : "bg-gray-50 border-gray-200"}`}>
                        <label className="text-xs font-bold text-gray-700">{label}</label>
                        <button type="button" onClick={() => setFormData(p => ({ ...p, [key]: !p[key] }))}
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all ${formData[key] ? "bg-blue-600" : "bg-gray-300"}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

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