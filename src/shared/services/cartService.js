import { apiClient } from "../utils/apiClient";

const ENDPOINT = "Carrito";

// Carrito persistido en el backend, solo para usuarios logueados (api/Carrito).
export const cartService = {
  getMine: async (usuarioId) => {
    const res = await apiClient.get(`${ENDPOINT}/${usuarioId}`);
    return res.data || [];
  },

  upsertItem: async (usuarioId, productoId, cantidad, formaVentaId = null) => {
    const res = await apiClient.put(`${ENDPOINT}/${usuarioId}/items`, {
      productoId,
      cantidad,
      formaVentaId,
    });
    return res.data || [];
  },

  removeItem: async (usuarioId, productoId, formaVentaId = null) => {
    const query = formaVentaId != null ? `?formaVentaId=${formaVentaId}` : "";
    const res = await apiClient.delete(`${ENDPOINT}/${usuarioId}/items/${productoId}${query}`);
    return res.data || [];
  },

  clear: async (usuarioId) => {
    await apiClient.delete(`${ENDPOINT}/${usuarioId}`);
  },
};

export default cartService;
