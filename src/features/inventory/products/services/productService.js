import { apiClient } from "../../../../shared/utils/apiClient";

const ENDPOINT = "Producto";

const mapProduct = (p) => ({
  ...p,
  marca: p.marcaNombre || p.marca || "",
  marcaId: p.marcaId ?? "",
  presentacion: p.presentacionNombre || p.presentacion || "",
  presentacionId: p.presentacionId ?? "",
  categoria: p.categoriaNombre || p.categoria || "",
  proveedor: p.proveedorNombre || p.proveedor || "",
  tipoProducto: p.medicamento ? "Medicamento" : "Producto General",
  composicion: p.medicamento?.composicion || "",
  concentracion: p.concentracion || p.medicamento?.concentracion || "",
  viaAdministracion: p.medicamento?.viaAdministracion || "",
  registroSanitario: p.medicamento?.registroSanitario || "",
  requiereFormula: p.requiereFormulaMedica !== undefined ? p.requiereFormulaMedica : (p.medicamento?.requiereFormula || false),
  requiereFormulaMedica: p.requiereFormulaMedica !== undefined ? p.requiereFormulaMedica : (p.medicamento?.requiereFormula || false),
  indicaciones: p.medicamento?.indicaciones || "",
  posologia: p.medicamento?.posologia || "",
  unidadesPorEnvase: p.medicamento?.unidadesPorEnvase ?? "",
  requiereRefrigeracion: p.medicamento?.requiereRefrigeracion || false,
  afectaConduccion: p.medicamento?.afectaConduccion || false,
  fotosensible: p.medicamento?.fotosensible || false,
});

export const productService = {
  getAll: async () => {
    const response = await apiClient.get(ENDPOINT);
    return (response.data || []).map(mapProduct);
  },

  // Catálogo público (sin autenticación) para landing/tienda de clientes no logueados.
  getPublicCatalog: async () => {
    const response = await apiClient.get(`${ENDPOINT}/publico`);
    return response.data || [];
  },

  getById: async (id) => {
    const response = await apiClient.get(`${ENDPOINT}/${id}`);
    return mapProduct(response.data);
  },

  create: async (product) => {
    const esMedicamento = product.tipoProducto === "Medicamento";

    const payload = {
      nombre: product.nombre,
      descripcion: product.descripcion || null,
      marcaId: product.marcaId ? Number(product.marcaId) : null,
      presentacionId: product.presentacionId ? Number(product.presentacionId) : null,
      categoriaId: product.categoriaId,
      proveedorId: product.proveedorId || null,
      precio: product.precio,
      porcentajeIva: Number(product.porcentajeIva) || 0,
      precioCompra: product.precioCompra || null,
      stock: product.stock || 0,
      codigoBarras: product.codigoBarras || null,
      imagen: product.imagen || null,
      esMedicamento: esMedicamento,
      medicamento: esMedicamento
        ? {
            composicion: product.composicion || null,
            concentracion: product.concentracion || null,
            viaAdministracion: product.viaAdministracion || null,
            registroSanitario: product.registroSanitario || null,
            requiereFormula: !!product.requiereFormula,
            indicaciones: product.indicaciones || null,
            posologia: product.posologia || null,
            unidadesPorEnvase: product.unidadesPorEnvase ? Number(product.unidadesPorEnvase) : null,
            requiereRefrigeracion: !!product.requiereRefrigeracion,
            afectaConduccion: !!product.afectaConduccion,
            fotosensible: !!product.fotosensible,
          }
        : null,
    };

    const response = await apiClient.post(ENDPOINT, payload);
    return mapProduct(response.data);
  },

  update: async (product) => {
    const esMedicamento = product.tipoProducto === "Medicamento";

    const payload = {
      id: product.id,
      nombre: product.nombre,
      descripcion: product.descripcion || null,
      marcaId: product.marcaId ? Number(product.marcaId) : null,
      presentacionId: product.presentacionId ? Number(product.presentacionId) : null,
      categoriaId: product.categoriaId,
      proveedorId: product.proveedorId || null,
      precio: product.precio,
      porcentajeIva: Number(product.porcentajeIva) || 0,
      precioCompra: product.precioCompra || null,
      stock: product.stock,
      codigoBarras: product.codigoBarras || null,
      imagen: product.imagen || null,
      esMedicamento: esMedicamento,
      medicamento: esMedicamento
        ? {
            composicion: product.composicion || null,
            concentracion: product.concentracion || null,
            viaAdministracion: product.viaAdministracion || null,
            registroSanitario: product.registroSanitario || null,
            requiereFormula: !!product.requiereFormula,
            indicaciones: product.indicaciones || null,
            posologia: product.posologia || null,
            unidadesPorEnvase: product.unidadesPorEnvase ? Number(product.unidadesPorEnvase) : null,
            requiereRefrigeracion: !!product.requiereRefrigeracion,
            afectaConduccion: !!product.afectaConduccion,
            fotosensible: !!product.fotosensible,
          }
        : null,
    };

    const response = await apiClient.put(ENDPOINT, payload);
    return mapProduct(response.data);
  },

  delete: async (id) => {
    const response = await apiClient.delete(`${ENDPOINT}/${id}`);
    return response.data;
  },

  toggleStatus: async (id, estadoActual) => {
    const response = await apiClient.patch(`${ENDPOINT}/${id}/estado`, !estadoActual);
    return response.data;
  },

  getProximosAVencer: async () => {
    const response = await apiClient.get(`${ENDPOINT}/proximos-a-vencer`);
    return response.data || [];
  },

  getLotes: async (productoId) => {
    const response = await apiClient.get(`${ENDPOINT}/${productoId}/lotes`);
    return response.data || [];
  },

  getLotePedidos: async (loteId) => {
    const response = await apiClient.get(`lotes/${loteId}/pedidos`);
    return response.data || [];
  },
};