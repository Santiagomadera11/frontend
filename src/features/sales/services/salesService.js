import { apiClient } from "../../../shared/utils/apiClient";

const ENDPOINT = "Venta";

export const salesService = {
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

  create: async (saleData) => {
    const payload = {
      usuarioId: saleData.usuarioId,
      clienteNombre: saleData.cliente || saleData.clienteNombre || "Consumidor Final",
      clienteDocumento: saleData.documento || saleData.clienteDocumento || null,
      clienteTelefono: saleData.telefono || saleData.clienteTelefono || null,
      metodoPagoId: saleData.metodoPagoId,
      estadoId: saleData.estadoId || 1,
      porcentajeIva: saleData.porcentajeIva || 19, // ← CAMBIO: default 19% en lugar de 0
      subtotal: saleData.subtotal || 0,  // ← NUEVO
      iva: saleData.iva || 0,            // ← NUEVO
      total: saleData.total || 0,        // ← NUEVO
      notas: saleData.notas || null,
      detalles: (saleData.productos || saleData.detalles || []).map(p => ({
        productoId: p.id || p.productoId,
        cantidad: p.cantidad,
        precioUnitario: p.precio || p.precioUnitario,
        descuento: p.descuento || 0,
        subtotal: p.subtotal || (p.cantidad * (p.precio || p.precioUnitario || 0)), // ← NUEVO
      })),
      servicios: (saleData.servicios || []).map(s => ({
        servicioId: s.servicioId,
        cantidad: s.cantidad || 1,
        precioUnitario: s.precioUnitario,
        descuento: s.descuento || 0,
        subtotal: s.subtotal || (s.cantidad * s.precioUnitario),
        citaId: s.citaId || null,
      })),
    };

    const parsedTurnoId = Number(saleData.turnoId);
    if (!Number.isNaN(parsedTurnoId) && parsedTurnoId > 0) {
      payload.turnoId = parsedTurnoId;
    }

    const res = await apiClient.post(ENDPOINT, payload);
    window.dispatchEvent(new Event('sales:changed'));
    return res.data;
  },

  update: async (saleData) => {
    const payload = {
      id: saleData.id,
      clienteNombre: saleData.clienteNombre || saleData.cliente,
      clienteDocumento: saleData.clienteDocumento || null,
      clienteTelefono: saleData.clienteTelefono || null,
      metodoPagoId: saleData.metodoPagoId,
      estadoId: saleData.estadoId,
      notas: saleData.notas || null,
    };
    const res = await apiClient.put(ENDPOINT, payload);
    return res.data;
  },

  cambiarEstado: async (id, estadoId) => {
    const res = await apiClient.patch(`${ENDPOINT}/${id}/estado`, estadoId);
    return res.data;
  },

  anular: async (id) => {
    const res = await apiClient.patch(`${ENDPOINT}/${id}/anular`, {});
    return res.data;
  },

  delete: async (id) => {
    const res = await apiClient.delete(`${ENDPOINT}/${id}`);
    return res.data;
  },

  // ── Helpers de estadísticas ───────────────────────────────────────────────
  getTodaySales: async () => {
    const all = await salesService.getAll();
    const today = new Date().toLocaleDateString("es-CO");
    return all.filter(s => {
      const fecha = s.fechaVenta ? new Date(s.fechaVenta).toLocaleDateString("es-CO") : "";
      return fecha === today;
    });
  },

  getTotalSalesToday: async () => {
    const sales = await salesService.getTodaySales();
    return sales.reduce((sum, s) => sum + (s.total || 0), 0);
  },

  getTotalProductsToday: async () => {
    const sales = await salesService.getTodaySales();
    return sales.reduce((sum, s) =>
      sum + (s.detalles || []).reduce((a, d) => a + d.cantidad, 0), 0);
  },

  // ── Servicios en Venta ────────────────────────────────────────
  createServiceDetail: async (ventaId, serviceData) => {
    const payload = {
      ventaId,
      servicioId: serviceData.id || serviceData.servicioId,
      cantidad: serviceData.cantidad || 1,
      precioUnitario: serviceData.precio || serviceData.precioUnitario || 0,
      descuento: serviceData.descuento || 0,
      notas: serviceData.notas || null,
    };
    const res = await apiClient.post("VentaDetalleServicio", payload);
    return res.data;
  },

  createMultipleServiceDetails: async (ventaId, services) => {
    const results = [];
    for (const service of services) {
      try {
        const result = await salesService.createServiceDetail(ventaId, service);
        results.push(result);
      } catch (err) {
        console.warn(`Error al crear detalle de servicio: ${err}`);
      }
    }
    return results;
  },
};