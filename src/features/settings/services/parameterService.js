import { apiClient } from "../../../shared/utils/apiClient";

const emitParameterUpdate = (parameterType) => {
  window.dispatchEvent(new CustomEvent("syspharma_parameters_updated", { detail: { parameterType } }));
};

// Fallbacks por si el backend no responde
const DEFAULTS = {
  documentTypes: [
    { id: 1, value: "Cédula de Ciudadanía" },
    { id: 2, value: "Cédula de Extranjería" },
    { id: 3, value: "NIT" },
    { id: 4, value: "Pasaporte" },
    { id: 5, value: "RUT" },
    { id: 6, value: "Tarjeta de Identidad" },
  ],
  paymentMethods: [
    { id: 1, value: "Efectivo" },
    { id: 2, value: "Tarjeta Débito/Crédito" },
    { id: 3, value: "Transferencia Bancaria" },
    { id: 4, value: "Nequi" },
    { id: 5, value: "Daviplata" },
  ],
  serviceCategories: [
    { id: 1, value: "Consulta Médica" },
    { id: 2, value: "Procedimiento" },
    { id: 3, value: "Examen de Laboratorio" },
    { id: 4, value: "Vacunación" },
    { id: 5, value: "Otro" },
  ],
};

// ── Tipos de documento ────────────────────────────────────────
export const fetchDocumentTypes = async () => {
  try {
    const res = await apiClient.get("TipoDocumento");
    return res.data.map(t => ({ id: t.id, value: t.nombre }));
  } catch {
    return DEFAULTS.documentTypes;
  }
};

export const getDocumentTypes = () => DEFAULTS.documentTypes;

// ── Métodos de pago ───────────────────────────────────────────
export const fetchPaymentMethods = async () => {
  try {
    const res = await apiClient.get("MetodoPago");
    return res.data.map(m => ({ id: m.id, value: m.nombre }));
  } catch {
    return DEFAULTS.paymentMethods;
  }
};

export const getPaymentMethods = () => DEFAULTS.paymentMethods;

// ── Categorías de servicio ────────────────────────────────────
export const fetchServiceCategories = async () => {
  try {
    const res = await apiClient.get("CategoriaServicio");
    return res.data.map(c => ({ id: c.id, value: c.nombre }));
  } catch {
    return DEFAULTS.serviceCategories;
  }
};

export const getServiceCategories = () => DEFAULTS.serviceCategories;

// ── CRUD TipoDocumento ────────────────────────────────────────
export const createTipoDocumento = async (nombre) => {
  const res = await apiClient.post("TipoDocumento", { nombre });
  emitParameterUpdate("documentTypes");
  return res.data;
};

export const updateTipoDocumento = async (id, nombre) => {
  const res = await apiClient.put("TipoDocumento", { id, nombre });
  emitParameterUpdate("documentTypes");
  return res.data;
};

export const deleteTipoDocumento = async (id) => {
  await apiClient.delete(`TipoDocumento/${id}`);
  emitParameterUpdate("documentTypes");
};

// ── CRUD MetodoPago ───────────────────────────────────────────
export const createMetodoPago = async (nombre) => {
  const res = await apiClient.post("MetodoPago", { nombre });
  emitParameterUpdate("paymentMethods");
  return res.data;
};

export const updateMetodoPago = async (id, nombre) => {
  const res = await apiClient.put("MetodoPago", { id, nombre });
  emitParameterUpdate("paymentMethods");
  return res.data;
};

export const deleteMetodoPago = async (id) => {
  await apiClient.delete(`MetodoPago/${id}`);
  emitParameterUpdate("paymentMethods");
};

// ── CRUD CategoriaServicio ────────────────────────────────────
export const createCategoriaServicio = async (nombre) => {
  const res = await apiClient.post("CategoriaServicio", { nombre });
  emitParameterUpdate("serviceCategories");
  return res.data;
};

export const updateCategoriaServicio = async (id, nombre) => {
  const res = await apiClient.put("CategoriaServicio", { id, nombre });
  emitParameterUpdate("serviceCategories");
  return res.data;
};

export const deleteCategoriaServicio = async (id) => {
  await apiClient.delete(`CategoriaServicio/${id}`);
  emitParameterUpdate("serviceCategories");
};

// Compatibilidad con código anterior
export const addParameter = () => {};
export const updateParameter = () => {};
export const deleteParameter = () => {};
export const resetParameters = () => {};
export const getAllParameters = () => ({});