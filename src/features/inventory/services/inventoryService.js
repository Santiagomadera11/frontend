import { productService } from '../products/services/productService';

/**
 * Servicio de Inventario con lógica FEFO (First Expired, First Out)
 * Maneja descuentos de stock desde lotes y valida disponibilidad
 */
export const inventoryService = {
  
  /**
   * Valida si hay suficiente stock disponible para todos los productos
   * @param {Array} items - Array de {productId, cantidad}
   * @returns {Object} { isValid: boolean, message: string, unavailable: Array }
   */
  validateStockAvailable: (items) => {
    const unavailable = [];
    
    items.forEach(item => {
      const product = productService.getById(item.productId);
      if (!product) {
        unavailable.push({ 
          productId: item.productId, 
          nombre: 'Desconocido',
          requerido: item.cantidad,
          disponible: 0 
        });
        return;
      }
      
      const disponible = product.stock || product.existencia || 0;
      if (disponible < item.cantidad) {
        unavailable.push({
          productId: item.productId,
          nombre: product.nombre,
          requerido: item.cantidad,
          disponible: disponible
        });
      }
    });
    
    return {
      isValid: unavailable.length === 0,
      message: unavailable.length === 0 
        ? 'Stock disponible'
        : `Stock insuficiente: ${unavailable.map(u => `${u.nombre} (requiere ${u.requerido}, disponible ${u.disponible})`).join('; ')}`,
      unavailable: unavailable
    };
  },

  /**
   * Descuenta stock usando lógica FEFO (First Expired, First Out)
   * Los lotes que vencen primero se usan primero
   * @param {number} productId - ID del producto
   * @param {number} cantidad - Cantidad a descontar
   * @returns {Object} { success: boolean, message: string, lotesUsados: Array }
   */
  deductStockFEFO: (productId, cantidad) => {
    const product = productService.getById(productId);
    
    if (!product) {
      return {
        success: false,
        message: `Producto ${productId} no encontrado`,
        lotesUsados: []
      };
    }

    const disponible = product.stock || product.existencia || 0;
    if (disponible < cantidad) {
      return {
        success: false,
        message: `Stock insuficiente: disponible ${disponible}, requerido ${cantidad}`,
        lotesUsados: []
      };
    }

    // Si no tiene lotes, solo restar del stock total (para productos sin sistema de lotes)
    if (!product.lotes || product.lotes.length === 0) {
      const nuevoStock = disponible - cantidad;
      productService.update({
        ...product,
        stock: nuevoStock,
        existencia: nuevoStock
      });
      
      return {
        success: true,
        message: `Stock descuentado correctamente`,
        lotesUsados: [{
          numeroLote: 'SIN-LOTE',
          cantidadUsada: cantidad
        }]
      };
    }

    // Ordenar lotes por fecha de vencimiento (FEFO)
    // Los que vencen antes deben usarse primero
    const lotesOrdenados = [...product.lotes].sort((a, b) => {
      const fechaA = new Date(a.fechaVence);
      const fechaB = new Date(b.fechaVence);
      return fechaA - fechaB;
    });

    let cantidadPorDescontar = cantidad;
    const lotesUsados = [];
    const lotesActualizados = [...product.lotes];

    // Descontar de cada lote en orden FEFO
    for (let i = 0; i < lotesOrdenados.length && cantidadPorDescontar > 0; i++) {
      const lote = lotesOrdenados[i];
      const cantidadDisponibleEnLote = lote.cantidad || 0;
      
      if (cantidadDisponibleEnLote <= 0) continue;

      const cantidadAUsar = Math.min(cantidadDisponibleEnLote, cantidadPorDescontar);
      
      // Registrar uso del lote
      lotesUsados.push({
        idLote: lote.idLote,
        numeroLote: lote.numeroLote,
        fechaVence: lote.fechaVence,
        cantidadUsada: cantidadAUsar
      });

      // Actualizar cantidad en el lote
      const loteIndex = lotesActualizados.findIndex(l => l.idLote === lote.idLote);
      if (loteIndex >= 0) {
        lotesActualizados[loteIndex] = {
          ...lotesActualizados[loteIndex],
          cantidad: cantidadDisponibleEnLote - cantidadAUsar
        };

        // Si el lote se agota, eliminarlo
        if (lotesActualizados[loteIndex].cantidad <= 0) {
          lotesActualizados.splice(loteIndex, 1);
        }
      }

      cantidadPorDescontar -= cantidadAUsar;
    }

    // Validar que se haya descontado toda la cantidad
    if (cantidadPorDescontar > 0) {
      return {
        success: false,
        message: `No hay suficientes lotes disponibles para descontar ${cantidad} unidades`,
        lotesUsados: []
      };
    }

    // Actualizar producto con nuevos lotes y stock
    const nuevoStock = disponible - cantidad;
    productService.update({
      ...product,
      stock: nuevoStock,
      existencia: nuevoStock,
      lotes: lotesActualizados
    });

    // Disparar evento de cambio de productos
    window.dispatchEvent(new CustomEvent('products:changed'));

    return {
      success: true,
      message: `Stock descuentado correctamente (${cantidad} unidades)`,
      lotesUsados: lotesUsados,
      stockRestante: nuevoStock
    };
  },

  /**
   * Descuenta stock de múltiples productos (para pedidos/ventas)
   * @param {Array} items - Array de {productId, cantidad}
   * @returns {Object} { success: boolean, message: string, detalles: Array }
   */
  deductMultipleProductsFEFO: (items) => {
    // Primero validar que hay stock suficiente
    const validation = inventoryService.validateStockAvailable(items);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message,
        detalles: validation.unavailable
      };
    }

    const detalles = [];
    let conErrores = false;

    // Descontar cada producto
    items.forEach(item => {
      const resultado = inventoryService.deductStockFEFO(item.productId, item.cantidad);
      detalles.push({
        productId: item.productId,
        cantidad: item.cantidad,
        ...resultado
      });

      if (!resultado.success) {
        conErrores = true;
      }
    });

    return {
      success: !conErrores,
      message: conErrores 
        ? 'Hubo errores al descontar algunos productos'
        : 'Stock descuentado correctamente para todos los productos',
      detalles: detalles
    };
  },

  /**
   * Devuelve stock de un producto (para cancelaciones)
   * @param {number} productId - ID del producto
   * @param {number} cantidad - Cantidad a devolver
   * @param {Object} loteInfo - Información del lote original (opcional)
   * @returns {Object} { success: boolean, message: string }
   */
  returnStock: (productId, cantidad, loteInfo = null) => {
    const product = productService.getById(productId);
    
    if (!product) {
      return {
        success: false,
        message: `Producto ${productId} no encontrado`
      };
    }

    const nuevoStock = (product.stock || product.existencia || 0) + cantidad;
    const lotes = product.lotes || [];

    // Si hay info del lote original, restaurarlo
    if (loteInfo && loteInfo.numeroLote) {
      const loteIndex = lotes.findIndex(l => l.numeroLote === loteInfo.numeroLote);
      
      if (loteIndex >= 0) {
        lotes[loteIndex] = {
          ...lotes[loteIndex],
          cantidad: (lotes[loteIndex].cantidad || 0) + cantidad
        };
      } else {
        // Si el lote no existe, crearlo
        lotes.push({
          idLote: Date.now() + Math.random(),
          numeroLote: loteInfo.numeroLote,
          fechaVence: loteInfo.fechaVence || '2030-12-31',
          cantidad: cantidad,
          fechaIngreso: new Date().toISOString().split('T')[0],
          costUnit: loteInfo.costUnit || 0,
          iva: loteInfo.iva || 0,
          notas: 'Devuelto por cancelación'
        });
      }
    }

    productService.update({
      ...product,
      stock: nuevoStock,
      existencia: nuevoStock,
      lotes: lotes
    });

    window.dispatchEvent(new CustomEvent('products:changed'));

    return {
      success: true,
      message: `${cantidad} unidades devueltas al inventario`
    };
  }
};
