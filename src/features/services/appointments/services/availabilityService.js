import { apiClient } from "../../../../shared/utils/apiClient";

const BASE = "Disponibilidad";

export const availabilityService = {

  // --- HORARIO ---
  getHorario: async (medicoId) => {
    const res = await apiClient.get(`${BASE}/horario/${medicoId}`);
    return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  },

  guardarHorario: async (medicoId, horarios) => {
    await apiClient.post(`${BASE}/horario`, { medicoId, horarios });
  },

  // --- SLOTS ---
  // Devuelve array de strings: ["08:00", "08:30", ...]
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

  // --- DÍAS NO DISPONIBLES ---
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

  // Verifica si una fecha cae en algún bloqueo del médico
  // (útil para el CalendarPicker — se llama con los días ya cargados)
  esFechaBloqueada: (diasNoDisponibles, fecha) => {
    return diasNoDisponibles.some((d) => {
      return fecha >= d.fechaInicio && fecha <= d.fechaFin;
    });
  },
};