// Una venta puede traer productos y servicios/citas mezclados en la misma
// transacción (ej: un medicamento + una consulta cobrados juntos). Para "Ventas"/
// "Ingresos" en cualquier pantalla del sistema, solo debe contar la parte de
// productos: la de servicios/citas se audita aparte, en el panel de Citas
// ("Ingresos por Citas Hoy"), para no mezclar caja de mostrador con ingresos médicos.
//
// Centralizado ACÁ a propósito: esta cuenta se repetía copiada en cada pantalla que
// mostraba ventas (Ventas, Dashboard, Reporte de Ventas...), así que arreglarla en una
// no la arreglaba en las demás. Cualquier pantalla que sume "ventas" o "ingresos"
// debe importar estas dos funciones en vez de recalcularlo por su cuenta.
export const serviciosMontoDe = (venta) =>
  (venta?.servicios || []).reduce((a, s) => a + (s.subtotal || 0), 0);

export const productosMontoDe = (venta) =>
  (venta?.total || 0) - serviciosMontoDe(venta);
