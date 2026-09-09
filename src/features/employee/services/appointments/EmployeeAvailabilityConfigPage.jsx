import React, { useState, useEffect } from "react";
import { Save, Plus, X } from "lucide-react";
import { availabilityService } from "../../../services/appointments/services/availabilityService";
import { appointmentService } from "../../../services/appointments/services/appointmentService";
import { StatusNotification } from "/src/shared/ui/StatusNotification";

const DAY_NAMES = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  0: "Domingo",
};

const emptyDay = () => ({
  mananaInicio: "08:00",
  mananaFin: "12:00",
  tardeInicio: "14:00",
  tardeFin: "18:00",
});

const apiToScheduleMap = (apiHorarios) => {
  const map = {};
  [0, 1, 2, 3, 4, 5, 6].forEach((d) => (map[d] = null));
  apiHorarios.forEach((h) => {
    map[h.diaSemana] = {
      mananaInicio: h.mananaInicio || "08:00",
      mananaFin: h.mananaFin || "12:00",
      tardeInicio: h.tardeInicio || "14:00",
      tardeFin: h.tardeFin || "18:00",
    };
  });
  return map;
};

const scheduleMapToApi = (map) => {
  return Object.entries(map)
    .filter(([, v]) => v !== null)
    .map(([dia, v]) => ({
      diaSemana: parseInt(dia),
      mananaInicio: v.mananaInicio,
      mananaFin: v.mananaFin,
      tardeInicio: v.tardeInicio,
      tardeFin: v.tardeFin,
    }));
};

export const EmployeeAvailabilityConfigPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [scheduleMap, setScheduleMap] = useState({});
  const [diasNoDisponibles, setDiasNoDisponibles] = useState([]);
  const [newBlock, setNewBlock] = useState({
    fechaInicio: "",
    fechaFin: "",
    motivo: "",
  });
  const [notification, setNotification] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    appointmentService.getDoctors().then(setDoctors);
  }, []);

  useEffect(() => {
    if (!selectedDoctor) return;
    availabilityService.getHorario(selectedDoctor.id).then((horarios) => {
      setScheduleMap(apiToScheduleMap(horarios));
    });
    availabilityService
      .getDiasNoDisponibles(selectedDoctor.id)
      .then(setDiasNoDisponibles);
  }, [selectedDoctor?.id]);

  const toggleDay = (dia) => {
    setScheduleMap((prev) => ({
      ...prev,
      [dia]: prev[dia] ? null : emptyDay(),
    }));
  };

  const handleTimeChange = (dia, campo, valor) => {
    setScheduleMap((prev) => ({
      ...prev,
      [dia]: { ...prev[dia], [campo]: valor },
    }));
  };

  const handleSaveSchedule = async () => {
    if (!selectedDoctor) return;
    setSaving(true);
    try {
      await availabilityService.guardarHorario(
        selectedDoctor.id,
        scheduleMapToApi(scheduleMap),
      );
      setNotification({ message: "Horario guardado exitosamente", type: "success" });
    } catch {
      setNotification({ message: "Error al guardar el horario", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddBloqueo = async () => {
    if (!selectedDoctor || !newBlock.fechaInicio) {
      setNotification({ message: "Seleccione médico y fecha inicio", type: "error" });
      return;
    }
    const fin = newBlock.fechaFin || newBlock.fechaInicio;
    try {
      const created = await availabilityService.agregarDiaNoDisponible(
        selectedDoctor.id,
        newBlock.fechaInicio,
        fin,
        newBlock.motivo,
      );
      setDiasNoDisponibles((prev) => [...prev, created]);
      setNewBlock({ fechaInicio: "", fechaFin: "", motivo: "" });
      setNotification({ message: "Bloqueo agregado correctamente", type: "success" });
    } catch {
      setNotification({ message: "Error al agregar el bloqueo", type: "error" });
    }
  };

  const handleRemoveBloqueo = async (id) => {
    try {
      await availabilityService.eliminarDiaNoDisponible(id);
      setDiasNoDisponibles((prev) => prev.filter((d) => d.id !== id));
      setNotification({ message: "Bloqueo eliminado", type: "success" });
    } catch {
      setNotification({ message: "Error al eliminar el bloqueo", type: "error" });
    }
  };

  const formatFecha = (iso) =>
    new Date(iso + "T12:00:00").toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="bg-gray-50 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-2 py-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">
            Configuración de Disponibilidad
          </h2>

          {/* Selector de médico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Profesional Médico
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={selectedDoctor?.id || ""}
              onChange={(e) => {
                const d = doctors.find((x) => x.id === parseInt(e.target.value));
                setSelectedDoctor(d || null);
              }}
            >
              <option value="">Seleccionar médico</option>
              {doctors.filter((d) => d.estado === true).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} - {d.especialidad}
                </option>
              ))}
            </select>
          </div>

          {/* Horario por día */}
          {selectedDoctor && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-800">
                  Horarios de {selectedDoctor.nombre}
                </h3>
                <button
                  onClick={handleSaveSchedule}
                  disabled={saving}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-1 disabled:opacity-60"
                >
                  <Save size={15} />
                  {saving ? "Guardando..." : "Guardar Horario"}
                </button>
              </div>

              <div className="grid gap-2">
                {[1, 2, 3, 4, 5, 6, 0].map((dia) => (
                  <div key={dia} className="border rounded-lg p-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">
                        {DAY_NAMES[dia]}
                      </h4>
                      <button
                        onClick={() => toggleDay(dia)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          scheduleMap[dia]
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {scheduleMap[dia] ? "Disponible" : "No disponible"}
                      </button>
                    </div>

                    {scheduleMap[dia] && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {/* Mañana */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Mañana
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="time"
                              className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                              value={scheduleMap[dia].mananaInicio}
                              onChange={(e) =>
                                handleTimeChange(dia, "mananaInicio", e.target.value)
                              }
                            />
                            <span className="text-gray-400 text-sm">a</span>
                            <input
                              type="time"
                              className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                              value={scheduleMap[dia].mananaFin}
                              onChange={(e) =>
                                handleTimeChange(dia, "mananaFin", e.target.value)
                              }
                            />
                          </div>
                        </div>
                        {/* Tarde */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Tarde
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="time"
                              className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                              value={scheduleMap[dia].tardeInicio}
                              onChange={(e) =>
                                handleTimeChange(dia, "tardeInicio", e.target.value)
                              }
                            />
                            <span className="text-gray-400 text-sm">a</span>
                            <input
                              type="time"
                              className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                              value={scheduleMap[dia].tardeFin}
                              onChange={(e) =>
                                handleTimeChange(dia, "tardeFin", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bloqueos de fechas */}
          {selectedDoctor && (
            <div className="border-t pt-3">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Días / Rangos No Disponibles
              </h3>

              <div className="bg-gray-50 p-3 rounded-lg mb-3">
                <h4 className="font-medium text-gray-700 mb-2 text-sm">
                  Agregar bloqueo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                      value={newBlock.fechaInicio}
                      onChange={(e) =>
                        setNewBlock((p) => ({ ...p, fechaInicio: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Fecha fin{" "}
                      <span className="text-gray-400">(vaciar = mismo día)</span>
                    </label>
                    <input
                      type="date"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                      value={newBlock.fechaFin}
                      min={newBlock.fechaInicio}
                      onChange={(e) =>
                        setNewBlock((p) => ({ ...p, fechaFin: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Motivo (opcional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                      placeholder="Vacaciones, Incapacidad..."
                      value={newBlock.motivo}
                      onChange={(e) =>
                        setNewBlock((p) => ({ ...p, motivo: e.target.value }))
                      }
                    />
                  </div>
                  <button
                    onClick={handleAddBloqueo}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <Plus size={15} /> Agregar
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {diasNoDisponibles.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-3">
                    No hay bloqueos registrados para este médico
                  </p>
                ) : (
                  diasNoDisponibles.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-2.5 bg-red-50 border border-red-100 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-red-800 text-sm">
                          {d.fechaInicio === d.fechaFin
                            ? formatFecha(d.fechaInicio)
                            : `${formatFecha(d.fechaInicio)} → ${formatFecha(d.fechaFin)}`}
                        </div>
                        {d.motivo && (
                          <div className="text-xs text-red-500">{d.motivo}</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveBloqueo(d.id)}
                        className="text-red-400 hover:text-red-700 p-1"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {notification && (
        <StatusNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default EmployeeAvailabilityConfigPage;
