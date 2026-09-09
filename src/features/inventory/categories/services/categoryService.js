import { apiClient } from "../../../../shared/utils/apiClient";

const ENDPOINT = "Categoria";

// Solo activas — para dropdowns de productos, compras, etc.
const getAll = async (estado) => {
  const params = {};
  if (estado) params.estado = estado;
  const response = await apiClient.get(ENDPOINT, { params });
  return response.data;
};

// Activas + inactivas — para la página de gestión de categorías
const getAllIncludingInactive = async (estado) => {
  const params = {};
  if (estado) params.estado = estado;
  const response = await apiClient.get(`${ENDPOINT}/todas`, { params });
  return response.data;
};

const create = async (categoryData) => {
  const response = await apiClient.post(ENDPOINT, categoryData);
  return response.data;
};

const update = async (id, categoryData) => {
  const response = await apiClient.put(ENDPOINT, { id, ...categoryData });
  return response.data;
};

const toggleStatus = async (id, newStatus) => {
  const response = await apiClient.patch(`${ENDPOINT}/${id}/estado`, newStatus);
  return response.data;
};

const remove = async (id) => {
  const response = await apiClient.delete(`${ENDPOINT}/${id}`);
  return response.data;
};

export const categoryService = {
  getAll,
  getAllIncludingInactive,
  create,
  update,
  toggleStatus,
  remove,
};