import { apiClient } from "../../../shared/utils/apiClient";

const ENDPOINT = "devolucion";

export const returnService = {
  getAll: async () => {
    const res = await apiClient.get(ENDPOINT);
    return res.data;
  },

  getById: async (id) => {
    const res = await apiClient.get(`${ENDPOINT}/${id}`);
    return res.data;
  },

  // Trae la VENTA (no la devolución) para poder elegir qué productos devolver de
  // ella. Antes llamaba a "devolucion/venta/{id}", que busca una devolución YA
  // EXISTENTE para esa venta: en el caso normal de "quiero devolver algo por
  // primera vez" no hay ninguna todavía, así que ese endpoint respondía 404 ("No
  // hay devolución para esta venta") y bloqueaba el flujo completo de Nueva Devolución.
  getVenta: async (ventaId) => {
    const res = await apiClient.get(`Venta/${ventaId}`);
    return res.data;
  },

  getEstados: async () => {
    const res = await apiClient.get(`${ENDPOINT}/estados`);
    return res.data;
  },

  getMermas: async ({ desde, hasta } = {}) => {
    const params = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;
    const res = await apiClient.get(`${ENDPOINT}/mermas`, { params });
    return res.data;
  },

  create: async (dto) => {
    const payload = {
      ventaId: dto.ventaId,
      usuarioId: dto.usuarioId,
      motivo: dto.motivo,
      observaciones: dto.observaciones || null,
      detalles: (dto.detalles || []).map((d) => ({
        detalleVentaId: d.detalleVentaId,
        productoId: d.productoId,
        cantidadDevuelta: d.cantidadDevuelta,
        reingresa: d.reingresa !== false,
      })),
    };

    try {
      const res = await apiClient.post(ENDPOINT, payload);
      return res.data;
    } catch (err) {
      console.error("❌ Error al crear devolución:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        payload: payload,
      });
      throw err;
    }
  },

  gestionar: async (id, dto) => {
    const payload = {
      nuevoEstado: dto.nuevoEstado,
      usuarioGestionId: dto.usuarioGestionId,
    };

    const res = await apiClient.patch(`${ENDPOINT}/${id}/gestionar`, payload);
    return res.data;
  },
};
