import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Calendar as CalendarIcon, List, Settings, Plus, Search, Eye, Edit, Trash2,
  ChevronLeft, ChevronRight, Clock, Users, Filter, DollarSign, X, CheckCircle, AlertCircle
} from "lucide-react";
import { apiClient } from "../../../shared/utils/apiClient";
import AppointmentFormModal from "./components/AppointmentFormModal";
import AppointmentDetailModal from "./components/AppointmentDetailModal";
import { StatusNotification } from "../../../shared/ui/StatusNotification";
import { AvailabilityConfigPage } from "./AvailabilityConfigPage";
import DoctorsPage from "../doctors/DoctorsPage";
import { appointmentService } from "./services/appointmentService";

const API_URL = "/api/Cita";
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${sessionStorage.getItem("syspharma_token")}` },
});

export const AppointmentsPage = () => {
  const { currentUser } = useCurrentUser();
  const currentUserRole = (currentUser.rol || "Empleado").toLowerCase();
  const isEmployeePanel = currentUserRole === "empleado";
  
  // Theme colors based on role
  const theme = isEmployeePanel
    ? { main: "bg-blue-600", hover: "hover:bg-blue-700", ring: "ring-blue-500", border: "border-blue-200", badge: "bg-blue-600" }
    : { main: "bg-emerald-600", hover: "hover:bg-emerald-700", ring: "ring-emerald-500", border: "border-emerald-200", badge: "bg-emerald-600" };

  const [activeTab, setActiveTab] = useState("calendario");
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [estados, setEstados] = useState([]);
  const formatHora = (hora) => {
  if (!hora) return "";
  const [h, m] = hora.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
};
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const isMountedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [range, setRange] = useState({
    start: `${new Date().getFullYear()}-01-01`,
    end: `${new Date().getFullYear()}-12-31`
  });
  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDaySummaryModalOpen, setIsDaySummaryModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Estado para controlar qué popover flotante de estado está activo
  const [activeStatusPopover, setActiveStatusPopover] = useState(null);

  const loadData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      setLoading(true);
      const [citasRes, estadosRes, doctorsData] = await Promise.all([
        apiClient.get(API_URL, getAuthHeaders()),
        apiClient.get(`${API_URL}/estados`, getAuthHeaders()),
        appointmentService.getDoctors(),
      ]);
      if (!isMountedRef.current) return;
      setAppointments(Array.isArray(citasRes.data) ? citasRes.data : []);
      setEstados(Array.isArray(estadosRes.data) ? estadosRes.data : []);
      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
    } catch (err) {
      console.error("Error cargando citas:", err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    return () => {
      isMountedRef.current = false;
      isLoadingRef.current = false;
    };
  }, [loadData]);

  // Escuchar cambios en médicos y en citas para refrescar la vista en tiempo real
  useEffect(() => {
    const refresh = () => loadData();
    window.addEventListener("doctors:changed", refresh);
    window.addEventListener("appointments:changed", refresh);
    return () => {
      window.removeEventListener("doctors:changed", refresh);
      window.removeEventListener("appointments:changed", refresh);
    };
  }, [loadData]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const cleanAptFecha = apt.fecha ? apt.fecha.substring(0, 10) : "";
      const matchRange = cleanAptFecha >= range.start && cleanAptFecha <= range.end;
      
      const matchSearch = (apt.pacienteNombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (apt.servicioNombre || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchRange && matchSearch;
    }).sort((a, b) => {
      const cleanFechaA = a.fecha ? a.fecha.substring(0, 10) : "";
      const cleanFechaB = b.fecha ? b.fecha.substring(0, 10) : "";
      
      const timeA = a.hora || "00:00:00";
      const timeB = b.hora || "00:00:00";

      const dateTimeA = new Date(`${cleanFechaA}T${timeA}`);
      const dateTimeB = new Date(`${cleanFechaB}T${timeB}`);

      return dateTimeB - dateTimeA;
    });
  }, [appointments, range, searchTerm]);

  const financialSummary = useMemo(() => {
    const ingresos = filteredAppointments
      .filter(a => (a.estadoNombre || "").toLowerCase().includes("completada"))
      .reduce((s, a) => s + (Number(a.precio) || 0), 0);
    return { ingresos, totalCitas: filteredAppointments.length };
  }, [filteredAppointments]);

  const getAppointmentsForDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    
    return appointments.filter(apt => apt.fecha && apt.fecha.startsWith(dateStr));
  };

  const handleStatusChange = async (appointmentId, estadoNombre) => {
    const estado = estados.find(e => e.nombre.toLowerCase() === estadoNombre.toLowerCase());
    if (!estado) return;
    try {
      await apiClient.patch(`${API_URL}/${appointmentId}/estado`, estado.id, {
        ...getAuthHeaders(),
        headers: { ...getAuthHeaders().headers, "Content-Type": "application/json" }
      });
      setNotification({ message: "Estado actualizado correctamente", type: "success" });
      loadData();
    } catch (err) {
      setNotification({ message: "Error al actualizar", type: "error" });
    }
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      await apiClient.delete(`${API_URL}/${showDeleteConfirm.id}`, getAuthHeaders());
      setNotification({ message: "Cita eliminada correctamente", type: "success" });
      loadData();
    } catch (err) {
      console.error("Error al eliminar cita:", err);
      setNotification({ message: "Error al eliminar la cita", type: "error" });
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  // Función de ayuda para formatear las clases de color del estado estático (Píldora)
  const getStatusPillStyle = (estadoNombre) => {
    const est = (estadoNombre || "").toLowerCase();
    if (est.includes("completada")) {
      return "bg-blue-50 text-blue-700 border-blue-100";
    }
    if (est.includes("cancelada")) {
      return "bg-red-50 text-red-700 border-red-100";
    }
    if (est.includes("pendiente") || est.includes("asistencia")) {
      return "bg-amber-50 text-amber-700 border-amber-100";
    }
    return "bg-blue-50 text-blue-700 border-blue-100";
  };

  const renderList = () => (
    // --- MODIFICADO: Cambiado overflow-hidden a overflow-visible para que el modal flotante no se recorte ---
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-visible">
      <div className="p-4 border-b border-gray-50 bg-gray-50/30">
        <input type="text" placeholder="Buscar paciente o servicio..."
          className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-gray-400">
          <tr>
            {/* --- MODIFICADO: Se agregaron clases rounded-tl-3xl y rounded-tr-3xl para conservar las esquinas redondeadas de la tabla sin recortar --- */}
            <th className="p-4 text-[10px] font-black uppercase rounded-tl-3xl">Paciente</th>
            <th className="p-4 text-[10px] font-black uppercase">Fecha / Hora</th>
            <th className="p-4 text-[10px] font-black uppercase">Servicio</th>
            <th className="p-4 text-[10px] font-black uppercase">Precio</th>
            <th className="p-4 text-[10px] font-black uppercase">Estado</th>
            <th className="p-4 text-center text-[10px] font-black uppercase rounded-tr-3xl">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {filteredAppointments.length === 0 ? (
            <tr><td colSpan="6" className="p-10 text-center text-gray-400 italic">No hay citas registradas en este periodo.</td></tr>
          ) : (
            filteredAppointments.map(apt => (
              <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <p className="font-bold text-sm text-gray-900">{apt.pacienteNombre}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{apt.medicoNombre}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm font-bold text-gray-700">{apt.fecha ? apt.fecha.substring(0, 10) : ""}</p>
                  <p className="text-[10px] text-gray-400 font-bold">{formatHora(apt.hora)}</p>
                </td>
                <td className="p-4 text-sm font-medium text-gray-600">{apt.servicioNombre}</td>
                <td className="p-4 font-black text-blue-600">${Number(apt.precio || 0).toLocaleString()}</td>
                
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusPillStyle(apt.estadoNombre)}`}>
                    {apt.estadoNombre}
                  </span>
                </td>

                <td className="p-4">
                  <div className="flex justify-center gap-1.5 items-center">
                    <button 
                      onClick={() => { setSelectedAppointment(apt); setIsDetailModalOpen(true); }} 
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Ver detalle"
                    >
                      <Eye size={16} />
                    </button>

                    {/* Botón interactivo y popover de cambio de estado */}
                    <div className="relative">
                      <button 
                        onClick={() => setActiveStatusPopover(activeStatusPopover === apt.id ? null : apt.id)} 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Cambiar estado"
                      >
                        <CheckCircle size={16} />
                      </button>

                      {activeStatusPopover === apt.id && (
                        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                          <p className="text-[9px] font-black uppercase text-gray-400 px-3 pb-1.5 border-b border-gray-50 tracking-wider">Cambiar Estado</p>
                          {estados.map(est => (
                            <button
                              key={est.id}
                              onClick={() => {
                                handleStatusChange(apt.id, est.nombre);
                                setActiveStatusPopover(null);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors hover:bg-gray-50 flex items-center gap-2 ${
                                apt.estadoNombre === est.nombre ? "text-blue-600 bg-blue-50/30" : "text-gray-600"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                est.nombre.toLowerCase().includes("completada") ? "bg-blue-500" :
                                est.nombre.toLowerCase().includes("cancelada") ? "bg-red-500" :
                                est.nombre.toLowerCase().includes("pendiente") || est.nombre.toLowerCase().includes("asistencia") ? "bg-amber-500" : "bg-blue-500"
                              }`} />
                              {est.nombre}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => { setEditingAppointment(apt); setIsAppointmentModalOpen(true); }} 
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all"
                      title="Editar cita"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(apt)} 
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Eliminar cita"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const days = [];
    let day = new Date(startDate);
    while (day <= endDate) {
      days.push({
        date: new Date(day),
        isCurrentMonth: day.getMonth() === month,
        isToday: day.toDateString() === new Date().toDateString(),
        appts: getAppointmentsForDate(day)
      });
      day.setDate(day.getDate() + 1);
    }

    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-800 capitalize">
            {currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 hover:bg-gray-100 rounded-xl"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 hover:bg-gray-100 rounded-xl"><ChevronRight size={20} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase pb-2">{d}</div>
          ))}
          {days.map((d, i) => (
            <div key={i} onClick={() => { setSelectedDate(d.date); setIsDaySummaryModalOpen(true); }}
              className={`min-h-[100px] p-2 border rounded-2xl cursor-pointer transition-all ${d.isCurrentMonth ? "bg-white" : "bg-gray-50/50 text-gray-300 border-transparent"} ${d.isToday ? `ring-2 ${theme.ring}` : `hover:${theme.border}`}`}>
              <span className="text-xs font-black">{d.date.getDate()}</span>
              {d.appts.length > 0 && (
                <div className={`mt-1 ${theme.badge} text-white text-[9px] font-black uppercase py-1 rounded-md text-center`}>{d.appts.length} Citas</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 font-sans p-6 min-h-screen bg-[#f8fafc]">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Gestión de Citas</h1>
          <p className="text-sm text-gray-500 font-medium">Agenda y administración médica</p>
        </div>
        <button onClick={() => { setEditingAppointment(null); setIsAppointmentModalOpen(true); }}
          className={`${theme.main} ${theme.hover} text-white px-6 py-3 rounded-2xl font-black shadow-lg flex items-center gap-2 text-xs uppercase transition-all`} style={{ boxShadow: `0 10px 15px -3px ${isEmployeePanel ? 'rgba(37, 99, 235, 0.1)' : 'rgba(5, 150, 105, 0.1)'}` }}>
          <Plus size={18} /> Nueva Cita
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 overflow-x-auto">
        {[
          { id: "calendario", icon: CalendarIcon, label: "Calendario" },
          { id: "citas", icon: List, label: "Lista de Citas" },
          { id: "disponibilidad", icon: Settings, label: "Disponibilidad", adminOnly: true },
          { id: "medicos", icon: Users, label: "Médicos", adminOnly: true },
        ].map(tab => {
          if (tab.adminOnly && currentUserRole !== "administrador") return null;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? isEmployeePanel ? "text-blue-600 border-blue-600" : "text-emerald-600 border-emerald-600" : "text-gray-400 border-transparent hover:text-gray-600"}`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filtro por Rango */}
      {(activeTab === "calendario" || activeTab === "citas") && (
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`${isEmployeePanel ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"} p-2.5 rounded-xl`}><Filter size={20} /></div>
            <span className="font-black text-gray-800 text-[10px] uppercase">Rango de datos</span>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border">
            <input type="date" value={range.start} onChange={(e) => setRange(p => ({ ...p, start: e.target.value }))} className="bg-transparent text-xs font-bold outline-none p-1" />
            <div className="h-4 w-[1px] bg-gray-300"></div>
            <input type="date" value={range.end} onChange={(e) => setRange(p => ({ ...p, end: e.target.value }))} className="bg-transparent text-xs font-bold outline-none p-1" />
          </div>
        </div>
      )}

      {/* Vistas */}
      <div className="flex-1">
        {activeTab === "calendario" && renderCalendar()}
        {activeTab === "citas" && renderList()}
        {activeTab === "disponibilidad" && <AvailabilityConfigPage />}
        {activeTab === "medicos" && <DoctorsPage />}
      </div>

      {/* Modales */}
      {isAppointmentModalOpen && (
        <AppointmentFormModal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} onSave={() => loadData()} appointment={editingAppointment} doctors={doctors} />
      )}
      {isDetailModalOpen && selectedAppointment && (
        <AppointmentDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} appointment={selectedAppointment} />
      )}

      {/* Modal Eliminar Cita con el Estilo Solicitado */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100">
            {/* Header */}
            <div className="bg-red-50/50 px-6 py-4 border-b border-red-100 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-red-100 text-red-600 rounded-full">
                  <AlertCircle size={16} />
                </div>
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Eliminar Registro</h3>
              </div>
              <button onClick={() => setShowDeleteConfirm(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            {/* Body */}
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                ¿Estás seguro de eliminar a <strong>{showDeleteConfirm.pacienteNombre}</strong>?
              </p>
              <p className="text-xs text-red-500 font-semibold italic flex items-start gap-1.5">
                <span>⚠️</span> Esta acción borrará la cita permanentemente de la base de datos.
              </p>
            </div>
            {/* Footer */}
            <div className="bg-gray-50/30 px-6 py-3 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} 
                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all">
                Cancelar
              </button>
              <button onClick={confirmDelete} 
                className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-red-100">
                <Trash2 size={14} /> Eliminar ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resumen del Día */}
{isDaySummaryModalOpen && selectedDate && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={() => setIsDaySummaryModalOpen(false)}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      onClick={(e) => e.stopPropagation()}>
      
      {/* Header */}
      <div className={`${theme.main} px-5 py-4 flex items-center justify-between`}>
        <div>
          <h3 className="text-white font-black text-sm uppercase tracking-wide">
            {selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
          </h3>
          <p className={`${isEmployeePanel ? "text-blue-100" : "text-emerald-100"} text-xs mt-0.5`}>
            {getAppointmentsForDate(selectedDate).length} cita(s) programada(s)
          </p>
        </div>
        <button onClick={() => setIsDaySummaryModalOpen(false)}
          className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Lista de citas */}
      <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50">
        {getAppointmentsForDate(selectedDate).length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No hay citas para este día</p>
        ) : (
          getAppointmentsForDate(selectedDate)
            .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""))
            .map((apt) => (
              <div key={apt.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Hora */}
                    <div className={`${isEmployeePanel ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"} font-black text-xs px-2 py-1 rounded-lg min-w-[48px] text-center`}>
                      {apt.hora ? formatHora(apt.hora) : "--"}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{apt.pacienteNombre}</p>
                      <p className="text-[11px] text-gray-400 font-medium">{apt.medicoNombre} · {apt.servicioNombre}</p>
                    </div>
                  </div>
                  {/* Estado */}
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border shrink-0 ${getStatusPillStyle(apt.estadoNombre)}`}>
                    {apt.estadoNombre}
                  </span>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-5 py-3 border-t flex justify-between items-center">
        <button
          onClick={() => {
            setIsDaySummaryModalOpen(false);
            setEditingAppointment(null);
            setIsAppointmentModalOpen(true);
          }}
          className={`text-xs font-black flex items-center gap-1 ${isEmployeePanel ? "text-blue-600 hover:text-blue-700" : "text-emerald-600 hover:text-emerald-700"}`}>
          + Nueva cita este día
        </button>
        <button onClick={() => setIsDaySummaryModalOpen(false)}
          className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">
          Cerrar
        </button>
      </div>
    </div>
  </div>
)}

      {notification && <StatusNotification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
    </div>
  );
};

export default AppointmentsPage;