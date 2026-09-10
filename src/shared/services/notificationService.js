import { apiClient } from "../utils/apiClient";

const ENDPOINT = "Notificacion";

// Notificaciones persistidas en el backend (api/Notificacion), por usuario.
export const notificationService = {
  getMine: async (usuarioId) => {
    const res = await apiClient.get(`${ENDPOINT}/${usuarioId}`);
    return res.data || [];
  },

  create: async ({ usuarioId, tipo, titulo, mensaje, path }) => {
    const res = await apiClient.post(ENDPOINT, { usuarioId, tipo, titulo, mensaje, path });
    return res.data;
  },

  markRead: async (id) => {
    await apiClient.patch(`${ENDPOINT}/${id}/leida`);
  },

  markAllRead: async (usuarioId) => {
    await apiClient.patch(`${ENDPOINT}/${usuarioId}/leer-todas`);
  },
};

export default notificationService;
