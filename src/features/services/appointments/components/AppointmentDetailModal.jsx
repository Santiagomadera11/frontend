import React from "react";
import {
  X,
  User,
  Phone,
  Calendar,
  Clock,
  FileText,
  Stethoscope,
  CheckCircle,
  Clock as ClockIcon,
  XCircle,
} from "lucide-react";

const AppointmentDetailModal = ({ isOpen, onClose, appointment, doctors = [] }) => {
  if (!isOpen || !appointment) return null;

  const doctorId = appointment.doctorId || appointment.medicoId;
  const doctor = doctors.find((d) => d.id === doctorId);

  const getStatusColor = (estadoRaw) => {
    const estado = (estadoRaw || "").toLowerCase();
    if (estado.includes("confirmada") || estado.includes("confirmar")) return "bg-green-100 text-green-700";
    if (estado.includes("consulta")) return "bg-blue-100 text-blue-700";
    if (estado.includes("completada")) return "bg-green-100 text-green-700";
    if (estado.includes("no asistio") || estado.includes("no asistió")) return "bg-red-100 text-red-700";
    if (estado.includes("cancelada")) return "bg-gray-100 text-gray-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const getStatusIcon = (estadoRaw) => {
    const estado = (estadoRaw || "").toLowerCase();
    if (estado.includes("confirmada") || estado.includes("completada")) return <CheckCircle size={16} />;
    if (estado.includes("consulta")) return <ClockIcon size={16} />;
    if (estado.includes("cancelada") || estado.includes("no asistio") || estado.includes("no asistió")) return <XCircle size={16} />;
    return <Clock size={16} />;
  };

  const currentEstado = appointment.estado || appointment.estadoNombre || "Confirmar Asistencia";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header Verde */}
        <div className="bg-green-50 border-b border-green-200 px-6 py-4 flex items-center justify-between sticky top-0">
          <h2 className="text-lg font-bold text-gray-800">Detalle de Cita</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          {/* Estado de la cita */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Estado:</span>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentEstado)}`}
            >
              {getStatusIcon(currentEstado)}
              {currentEstado}
            </span>
          </div>

          {/* Información del Paciente */}
          <div className="border-t pt-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User size={18} />
              Información del Paciente
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Nombre:
                </span>
                <p className="text-gray-900">{appointment.paciente || appointment.pacienteNombre}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Documento:
                </span>
                <p className="text-gray-900">{appointment.documento || appointment.pacienteDocumento}</p>
              </div>
              {(appointment.telefono || appointment.pacienteTelefono) && (
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    Teléfono:
                  </span>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Phone size={14} />
                    {appointment.telefono || appointment.pacienteTelefono}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Información de la Cita */}
          <div className="border-t pt-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Stethoscope size={18} />
              Información de la Cita
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Profesional:
                </span>
                <p className="text-gray-900">
                  {doctor?.nombre || appointment.medicoNombre || "Médico"} - {doctor?.especialidad || doctor?.especialidad || "General"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Fecha:
                </span>
                <p className="text-gray-900 flex items-center gap-2">
                  <Calendar size={14} />
                  {appointment.fecha ? new Date(appointment.fecha).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) : "-"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Hora:</span>
                <p className="text-gray-900 flex items-center gap-2">
                  <Clock size={14} />
                  {appointment.hora}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Servicio:
                </span>
                <p className="text-gray-900">{appointment.servicio || appointment.servicioNombre || "Consulta Médica"}</p>
              </div>
            </div>
          </div>

          {/* Notas */}
          {appointment.notas && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <FileText size={14} />
                Notas
              </h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded text-sm">
                {appointment.notas}
              </p>
            </div>
          )}

          {/* Fecha de creación */}
          {appointment.fechaCreacion && (
            <div className="border-t pt-4">
              <div className="text-xs text-gray-500">
                Cita creada el:{" "}
                {new Date(appointment.fechaCreacion).toLocaleString("es-ES")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailModal;
