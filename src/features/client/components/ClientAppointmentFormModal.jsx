import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Calendar,
  Clock,
  User,
  FileText,
  Phone,
  CreditCard,
  Stethoscope,
  AlertCircle,
  Loader2,
  DollarSign,
} from "lucide-react";
import { appointmentService } from "../../services/appointments/services/appointmentService";
import { apiClient } from "../../../shared/utils/apiClient";
import CalendarPicker from "../../services/appointments/components/CalendarPicker";
import { turnService } from "../../sales/services/turnService";
import { availabilityService } from "../../services/appointments/services/availabilityService";

const getDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getLocalToday = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateLocal = (isoDate) => {
  if (!isoDate) return new Date();
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatDateDisplay = (isoDate) => {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return isoDate;
};

const ClientAppointmentFormModal = ({
  isOpen,
  onClose,
  onSave,
  appointment,
  doctors,
}) => {
  const initialFormState = {
    paciente: "",
    documento: "",
    telefono: "",
    email: "",
    doctorId: "",
    fecha: getLocalToday(),
    hora: "",
    servicio: "",
    servicioId: "",
    precio: "",
    notas: "",
    userId: "",
  };

  const currentUser = JSON.parse(
    sessionStorage.getItem("syspharma_user") || "{}",
  );

  // 🟢 VERDE PARA CLIENTE
  const headerBgColor   = "bg-emerald-600";
  const focusBorder     = "focus:border-emerald-400";
  const focusRing       = "focus:ring-emerald-200";
  const slotSelected    = "bg-emerald-600";
  const slotHover       = "hover:bg-emerald-50";
  const btnSaveBg       = "bg-emerald-600 hover:bg-emerald-700";

  const inputClass = (hasError) =>
    `w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
      hasError
        ? "border-red-300 focus:ring-red-200"
        : `border-gray-200 ${focusBorder} ${focusRing}`
    }`;

  const selectClass = (hasError) =>
    `w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 ${
      hasError
        ? "border-red-300 focus:ring-red-200"
        : `border-gray-200 ${focusBorder} ${focusRing}`
    }`;

  const [formData, setFormData] = useState(initialFormState);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [diasBloqueados, setDiasBloqueados] = useState([]);
  const [horarioMedico, setHorarioMedico] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  useEffect(() => {
    if (appointment) {
      setFormData({
        paciente: appointment.paciente || appointment.pacienteNombre || "",
        documento: appointment.documento || appointment.clienteDocumento || "",
        telefono: appointment.telefono || appointment.clienteTelefono || "",
        email: appointment.email || appointment.clienteEmail || "",
        doctorId: appointment.doctorId || appointment.medicoId || "",
        fecha: appointment.fecha || getLocalToday(),
        hora: appointment.hora || "",
        servicio: appointment.servicio || appointment.motivo || "",
        servicioId: appointment.servicioId || "",
        precio: appointment.precio || "",
        notas: appointment.notas || "",
        userId: appointment.userId || "",
      });
    } else {
      setFormData({
        ...initialFormState,
        paciente: currentUser.nombre || "",
        documento:
          currentUser.documento ||
          currentUser.cedula ||
          (currentUser.id ? String(currentUser.id) : ""),
        telefono: currentUser.telefono || currentUser.phone || "",
        email: currentUser.email || "",
        userId: currentUser.id || "",
      });
    }
    setErrors({});

    const loadServices = async () => {
      try {
        const response = await apiClient.get("Servicio");
        const raw = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

        const activeServices = raw.filter((s) => {
          if (s.estado === undefined || s.estado === null) return true;
          if (typeof s.estado === "boolean") return s.estado === true;
          if (typeof s.estado === "number") return s.estado === 1;
          return String(s.estado).toLowerCase() === "activo";
        });

        setServicesList(activeServices);

        if (appointment && !appointment.servicioId && appointment.servicio) {
          const matchedService = activeServices.find(
            (s) =>
              s.nombre.toLowerCase() ===
              (appointment.servicio || "").toLowerCase(),
          );
          if (matchedService) {
            setFormData((prev) => ({ ...prev, servicioId: matchedService.id }));
          }
        }
      } catch (error) {
        console.error("Error cargando servicios:", error);
        setServicesList([]);
      }
    };

    loadServices();
    window.addEventListener("services:changed", loadServices);
    return () => window.removeEventListener("services:changed", loadServices);
  }, [appointment, isOpen]);

  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 8; i < 18; i++) {
      slots.push(`${i.toString().padStart(2, "0")}:00`);
      slots.push(`${i.toString().padStart(2, "0")}:30`);
    }
    return slots;
  };

  useEffect(() => {
    if (!formData.doctorId) {
      setDiasBloqueados([]);
      setHorarioMedico([]);
      return;
    }
    const id = parseInt(formData.doctorId);
    availabilityService.getDiasNoDisponibles(id)
      .then(data => setDiasBloqueados(Array.isArray(data) ? data : []))
      .catch(() => setDiasBloqueados([]));
    availabilityService.getHorario(id)
      .then(data => setHorarioMedico(Array.isArray(data) ? data : []))
      .catch(() => setHorarioMedico([]));
  }, [formData.doctorId]);

  const getDisabledDatesForDoctor = () => {
    const disabled = [];
    const diasConHorario = new Set(horarioMedico.map((h) => h.diaSemana));

    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      if (!diasConHorario.has(d.getDay())) {
        disabled.push({ date: getDateString(d), reason: "doctor" });
      }
    }

    diasBloqueados.forEach((bloqueo) => {
      const start = new Date(bloqueo.fechaInicio + "T12:00:00");
      const end = new Date(bloqueo.fechaFin + "T12:00:00");
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        disabled.push({ date: getDateString(d), reason: bloqueo.motivo || "no disponible" });
      }
    });

    return disabled;
  };

  useEffect(() => {
    if (!formData.doctorId || !formData.fecha) {
      setAvailableSlots([]);
      return;
    }
    availabilityService
      .getSlots(parseInt(formData.doctorId), formData.fecha)
      .then((slots) => setAvailableSlots(Array.isArray(slots) ? slots : []));
  }, [formData.doctorId, formData.fecha]);

  const handleGenericInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleDoctorChange = (e) => {
    setFormData((prev) => ({ ...prev, doctorId: e.target.value, hora: "" }));
    if (errors.doctorId) setErrors((prev) => ({ ...prev, doctorId: null }));
  };

  const handleServiceChange = (e) => {
    const selectedServiceId = e.target.value;
    const selectedServiceData = servicesList.find(
      (s) => s.id == selectedServiceId,
    );
    setFormData((prev) => ({
      ...prev,
      servicioId: selectedServiceId,
      servicio: selectedServiceData ? selectedServiceData.nombre : "",
      precio: selectedServiceData ? selectedServiceData.precio : "",
    }));
    if (errors.servicio) setErrors((prev) => ({ ...prev, servicio: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.paciente.trim()) newErrors.paciente = "Nombre obligatorio";
    if (!formData.documento.trim()) newErrors.documento = "Documento obligatorio";
    if (!formData.doctorId) newErrors.doctorId = "Seleccione médico";
    if (!formData.fecha) newErrors.fecha = "Seleccione fecha";
    if (!formData.hora) newErrors.hora = "Seleccione hora";
    if (!formData.servicioId) newErrors.servicio = "Seleccione servicio";
    if (!formData.precio) newErrors.precio = "Precio requerido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const turnValidation =
      await turnService.validateOperationAllowed(currentUser);
    if (!turnValidation.valid) {
      alert(turnValidation.message);
      return;
    }

    setIsSubmitting(true);
    try {
      const appointmentData = {
        ...formData,
        doctorId: parseInt(formData.doctorId),
      };

      if (!appointmentData.userId && currentUser?.id) {
        appointmentData.userId = currentUser.id;
      }

      if (appointment && appointment.id) {
        await appointmentService.updateAppointment(appointment.id, appointmentData);
        onSave && onSave(null);
      } else {
        const created = await appointmentService.createAppointment(appointmentData);
        turnService.recordSale({
          userId: appointmentData.userId || currentUser.id,
          userName: currentUser.nombre || "Usuario",
          tipo: "servicio",
          monto: parseFloat(formData.precio) || 0,
          descripcion: formData.servicio,
          categoria: "servicio",
          referencia: created?.id || "CITA",
          paciente: formData.paciente,
        });
        onSave && onSave(null);
      }
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al guardar la cita.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className={`${headerBgColor} px-6 py-4 flex justify-between items-center`}>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar size={20} />
            {appointment ? "Editar Cita Médica" : "Nueva Cita Médica"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* COLUMNA IZQUIERDA */}
            <div className="md:col-span-5 space-y-5 md:border-r md:border-gray-100 md:pr-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 border-b pb-2 mb-3">
                <User size={14} /> Información Paciente
              </h3>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    name="paciente"
                    type="text"
                    className={inputClass(errors.paciente)}
                    value={formData.paciente}
                    onChange={handleGenericInput}
                  />
                </div>
                {errors.paciente && (
                  <p className="text-[10px] text-red-500 mt-1">{errors.paciente}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Documento ID *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    name="documento"
                    type="text"
                    className={inputClass(errors.documento)}
                    value={formData.documento}
                    onChange={handleGenericInput}
                  />
                </div>
                {errors.documento && (
                  <p className="text-[10px] text-red-500 mt-1">{errors.documento}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    name="telefono"
                    type="tel"
                    className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none ${focusBorder} ${focusRing} focus:ring-2`}
                    value={formData.telefono}
                    onChange={handleGenericInput}
                  />
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA */}
            <div className="md:col-span-7 space-y-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 border-b pb-2 mb-3">
                <Stethoscope size={14} /> Detalle Atención
              </h3>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Médico / Especialista *
                </label>
                <select
                  name="doctorId"
                  className={selectClass(errors.doctorId)}
                  value={formData.doctorId}
                  onChange={handleDoctorChange}
                >
                  <option value="">Seleccione especialista...</option>
                  {doctors &&
                    doctors
                      .filter((d) => {
                        if (d.estado === undefined || d.estado === null) return true;
                        if (typeof d.estado === "boolean") return d.estado === true;
                        if (typeof d.estado === "number") return d.estado === 1;
                        return String(d.estado).toLowerCase() === "activo";
                      })
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nombre} — {d.especialidad}
                        </option>
                      ))}
                </select>
                {errors.doctorId && (
                  <p className="text-[10px] text-red-500 mt-1">{errors.doctorId}</p>
                )}
                {formData.doctorId && horarioMedico.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> Este médico no tiene horario configurado aún
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Fecha *
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                      size={16}
                      onClick={() => formData.doctorId && setShowCalendarPicker(!showCalendarPicker)}
                    />
                    <input
                      name="fecha"
                      type="text"
                      readOnly
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 cursor-pointer ${errors.fecha ? "border-red-300" : `border-gray-200 ${focusBorder} ${focusRing}`}`}
                      value={formatDateDisplay(formData.fecha)}
                      onClick={() => formData.doctorId && setShowCalendarPicker(!showCalendarPicker)}
                      placeholder="Seleccione fecha"
                    />
                  </div>
                  {errors.fecha && (
                    <p className="text-[10px] text-red-500 mt-1">{errors.fecha}</p>
                  )}
                  {formData.fecha && formData.doctorId && (() => {
                    const dd = getDisabledDatesForDoctor();
                    const found = Array.isArray(dd) && dd.find((d) =>
                      typeof d === "string" ? d === formData.fecha : d?.date === formData.fecha,
                    );
                    return found ? (
                      <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> El médico no está disponible
                      </p>
                    ) : null;
                  })()}
                  {showCalendarPicker && formData.doctorId && (
                    <div className="mt-3 absolute z-10 bg-white p-3 rounded-lg border border-gray-200 shadow-xl">
                      <CalendarPicker
                        selectedDate={formData.fecha}
                        onDateSelect={(date) => {
                          setFormData((prev) => ({ ...prev, fecha: date, hora: "" }));
                          setShowCalendarPicker(false);
                          if (errors.fecha) setErrors((prev) => ({ ...prev, fecha: null }));
                        }}
                        disabledDates={getDisabledDatesForDoctor()}
                        minDate={getLocalToday()}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Hora *
                  </label>
                  <div className={`w-full border rounded-lg bg-white overflow-hidden ${errors.hora ? "border-red-300" : "border-gray-200"} ${(!formData.doctorId || !formData.fecha) ? "opacity-50 pointer-events-none" : ""}`}>
                    {availableSlots.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-400">--</p>
                    ) : (
                      <div className="max-h-[120px] overflow-y-auto">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, hora: slot }));
                              if (errors.hora) setErrors(prev => ({ ...prev, hora: null }));
                            }}
                            className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                              formData.hora === slot
                                ? `${slotSelected} text-white font-semibold`
                                : `text-gray-700 ${slotHover}`
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.hora && (
                    <p className="text-[10px] text-red-500 mt-1">{errors.hora}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Servicio *
                  </label>
                  <select
                    name="servicioId"
                    className={selectClass(errors.servicio)}
                    value={formData.servicioId}
                    onChange={handleServiceChange}
                  >
                    <option value="">Seleccione servicio...</option>
                    {servicesList.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.servicio && (
                    <p className="text-[10px] text-red-500 mt-1">{errors.servicio}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Costo ($) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      name="precio"
                      type="number"
                      readOnly={servicesList.length > 0}
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg font-bold text-gray-700 focus:outline-none focus:ring-2 ${errors.precio ? "border-red-300" : `border-gray-200 ${focusBorder} ${focusRing}`} ${servicesList.length > 0 ? "bg-gray-50 cursor-not-allowed" : "bg-white"}`}
                      placeholder="0.00"
                      value={formData.precio}
                      onChange={handleGenericInput}
                    />
                  </div>
                  {errors.precio && (
                    <p className="text-[10px] text-red-500 mt-1">{errors.precio}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Notas
                </label>
                <textarea
                  name="notas"
                  className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none ${focusBorder} ${focusRing} focus:ring-2 resize-none h-20`}
                  placeholder="Observaciones..."
                  value={formData.notas}
                  onChange={handleGenericInput}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`${btnSaveBg} px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2`}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Guardar Cita
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientAppointmentFormModal;
