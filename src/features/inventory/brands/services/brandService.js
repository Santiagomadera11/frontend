import { apiClient } from "../../../../shared/utils/apiClient";

const ENDPOINT = "Marca";

// Solo activas — para dropdowns de productos
const getAll = async (estado) => {
  const params = {};
  if (estado) params.estado = estado;
  const response = await apiClient.get(ENDPOINT, { params });
  return response.data;
};

// Activas + inactivas — para la página de gestión de marcas
const getAllIncludingInactive = async (estado) => {
  const params = {};
  if (estado) params.estado = estado;
  const response = await apiClient.get(`${ENDPOINT}/todas`, { params });
  return response.data;
};

const create = async (brandData) => {
  const response = await apiClient.post(ENDPOINT, brandData);
  return response.data;
};

const update = async (id, brandData) => {
  const response = await apiClient.put(ENDPOINT, { id, ...brandData });
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

export const brandService = {
  getAll,
  getAllIncludingInactive,
  create,
  update,
  toggleStatus,
  remove,
};
