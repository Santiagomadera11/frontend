export const serviciosMontoDe = (venta) =>
  (venta?.servicios || []).reduce((a, s) => a + (s.subtotal || 0), 0);

export const productosMontoDe = (venta) =>
  (venta?.total || 0) - serviciosMontoDe(venta);
