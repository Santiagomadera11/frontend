import { apiClient } from "../../../../shared/utils/apiClient";

const ENDPOINT = "Proveedor";

export const providerService = {
  getAll: async () => {
    const response = await apiClient.get(ENDPOINT);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`${ENDPOINT}/${id}`);
    return response.data;
  },

  create: async (data) => {
    const payload = {
      nombre: data.nombre,
      contacto: data.contacto || null,
      email: data.email || null,
      telefono: data.telefono || null,
      direccion: data.direccion || null,
      tipoDocumentoId: data.tipoDocumentoId || null,
      documento: data.documento || null,
    };
    const response = await apiClient.post(ENDPOINT, payload);
    return response.data;
  },

  update: async (data) => {
    const payload = {
      id: data.id,
      nombre: data.nombre,
      contacto: data.contacto || null,
      email: data.email || null,
      telefono: data.telefono || null,
      direccion: data.direccion || null,
      tipoDocumentoId: data.tipoDocumentoId || null,
      documento: data.documento || null,
    };
    const response = await apiClient.put(ENDPOINT, payload);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`${ENDPOINT}/${id}`);
    return response.data;
  },

  toggleStatus: async (id, nuevoEstado) => {
    const response = await apiClient.patch(`${ENDPOINT}/${id}/estado`, nuevoEstado);
    return response.data;
  },
};