import { apiClient } from "../../../../shared/utils/apiClient";

const APPOINTMENTS_ENDPOINT = "Cita";
const DOCTORS_ENDPOINT = "Medico";

// IDs reales de la tabla estados_cita
const STATUS_MAP = {
  "Confirmar Asistencia": 1,
  "Confirmada": 2,
  "Completada": 3,
  "Cancelada": 4,
  "No Asistió": 5,
  "No asistió": 5,
};

// Mapear estructura del frontend a la API
const mapToApiFormat = (appointmentData) => {
  const currentUser = JSON.parse(sessionStorage.getItem("syspharma_user") || "{}");

  return {
    medicoId: appointmentData.doctorId,
    pacienteNombre: appointmentData.paciente,
    pacienteDocumento: appointmentData.documento,
    pacienteTelefono: appointmentData.telefono,
    pacienteEmail: appointmentData.email,
    fecha: appointmentData.fecha,
    hora: appointmentData.hora,
    servicioId: appointmentData.servicioId ? parseInt(appointmentData.servicioId, 10) : null,
    servicioNombre: appointmentData.servicio || "Consulta",
    precio: appointmentData.precio || 0,
    notas: appointmentData.notas,
    estadoId: appointmentData.estadoId || 1,
    usuarioId: appointmentData.userId || currentUser?.id,
    pedidoId: appointmentData.pedidoId || null,
    ventaId: appointmentData.ventaId || null,
  };
};

// Mapear estructura de la API a lo que espera el frontend
const mapFromApiFormat = (apiData) => ({
  id: apiData.id,
  doctorId: apiData.medicoId,
  medicoNombre: apiData.medicoNombre || apiData.medico?.nombre,
  paciente: apiData.pacienteNombre,
  pacienteNombre: apiData.pacienteNombre,
  documento: apiData.pacienteDocumento,
  telefono: apiData.pacienteTelefono,
  email: apiData.pacienteEmail,
  fecha: apiData.fecha,
  hora: apiData.hora,
  servicio: apiData.servicioNombre,
  servicioNombre: apiData.servicioNombre,
  servicioId: apiData.servicioId,
  precio: apiData.precio,
  notas: apiData.notas,
  estadoId: apiData.estadoId,
  estado: apiData.estadoNombre || apiData.estado,
  estadoNombre: apiData.estadoNombre || apiData.estado,
  pedidoId: apiData.pedidoId,
  ventaId: apiData.ventaId,
});

export const appointmentService = {
  // --- MÉDICOS ---
  getDoctors: async () => {
    try {
      const res = await apiClient.get(DOCTORS_ENDPOINT);
      const data = Array.isArray(res) ? res : (Array.isArray(res.data) ? res.data : []);
      return data;
    } catch (error) {
      console.error("Error obteniendo médicos:", error);
      return [];
    }
  },

  updateDoctorSchedule: async (doctor) => {
    try {
      const res = await apiClient.put(DOCTORS_ENDPOINT, doctor);
      return res.data;
    } catch (error) {
      console.error("Error actualizando horario del médico:", error);
      throw error;
    }
  },

  // --- CITAS ---
  getAppointments: async () => {
    try {
      const res = await apiClient.get(APPOINTMENTS_ENDPOINT);
      const appointments = Array.isArray(res.data) ? res.data : [];
      return appointments.map(mapFromApiFormat);
    } catch (error) {
      console.error("Error obteniendo citas:", error);
      return [];
    }
  },

  createAppointment: async (appt) => {
    try {
      const currentUser = JSON.parse(sessionStorage.getItem("syspharma_user") || "{}");

      const appointmentData = {
        ...appt,
        paciente: appt.paciente || currentUser.nombre,
        documento: appt.documento || currentUser.documento,
        telefono: appt.telefono || currentUser.telefono,
        email: appt.email || currentUser.email,
      };

      const apiPayload = mapToApiFormat(appointmentData);
      const res = await apiClient.post(APPOINTMENTS_ENDPOINT, apiPayload);

      window.dispatchEvent(new Event("appointments:changed"));
      return mapFromApiFormat(res.data);
    } catch (error) {
      console.error("Error creando cita:", error);
      throw error;
    }
  },

  updateAppointment: async (id, updates) => {
    try {
      const apiPayload = mapToApiFormat(updates);
      const res = await apiClient.put(APPOINTMENTS_ENDPOINT, { id, ...apiPayload });

      window.dispatchEvent(new Event("appointments:changed"));
      return mapFromApiFormat(res.data);
    } catch (error) {
      console.error("Error actualizando cita:", error);
      throw error;
    }
  },

  updateAppointmentStatus: async (id, newStatus) => {
    try {
      const estadoId = typeof newStatus === "string"
        ? STATUS_MAP[newStatus]
        : newStatus;

      if (!estadoId) throw new Error(`Estado desconocido: ${newStatus}`);

      await apiClient.patch(`${APPOINTMENTS_ENDPOINT}/${id}/estado`, estadoId);
      window.dispatchEvent(new Event("appointments:changed"));
      return true;
    } catch (error) {
      console.error("Error actualizando estado:", error);
      throw error;
    }
  },

  deleteAppointment: async (id) => {
    try {
      await apiClient.delete(`${APPOINTMENTS_ENDPOINT}/${id}`);

      window.dispatchEvent(new Event("appointments:changed"));
      return true;
    } catch (error) {
      console.error("Error eliminando cita:", error);
      throw error;
    }
  },

  cancelAppointment: async (id) => {
    try {
      return await appointmentService.updateAppointmentStatus(id, "Cancelada");
    } catch (error) {
      console.error("Error cancelando cita:", error);
      throw error;
    }
  },

  // --- UTILIDADES ---
  getAppointmentsByDate: async (date) => {
    try {
      const appointments = await appointmentService.getAppointments();
      return appointments.filter((a) => a.fecha === date);
    } catch (error) {
      console.error("Error filtrando citas por fecha:", error);
      return [];
    }
  },

  getAppointmentsByDoctor: async (doctorId) => {
    try {
      const appointments = await appointmentService.getAppointments();
      return appointments.filter((a) => a.doctorId === doctorId);
    } catch (error) {
      console.error("Error filtrando citas por médico:", error);
      return [];
    }
  },

  getAppointmentsByDateAndDoctor: async (date, doctorId) => {
    try {
      const appointments = await appointmentService.getAppointments();
      return appointments.filter((a) => a.fecha === date && a.doctorId === doctorId);
    } catch (error) {
      console.error("Error filtrando citas:", error);
      return [];
    }
  },

  // --- CATÁLOGO DE SERVICIOS ---
  getCatalogServices: async () => {
    try {
      const res = await apiClient.get("Servicio");
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      console.error("Error obteniendo catálogo de servicios:", error);
      return [];
    }
  },
};