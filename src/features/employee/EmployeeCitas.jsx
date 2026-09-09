import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Eye,
  Edit,
} from "lucide-react";
import { appointmentService } from "../services/appointments/services/appointmentService";
import AppointmentFormModal from "../services/appointments/components/AppointmentFormModal";

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
};

export const EmployeeCitas = () => {
  const [periodFilter, setPeriodFilter] = useState("dia");
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const isMountedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const loadAppointments = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      setLoading(true);
      const data = await appointmentService.getAppointments();
      if (!isMountedRef.current) return;
      setAllAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando citas:", error);
      if (isMountedRef.current) setAllAppointments([]);
    } finally {
      if (isMountedRef.current) setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  const loadDoctors = useCallback(async () => {
    try {
      const { apiClient } = await import("../../shared/utils/apiClient");
      const response = await apiClient.get("Medico");
      const raw = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];
      if (!isMountedRef.current) return;
      setDoctors(raw);
    } catch (error) {
      console.error("Error cargando médicos:", error);
      if (isMountedRef.current) setDoctors([]);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadAppointments();
    loadDoctors();
    window.addEventListener("appointments:changed", loadAppointments);
    return () => {
      isMountedRef.current = false;
      isLoadingRef.current = false;
      window.removeEventListener("appointments:changed", loadAppointments);
    };
  }, [loadAppointments, loadDoctors]);

  const getPeriodStartDate = (period) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (period === "dia") return today;
    if (period === "semana") {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(today.setDate(diff));
    }
    if (period === "mes")
      return new Date(today.getFullYear(), today.getMonth(), 1);
  };

  const filteredAppointments = useMemo(() => {
    const periodStart = getPeriodStartDate(periodFilter);
    const today = new Date();

    return allAppointments.filter((apt) => {
      const aptDate = parseLocalDate(apt.fecha);
      if (!aptDate) return false;
      aptDate.setHours(0, 0, 0, 0);

      if (periodFilter === "dia") {
        const todayNormalized = new Date();
        todayNormalized.setHours(0, 0, 0, 0);
        return aptDate.getTime() === todayNormalized.getTime();
      }
      if (periodFilter === "semana") {
        const endOfWeek = new Date(periodStart);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return aptDate >= periodStart && aptDate <= endOfWeek;
      }
      if (periodFilter === "mes") {
        return (
          aptDate.getFullYear() === today.getFullYear() &&
          aptDate.getMonth() === today.getMonth()
        );
      }
      return false;
    });
  }, [allAppointments, periodFilter]);

  const totalAppointments = filteredAppointments.length;
  const completedAppointments = useMemo(
    () => filteredAppointments.filter((a) => a.estado === "Completada").length,
    [filteredAppointments]
  );
  const pendingAppointments = useMemo(
    () =>
      filteredAppointments.filter((a) => a.estado === "Confirmar Asistencia")
        .length,
    [filteredAppointments]
  );

  const handleViewDetail = (apt) => {
    setSelectedAppointment(apt);
    setIsDetailModalOpen(true);
  };

  const handleOpenEdit = (apt) => {
    setEditingAppointment(apt);
    setIsEditModalOpen(true);
  };

  const periodLabels = {
    dia: "del día",
    semana: "de la semana",
    mes: "del mes",
  };

  return (
    <div className="h-full flex flex-col gap-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            Gestión de Citas
          </h2>
          <p className="text-gray-500 font-medium">Vista del Empleado</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-2xl border border-gray-200">
          {[
            { value: "dia", label: "Día", icon: Clock },
            { value: "semana", label: "Semana", icon: CalendarIcon },
            { value: "mes", label: "Mes", icon: CalendarIcon },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriodFilter(option.value)}
              className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${
                periodFilter === option.value
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-transparent text-gray-600 hover:bg-gray-100"
              }`}
            >
              <option.icon size={18} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-2xl">
              <CalendarIcon size={22} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">
              Citas {periodLabels[periodFilter]}
            </h3>
          </div>
          <div className="text-4xl font-black text-gray-900">
            {totalAppointments}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-2xl">
              <CheckCircle size={22} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">
              Completadas
            </h3>
          </div>
          <div className="text-4xl font-black text-green-600">
            {completedAppointments}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {totalAppointments > 0
              ? `${Math.round(
                  (completedAppointments / totalAppointments) * 100
                )}% completado`
              : "Sin citas"}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
              <Clock size={22} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">
              Por confirmar
            </h3>
          </div>
          <div className="text-4xl font-black text-amber-600">
            {pendingAppointments}
          </div>
        </div>
      </div>

      {/* Listado */}
      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="font-black text-gray-800">
            Citas {periodLabels[periodFilter]}
          </h3>
          <div className="text-xs text-gray-400 font-medium">
            {filteredAppointments.length} registro(s)
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Cargando citas...
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {[
                    "Paciente",
                    "Médico",
                    "Fecha",
                    "Hora",
                    "Servicio",
                    "Estado",
                    "Acciones",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{apt.paciente}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {apt.medicoNombre || `Médico #${apt.doctorId}`}
                    </td>
                    <td className="px-6 py-4">{apt.fecha}</td>
                    <td className="px-6 py-4 font-medium">{apt.hora}</td>
                    <td className="px-6 py-4 text-gray-600">{apt.servicio}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                          apt.estado === "Completada"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : apt.estado === "Confirmar Asistencia"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : apt.estado === "Cancelada"
                            ? "bg-red-50 text-red-700 border-red-100"
                            : "bg-blue-50 text-blue-700 border-blue-100"
                        }`}
                      >
                        {apt.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {/* Ver detalle */}
                        <button
                          onClick={() => handleViewDetail(apt)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </button>
                        {/* Editar */}
                        <button
                          onClick={() => handleOpenEdit(apt)}
                          className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        {/* Cambiar estado */}
                        <StatusMenuButton appointment={apt} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 py-12">
            No hay citas {periodLabels[periodFilter]}
          </div>
        )}
      </div>

      {/* Modal Editar */}
      <AppointmentFormModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingAppointment(null); }}
        onSave={() => { loadAppointments(); setIsEditModalOpen(false); }}
        appointment={editingAppointment}
        doctors={doctors}
      />

      {/* Modal Ver Detalle */}
      {isDetailModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between border-b border-blue-100 bg-blue-50">
              <h2 className="text-lg font-semibold text-blue-900">
                Detalle de Cita
              </h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 hover:bg-blue-100 rounded-lg text-blue-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Paciente", value: selectedAppointment.paciente },
                { label: "Documento", value: selectedAppointment.documento },
                { label: "Teléfono", value: selectedAppointment.telefono },
                {
                  label: "Médico",
                  value:
                    selectedAppointment.medicoNombre ||
                    `Médico #${selectedAppointment.doctorId}`,
                },
                { label: "Fecha", value: selectedAppointment.fecha },
                { label: "Hora", value: selectedAppointment.hora },
                { label: "Servicio", value: selectedAppointment.servicio },
                { label: "Costo", value: selectedAppointment.precio ? `$${selectedAppointment.precio}` : null },
                { label: "Estado", value: selectedAppointment.estado },
                { label: "Notas", value: selectedAppointment.notas },
              ]
                .filter(({ value }) => value)
                .map(({ label, value }) => (
                  <div key={label}>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-0.5">
                      {label}
                    </label>
                    <p className="text-sm text-gray-900 font-medium">{value}</p>
                  </div>
                ))}
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeCitas;

// ── Status Menu Button ─────────────────────────────────────────────────────────
const STATUSES = [
  "Confirmar Asistencia",
  "Confirmada",
  "Completada",
  "Cancelada",
  "No asistió",
];

const StatusMenuButton = ({ appointment }) => {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const changeStatus = async (status) => {
    setOpen(false);
    setUpdating(true);
    try {
      await appointmentService.updateAppointmentStatus(appointment.id, status);
      window.dispatchEvent(new Event("appointments:changed"));
    } catch (error) {
      console.error("Error actualizando estado:", error);
      alert(`No se pudo cambiar el estado: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={updating}
        className={`p-1.5 rounded-md transition-all ${
          updating
            ? "text-gray-400 cursor-wait"
            : "text-blue-600 hover:bg-blue-50"
        }`}
        title="Cambiar estado"
      >
        <CheckCircle size={16} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 py-2">
          <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 mb-1">
            Cambiar estado
          </div>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                appointment.estado === s ? "font-black text-blue-600" : ""
              }`}
            >
              {appointment.estado === s ? `✓ ${s}` : s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};