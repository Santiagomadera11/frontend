import { apiClient } from "../../../../shared/utils/apiClient.js";

const ENDPOINT = "Pedido";

const notifyChange = () => {
  window.dispatchEvent(new CustomEvent("syspharma_orders_updated"));
};

export const ordersService = {
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

  create: async (orderData) => {
    const res = await apiClient.post(ENDPOINT, orderData);
    notifyChange();
    return res.data;
  },

  update: async (orderData) => {
    const payload = {
      id: orderData.id,
      turnoId: Number(orderData.turnoId),
      clienteNombre: orderData.clienteNombre,
      clienteDocumento: orderData.clienteDocumento || null,
      clienteTelefono: orderData.clienteTelefono || null,
      metodoPagoId: orderData.metodoPagoId || null,
      estadoId: orderData.estadoId,
      subtotal: orderData.subtotal,
      total: orderData.total,
      notas: orderData.notas || null,
      detalles: orderData.detalles ? orderData.detalles.map(p => ({
        productoId: p.productoId,
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario,
        subtotal: p.subtotal
      })) : null,
    };
    const res = await apiClient.put(ENDPOINT, payload);
    notifyChange();
    return res.data;
  },

  updateStatus: async (id, estadoId) => {
    const res = await apiClient.patch(`${ENDPOINT}/${id}/estado`, Number(estadoId));
    notifyChange();
    return res.data;
  },

  delete: async (id) => {
    const res = await apiClient.delete(`${ENDPOINT}/${id}`);
    notifyChange();
    return res.data;
  },
};