import { apiClient } from "../../../../shared/utils/apiClient";

const BASE = "Disponibilidad";

export const availabilityService = {

  getHorario: async (medicoId) => {
    const res = await apiClient.get(`${BASE}/horario/${medicoId}`);
    return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  },

  guardarHorario: async (medicoId, horarios) => {
    await apiClient.post(`${BASE}/horario`, { medicoId, horarios });
  },

  getSlots: async (medicoId, fecha) => {
    try {
      const res = await apiClient.get(`${BASE}/slots/${medicoId}`, {
        params: { fecha },
      });
      return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  getDiasNoDisponibles: async (medicoId) => {
    const res = await apiClient.get(`${BASE}/dias-no-disponibles/${medicoId}`);
    return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  },

  agregarDiaNoDisponible: async (medicoId, fechaInicio, fechaFin, motivo) => {
    const res = await apiClient.post(`${BASE}/dias-no-disponibles`, {
      medicoId,
      fechaInicio,
      fechaFin,
      motivo: motivo || null,
    });
    return res.data || res;
  },

  eliminarDiaNoDisponible: async (id) => {
    await apiClient.delete(`${BASE}/dias-no-disponibles/${id}`);
  },

  esFechaBloqueada: (diasNoDisponibles, fecha) => {
    return diasNoDisponibles.some((d) => {
      return fecha >= d.fechaInicio && fecha <= d.fechaFin;
    });
  },
};