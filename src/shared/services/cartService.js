import { apiClient } from "../utils/apiClient";

const ENDPOINT = "Carrito";

// Carrito persistido en el backend, solo para usuarios logueados (api/Carrito).
export const cartService = {
  getMine: async (usuarioId) => {
    const res = await apiClient.get(`${ENDPOINT}/${usuarioId}`);
    return res.data || [];
  },

  upsertItem: async (usuarioId, productoId, cantidad) => {
    const res = await apiClient.put(`${ENDPOINT}/${usuarioId}/items`, { productoId, cantidad });
    return res.data || [];
  },

  removeItem: async (usuarioId, productoId) => {
    const res = await apiClient.delete(`${ENDPOINT}/${usuarioId}/items/${productoId}`);
    return res.data || [];
  },

  clear: async (usuarioId) => {
    await apiClient.delete(`${ENDPOINT}/${usuarioId}`);
  },
};

export default cartService;
