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

const AppointmentDetailModal = ({ isOpen, onClose, appointment, doctors = [], accentColor = "emerald" }) => {
  if (!isOpen || !appointment) return null;

  const accent = accentColor === "blue"
    ? { header: "bg-blue-50 border-blue-200", text: "text-blue-600", iconBg: "bg-blue-100" }
    : { header: "bg-emerald-50 border-emerald-200", text: "text-emerald-600", iconBg: "bg-emerald-100" };

  const doctorId = appointment.doctorId || appointment.medicoId;
  const doctor = doctors.find((d) => d.id === doctorId);

  const getStatusColor = (estadoRaw) => {
    const estado = (estadoRaw || "").toLowerCase();
    if (estado.includes("confirmada") || estado.includes("confirmar")) return "bg-emerald-100 text-emerald-700";
    if (estado.includes("consulta")) return "bg-blue-100 text-blue-700";
    if (estado.includes("completada")) return "bg-emerald-100 text-emerald-700";
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
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className={`${accent.header} border-b px-6 py-4 flex items-center justify-between flex-shrink-0`}>
          <h2 className={`text-lg font-semibold ${accent.text}`}>Detalle de Cita</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Encabezado: paciente + estado */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-lg ${accent.iconBg} ${accent.text} flex-shrink-0`}>
                <User size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900 truncate">{appointment.paciente || appointment.pacienteNombre}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{appointment.documento || appointment.pacienteDocumento || "Sin documento"}</p>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold mt-2 ${getStatusColor(currentEstado)}`}>
                  {getStatusIcon(currentEstado)}
                  {currentEstado}
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-gray-100">
                <div className={`inline-flex p-1.5 rounded-md mb-1.5 ${accent.iconBg} ${accent.text}`}><Calendar size={13} /></div>
                <p className="text-[10px] text-gray-400">Fecha</p>
                <p className="text-xs font-semibold text-gray-900">
                  {appointment.fecha ? new Date(appointment.fecha).toLocaleDateString("es-ES", { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : "-"}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-gray-100">
                <div className={`inline-flex p-1.5 rounded-md mb-1.5 ${accent.iconBg} ${accent.text}`}><Clock size={13} /></div>
                <p className="text-[10px] text-gray-400">Hora</p>
                <p className="text-xs font-semibold text-gray-900">{appointment.hora}</p>
              </div>
              {(appointment.telefono || appointment.pacienteTelefono) && (
                <div className="p-3 rounded-lg border border-gray-100 col-span-2">
                  <div className={`inline-flex p-1.5 rounded-md mb-1.5 ${accent.iconBg} ${accent.text}`}><Phone size={13} /></div>
                  <p className="text-[10px] text-gray-400">Teléfono</p>
                  <p className="text-xs font-semibold text-gray-900">{appointment.telefono || appointment.pacienteTelefono}</p>
                </div>
              )}
            </div>

            {/* Información de la cita */}
            <div className={`rounded-lg border ${accent.header} p-3`}>
              <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${accent.text}`}>
                <Stethoscope size={13} /> Información de la Cita
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-500">Profesional</p>
                  <p className="text-xs font-medium text-gray-900">
                    {doctor?.nombre || appointment.medicoNombre || "Médico"} · {doctor?.especialidad || "General"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-500">Servicio</p>
                  <p className="text-xs font-medium text-gray-900">{appointment.servicio || appointment.servicioNombre || "Consulta Médica"}</p>
                </div>
              </div>
            </div>

            {/* Notas */}
            {appointment.notas && (
              <div className="p-3 rounded-lg border border-gray-100">
                <label className="text-[10px] font-semibold text-gray-400 uppercase mb-1 flex items-center gap-1"><FileText size={12} /> Notas</label>
                <p className="text-xs text-gray-700 whitespace-pre-line">{appointment.notas}</p>
              </div>
            )}

            {appointment.fechaCreacion && (
              <p className="text-[10px] text-gray-400 text-center">
                Cita creada el {new Date(appointment.fechaCreacion).toLocaleString("es-ES")}
              </p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailModal;
