import React, { useState } from "react";
import { X, DollarSign, AlertCircle } from "lucide-react";
import { expensesService } from "../services/expensesService";
import { formValidations } from "../../../shared/utils/formValidations";

export const RegisterExpenseModal = ({ isOpen, onClose, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    descripcion: "",
    monto: "",
    categoria: "Materiales",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    let error = "";
    
    if (name === "descripcion") {
      error = formValidations.validateName(value);
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.descripcion) {
      newErrors.descripcion = "Descripción requerida";
    } else {
      newErrors.descripcion = formValidations.validateName(formData.descripcion);
    }

    if (!formData.monto) {
      newErrors.monto = "Monto requerido";
    }

    if (Object.values(newErrors).some(error => error)) {
      setErrors(newErrors);
      return;
    }

    try {
      await expensesService.create({
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        categoria: formData.categoria,
      });

      // Reset form
      setFormData({ descripcion: "", monto: "", categoria: "Materiales" });
      setErrors({});
      onSaveSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error guardando gasto:", error);
      setErrors({ submit: "Error al guardar el gasto" });
    }
  };

  const handleCancel = () => {
    setFormData({ descripcion: "", monto: "", categoria: "Materiales" });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 transition-all bg-gray-50 focus:bg-white";
  const labelClass =
    "block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl flex flex-col animate-fade-in-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-xl">
          <div>
            <h2 className="text-sm font-bold text-gray-800">
              Registrar gasto del día
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Registra gastos operativos, materiales, servicios, etc.
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4"
        >
          {/* Descripción */}
          <div>
            <label className={labelClass}>Descripción del gasto *</label>
            <input
              type="text"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Ej: compra de bolsas, luz, repartidor, etc"
              className={`${inputClass} ${errors.descripcion ? "border-red-500" : ""}`}
              required
            />
            {errors.descripcion && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                <AlertCircle size={12} />
                {errors.descripcion}
              </div>
            )}
          </div>

          {/* Monto y Categoría */}
          <div className="grid grid-cols-2 gap-3">
            {/* Monto */}
            <div>
              <label className={labelClass}>Monto *</label>
              <div className="relative">
                <DollarSign
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="number"
                  name="monto"
                  value={formData.monto}
                  onChange={handleChange}
                  placeholder="0"
                  className={`${inputClass} pl-7`}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className={labelClass}>Categoría *</label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="Materiales">Materiales</option>
                <option value="Servicios">Servicios</option>
                <option value="Reparto">Reparto</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-50 text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg shadow-sm text-xs transition-colors"
          >
            Guardar gasto
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterExpenseModal;
