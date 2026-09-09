import { useState, useEffect, useCallback } from "react";
import { returnService } from "../services/returnService";

export const useReturns = () => {
  const [devoluciones, setDevoluciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await returnService.getAll();
      setDevoluciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando devoluciones:", err);
      setError(err.response?.data?.message || "Error al cargar devoluciones");
      setDevoluciones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVenta = useCallback(async (ventaId) => {
    try {
      const data = await returnService.getVenta(ventaId);
      return data;
    } catch (err) {
      console.error("Error cargando venta:", err);
      throw new Error(err.response?.data?.message || "Error al cargar la venta");
    }
  }, []);

  const crearDevolucion = useCallback(async (dto) => {
    try {
      const data = await returnService.create(dto);
      await fetchAll();
      return data;
    } catch (err) {
      console.error("Error creando devolución:", err);
      throw new Error(err.response?.data?.message || "Error al crear la devolución");
    }
  }, [fetchAll]);

  const gestionarDevolucion = useCallback(async (id, dto) => {
    try {
      const data = await returnService.gestionar(id, dto);
      await fetchAll();
      return data;
    } catch (err) {
      console.error("Error gestionando devolución:", err);
      throw new Error(err.response?.data?.message || "Error al gestionar la devolución");
    }
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    devoluciones,
    loading,
    error,
    fetchAll,
    fetchVenta,
    crearDevolucion,
    gestionarDevolucion,
  };
};
