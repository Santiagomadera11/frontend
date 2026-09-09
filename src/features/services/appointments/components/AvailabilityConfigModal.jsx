import React, { useState, useEffect } from "react";
import { X, Save, Calendar, Clock, Plus, Trash2 } from "lucide-react";

const AvailabilityConfigModal = ({
  isOpen,
  onClose,
  onSave,
  doctors,
  availability,
  availabilityService,
}) => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorSchedule, setDoctorSchedule] = useState({
    monday: {
      morning: { start: "08:00", end: "12:00" },
      afternoon: { start: "14:00", end: "18:00" },
    },
    tuesday: {
      morning: { start: "08:00", end: "12:00" },
      afternoon: { start: "14:00", end: "18:00" },
    },
    wednesday: {
      morning: { start: "08:00", end: "12:00" },
      afternoon: { start: "14:00", end: "18:00" },
    },
    thursday: {
      morning: { start: "08:00", end: "12:00" },
      afternoon: { start: "14:00", end: "18:00" },
    },
    friday: {
      morning: { start: "08:00", end: "12:00" },
      afternoon: { start: "14:00", end: "18:00" },
    },
    saturday: null,
    sunday: null,
  });

  const [newUnavailableDay, setNewUnavailableDay] = useState({
    date: "",
    reason: "",
  });

  useEffect(() => {
    if (selectedDoctor) {
      const existingAvailability = availability.find(
        (a) => a.doctorId === selectedDoctor.id,
      );
      if (existingAvailability) {
        setDoctorSchedule(existingAvailability.schedule);
      } else {
        // Reset to default
        setDoctorSchedule({
          monday: {
            morning: { start: "08:00", end: "12:00" },
            afternoon: { start: "14:00", end: "18:00" },
          },
          tuesday: {
            morning: { start: "08:00", end: "12:00" },
            afternoon: { start: "14:00", end: "18:00" },
          },
          wednesday: {
            morning: { start: "08:00", end: "12:00" },
            afternoon: { start: "14:00", end: "18:00" },
          },
          thursday: {
            morning: { start: "08:00", end: "12:00" },
            afternoon: { start: "14:00", end: "18:00" },
          },
          friday: {
            morning: { start: "08:00", end: "12:00" },
            afternoon: { start: "14:00", end: "18:00" },
          },
          saturday: null,
          sunday: null,
        });
      }
    }
  }, [selectedDoctor, availability]);

  const handleScheduleChange = (day, period, field, value) => {
    setDoctorSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [period]: {
          ...prev[day]?.[period],
          [field]: value,
        },
      },
    }));
  };

  const toggleDayAvailability = (day) => {
    setDoctorSchedule((prev) => ({
      ...prev,
      [day]: prev[day]
        ? null
        : {
            morning: { start: "08:00", end: "12:00" },
            afternoon: { start: "14:00", end: "18:00" },
          },
    }));
  };

  const handleSaveSchedule = () => {
    if (!selectedDoctor) return;

    availabilityService.updateAvailability(selectedDoctor.id, doctorSchedule);
    alert("Horario guardado exitosamente");
  };

  const handleAddUnavailableDay = () => {
    if (!newUnavailableDay.date) {
      alert("Por favor seleccione una fecha");
      return;
    }

    availabilityService.addUnavailableDay(
      newUnavailableDay.date,
      newUnavailableDay.reason,
    );
    setNewUnavailableDay({ date: "", reason: "" });
    alert("Día no disponible agregado");
  };

  const dayNames = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Configuración de Disponibilidad
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-8">
          {/* Selección de Médico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Profesional Médico
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300"
              value={selectedDoctor?.id || ""}
              onChange={(e) => {
                const doctor = doctors.find(
                  (d) => d.id === parseInt(e.target.value),
                );
                setSelectedDoctor(doctor);
              }}
            >
              <option value="">Seleccionar médico</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.nombre} - {doctor.especialidad}
                </option>
              ))}
            </select>
          </div>

          {/* Configuración de Horarios */}
          {selectedDoctor && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Horarios de {selectedDoctor.nombre}
              </h3>

              <div className="grid gap-4">
                {Object.entries(dayNames).map(([dayKey, dayName]) => (
                  <div key={dayKey} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-800">{dayName}</h4>
                      <button
                        onClick={() => toggleDayAvailability(dayKey)}
                        className={`px-3 py-1 rounded text-sm ${
                          doctorSchedule[dayKey]
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {doctorSchedule[dayKey]
                          ? "Disponible"
                          : "No disponible"}
                      </button>
                    </div>

                    {doctorSchedule[dayKey] && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Jornada Mañana */}
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Jornada Mañana
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="time"
                              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
                              value={
                                doctorSchedule[dayKey].morning?.start || ""
                              }
                              onChange={(e) =>
                                handleScheduleChange(
                                  dayKey,
                                  "morning",
                                  "start",
                                  e.target.value,
                                )
                              }
                            />
                            <span className="text-gray-500">-</span>
                            <input
                              type="time"
                              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
                              value={doctorSchedule[dayKey].morning?.end || ""}
                              onChange={(e) =>
                                handleScheduleChange(
                                  dayKey,
                                  "morning",
                                  "end",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>

                        {/* Jornada Tarde */}
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Jornada Tarde
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="time"
                              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
                              value={
                                doctorSchedule[dayKey].afternoon?.start || ""
                              }
                              onChange={(e) =>
                                handleScheduleChange(
                                  dayKey,
                                  "afternoon",
                                  "start",
                                  e.target.value,
                                )
                              }
                            />
                            <span className="text-gray-500">-</span>
                            <input
                              type="time"
                              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
                              value={
                                doctorSchedule[dayKey].afternoon?.end || ""
                              }
                              onChange={(e) =>
                                handleScheduleChange(
                                  dayKey,
                                  "afternoon",
                                  "end",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveSchedule}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Save size={16} className="inline mr-2" />
                  Guardar Horarios
                </button>
              </div>
            </div>
          )}

          {/* Días No Disponibles */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Días No Disponibles
            </h3>

            {/* Agregar nuevo día no disponible */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-gray-700 mb-3">
                Agregar Día No Disponible
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300"
                    value={newUnavailableDay.date}
                    onChange={(e) =>
                      setNewUnavailableDay({
                        ...newUnavailableDay,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Motivo (opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300"
                    placeholder="Ej: Vacaciones, Enfermedad..."
                    value={newUnavailableDay.reason}
                    onChange={(e) =>
                      setNewUnavailableDay({
                        ...newUnavailableDay,
                        reason: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAddUnavailableDay}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus size={16} className="inline mr-2" />
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de días no disponibles */}
            <div className="space-y-2">
              {availabilityService.getUnavailableDays().map((day) => (
                <div
                  key={day.id}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-red-800">
                      {new Date(day.date).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    {day.reason && (
                      <div className="text-sm text-red-600">{day.reason}</div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      availabilityService.removeUnavailableDay(day.id);
                      alert("Día removido de la lista");
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-6 border-t mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityConfigModal;
