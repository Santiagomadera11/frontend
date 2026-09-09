import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AppointmentsCalendarView = ({ doctors = [], availabilityService }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDoctorId, setSelectedDoctorId] = useState(
    doctors.length > 0 ? doctors[0].id : null
  );
  const [diasBloqueados, setDiasBloqueados] = useState([]);
  const [diasConHorario, setDiasConHorario] = useState(new Set());
  const [loadingDias, setLoadingDias] = useState(false);

  // Carga días bloqueados Y horario semanal del médico
  const cargarDisponibilidad = useCallback(async () => {
    if (!selectedDoctorId || !availabilityService) return;
    setLoadingDias(true);
    try {
      const [bloqueados, horario] = await Promise.all([
        availabilityService.getDiasNoDisponibles(selectedDoctorId),
        availabilityService.getHorario(selectedDoctorId),
      ]);

      setDiasBloqueados(Array.isArray(bloqueados) ? bloqueados : []);

      // horario es array de { diaSemana: 0-6 } donde 0=Dom, 1=Lun, etc.
      const diasTrabaja = new Set(
        (Array.isArray(horario) ? horario : []).map((h) => h.diaSemana)
      );
      setDiasConHorario(diasTrabaja);
    } catch {
      setDiasBloqueados([]);
      setDiasConHorario(new Set());
    } finally {
      setLoadingDias(false);
    }
  }, [selectedDoctorId, availabilityService]);

  useEffect(() => {
    cargarDisponibilidad();
  }, [cargarDisponibilidad]);

  // Recarga cuando admin cambia disponibilidad
  useEffect(() => {
    const handleChange = () => cargarDisponibilidad();
    window.addEventListener("availability:changed", handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener("availability:changed", handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, [cargarDisponibilidad]);

  const getDateString = (day) =>
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // Devuelve true si el día NO está disponible
  const isDayUnavailable = (day) => {
    if (!selectedDoctorId) return false;

    const dateStr = getDateString(day);
    const dayOfWeek = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).getDay(); // 0=Dom, 1=Lun, ... 6=Sáb

    // 1. Si el médico tiene horario y no trabaja este día de la semana
    if (diasConHorario.size > 0 && !diasConHorario.has(dayOfWeek)) {
      return true;
    }

    // 2. Si el día está bloqueado explícitamente
    if (
      typeof availabilityService?.esFechaBloqueada === "function" &&
      diasBloqueados.length > 0
    ) {
      return availabilityService.esFechaBloqueada(diasBloqueados, dateStr);
    }

    return false;
  };

  const getDaysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = currentDate.toLocaleString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">

        {/* Selector médico */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Selecciona Médico para ver Disponibilidad:
          </label>
          <select
            value={selectedDoctorId ?? ""}
            onChange={(e) => setSelectedDoctorId(parseInt(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-emerald-400"
          >
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.nombre} — {doctor.especialidad}
              </option>
            ))}
          </select>
        </div>

        {/* Navegación mes */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() =>
              setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
            }
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-gray-800 capitalize flex-1 text-center">
            {loadingDias ? "Cargando..." : monthName}
          </h2>
          <button
            onClick={() =>
              setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
            }
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Leyenda */}
        <div className="flex gap-4 mb-4 p-3 bg-gray-50 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white border-2 border-emerald-300" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>No Disponible</span>
          </div>
        </div>

        {/* Calendario */}
        <div className="grid grid-cols-7 gap-2">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-gray-600 text-xs py-2"
            >
              {day}
            </div>
          ))}
          {days.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;
            const unavailable = isDayUnavailable(day);
            return (
              <div
                key={day}
                className={`aspect-square p-3 rounded-lg border-2 font-bold text-sm flex items-center justify-center transition-all ${
                  unavailable
                    ? "bg-red-500 border-red-600 text-white shadow-sm"
                    : "bg-white border-emerald-300 text-gray-800"
                }`}
                title={unavailable ? "Médico no disponible" : "Disponible"}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AppointmentsCalendarView;