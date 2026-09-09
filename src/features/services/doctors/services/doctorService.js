import { apiClient } from "../../../../shared/utils/apiClient";

const ENDPOINT = "Medico";

const parseDias = (diasStr) => {
  try { return diasStr ? JSON.parse(diasStr) : [1, 2, 3, 4, 5]; }
  catch { return [1, 2, 3, 4, 5]; }
};

const mapDoctor = (m) => ({
  ...m,
  diasLaborales: parseDias(m.diasLaborales),
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.nombre || m.id)}`,
});

export const doctorService = {
  getAll: async () => {
    const res = await apiClient.get(ENDPOINT);
    return res.data.map(mapDoctor);
  },

  getById: async (id) => {
    const res = await apiClient.get(`${ENDPOINT}/${id}`);
    return mapDoctor(res.data);
  },

  create: async (doctorData) => {
    const payload = {
      nombre: doctorData.nombre,
      especialidad: doctorData.especialidad || null,
      documento: doctorData.documento || null,
      email: doctorData.email || null,
      telefono: doctorData.telefono || null,
      diasLaborales: JSON.stringify(doctorData.diasLaborales || [1, 2, 3, 4, 5]),
      horaInicio: doctorData.horaInicio || "08:00",
      horaFin: doctorData.horaFin || "17:00",
      intervalo: doctorData.intervalo || 30,
    };
    const res = await apiClient.post(ENDPOINT, payload);
    return mapDoctor(res.data);
  },

  update: async (doctorData) => {
    const payload = {
      id: doctorData.id,
      nombre: doctorData.nombre,
      especialidad: doctorData.especialidad || null,
      documento: doctorData.documento || null,
      email: doctorData.email || null,
      telefono: doctorData.telefono || null,
      diasLaborales: JSON.stringify(doctorData.diasLaborales || [1, 2, 3, 4, 5]),
      horaInicio: doctorData.horaInicio || "08:00",
      horaFin: doctorData.horaFin || "17:00",
      intervalo: doctorData.intervalo || 30,
    };
    const res = await apiClient.put(ENDPOINT, payload);
    return mapDoctor(res.data);
  },

  delete: async (id) => {
  try {
    await apiClient.delete(`${ENDPOINT}/${id}`);
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      "Error al eliminar médico";
    throw new Error(message);
  }
},

  toggleStatus: async (id, estadoActual) => {
    await apiClient.patch(`${ENDPOINT}/${id}/estado`, !estadoActual);
  },

  getActive: async () => {
    const all = await doctorService.getAll();
    return all.filter((d) => d.estado);
  },
};