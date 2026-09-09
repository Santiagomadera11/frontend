import { apiClient } from "../../../../shared/utils/apiClient";

const ENDPOINT = "Compra";

const notifyChange = () => {
  window.dispatchEvent(new CustomEvent("purchases:changed"));
};

export const purchaseService = {
  getAll: async () => {
    const res = await apiClient.get(ENDPOINT);
    return res.data;
  },

  getById: async (id) => {
    const res = await apiClient.get(`${ENDPOINT}/${id}`);
    return res.data;
  },

  getEstados: async () => {
    const res = await apiClient.get(`${ENDPOINT}/estados`);
    return res.data;
  },

  create: async (purchase) => {
    const payload = {
      proveedorId: purchase.proveedorId,
      usuarioId: purchase.usuarioId,
      porcentajeIva: purchase.porcentajeIva ?? 19,
      notas: purchase.notas || null,
      observaciones: purchase.observaciones || null,
      fechaEntrega: purchase.fechaEntrega || null,
      detalles: (purchase.detalles || purchase.productos || []).map(p => ({
        productoId: p.productoId || p.id,
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario || p.precio,
        lote: p.lote || null,
        fechaVencimiento: p.fechaVencimiento || null,
      })),
    };
    const res = await apiClient.post(ENDPOINT, payload);
    notifyChange();
    return res.data;
  },

  update: async (purchase) => {
    const payload = {
      id: purchase.id,
      proveedorId: purchase.proveedorId,
      estadoId: purchase.estadoId,
      notas: purchase.notas || null,
      observaciones: purchase.observaciones || null,
      fechaEntrega: purchase.fechaEntrega || null,
      detalles: (purchase.detalles || []).map(p => ({
        productoId: p.productoId || p.id,
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario || p.precio,
        lote: p.lote || null,
        fechaVencimiento: p.fechaVencimiento || null,
      })),
    };
    const res = await apiClient.put(ENDPOINT, payload);
    notifyChange();
    return res.data;
  },

  changeStatus: async (id, estadoId) => {
    const res = await apiClient.patch(`${ENDPOINT}/${id}/estado`, estadoId);
    notifyChange();
    return res.data;
  },

  // BUG 3 FIX: sin notifyChange acá — PurchasesPage maneja el estado local directamente
  // con setCompras(prev => prev.filter(...)), así no hay doble recarga que pise el filtro
  delete: async (id) => {
    try {
      const res = await apiClient.delete(`${ENDPOINT}/${id}`);
      return res.data || { success: true };
    } catch (error) {
      console.error("Error en delete:", error);
      throw error;
    }
  },
};