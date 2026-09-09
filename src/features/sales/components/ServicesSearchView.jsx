import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Search, Plus, X, Calendar, Clock, User, AlertCircle } from "lucide-react";
import { appointmentService } from "../../services/appointments/services/appointmentService";

const fmt = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

export const ServicesSearchView = ({ cart, onAddService, onRemoveService, primary }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [activeSubTab, setActiveSubTab] = useState("citas"); // "citas" or "catalogo"
  const [catalogServices, setCatalogServices] = useState([]);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Cargar catálogo de servicios al entrar en la pestaña correspondiente
  useEffect(() => {
    if (activeSubTab === "catalogo") {
      setCatalogLoading(true);
      appointmentService.getCatalogServices()
        .then((data) => {
          setCatalogServices(data.filter((s) => s.estado));
        })
        .catch((err) => console.warn("Error cargando catálogo de servicios:", err))
        .finally(() => setCatalogLoading(false));
    }
  }, [activeSubTab]);

  // Buscar citas del paciente
  const handleSearchPatient = useCallback(async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      // Obtener todas las citas
      const allAppointments = await appointmentService.getAppointments();
      const filtered = allAppointments.filter(
        (apt) =>
          (apt.paciente || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (apt.pacienteNombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (apt.documento || "").toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Filtrar citas COMPLETADAS y que NO tengan pedido/venta asociado
      const completedAndUnpaid = filtered.filter(
        (apt) => {
          const estado = (apt.estado || apt.estadoNombre || "").toLowerCase();
          const hasOrderOrSale = apt.pedidoId || apt.ventaId;
          return estado.includes("completada") && !hasOrderOrSale;
        }
      );

      setAppointments(completedAndUnpaid);
      setFilteredAppointments(completedAndUnpaid);
    } catch (err) {
      console.warn(`Error buscando citas: ${err}`);
      setAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const handleAddService = useCallback((appointment) => {
    // Crear el servicio desde la cita existente
    onAddService({
      id: `service_${appointment.id}`,
      servicioId: appointment.servicioId,
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      doctorNombre: appointment.medicoNombre || appointment.doctorNombre || "Médico",
      nombre: appointment.servicioNombre || appointment.servicio || "Consulta",
      especialidad: appointment.servicio || appointment.servicioNombre || "Consulta",
      fecha: appointment.fecha,
      hora: appointment.hora,
      precio: appointment.precio || 50000,
      motivo: appointment.servicio || appointment.servicioNombre || "Consulta",
      paciente: appointment.paciente || appointment.pacienteNombre,
      documento: appointment.documento || appointment.pacienteDocumento,
      telefono: appointment.telefono || appointment.pacienteTelefono,
      email: appointment.email || appointment.pacienteEmail,
      notas: appointment.notas || "",
    });
  }, [onAddService]);

  const handleAddCatalogService = useCallback((service) => {
    // Agregar un servicio directo sin cita previa (walk-in)
    onAddService({
      id: `walkin_${service.id}_${Date.now()}`,
      servicioId: service.id,
      nombre: service.nombre,
      precio: service.precio,
      especialidad: service.categoriaNombre || "Procedimiento",
      doctorNombre: "Walk-in",
      fecha: new Date().toISOString().substring(0, 10),
      hora: new Date().toLocaleTimeString("es-CO", { hour12: false }).substring(0, 5),
    });
  }, [onAddService]);

  const filteredCatalogServices = useMemo(() => {
    return catalogServices.filter((s) =>
      (s.nombre || "").toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
      (s.categoriaNombre || "").toLowerCase().includes(catalogSearchTerm.toLowerCase())
    );
  }, [catalogServices, catalogSearchTerm]);

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Selector de subpestañas */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit flex-shrink-0 text-xs font-black uppercase">
        <button
          onClick={() => setActiveSubTab("citas")}
          className={`px-4 py-1.5 rounded-lg transition-all ${
            activeSubTab === "citas" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📅 Citas del Paciente
        </button>
        <button
          onClick={() => setActiveSubTab("catalogo")}
          className={`px-4 py-1.5 rounded-lg transition-all ${
            activeSubTab === "catalogo" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          🩺 Catálogo Walk-in
        </button>
      </div>

      {activeSubTab === "citas" ? (
        <>
          {/* Búsqueda de Paciente */}
          <div className="space-y-2">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar paciente por nombre o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearchPatient()}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <button
                onClick={handleSearchPatient}
                disabled={!searchTerm.trim() || loading}
                className="px-4 py-2 rounded-lg font-semibold transition-all text-white disabled:opacity-50"
                style={{ background: primary }}
              >
                {loading ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </div>

          {/* Estado de búsqueda */}
          {searched && filteredAppointments.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                {searchTerm.trim() ? "No hay citas completadas pendientes para este paciente." : "Ingresa un nombre o documento."}
              </p>
            </div>
          )}

          {/* Lista de Citas del Paciente */}
          <div className="flex-1 overflow-y-auto space-y-2 bg-gray-50 rounded-xl p-3">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-400">Buscando citas...</div>
            ) : filteredAppointments.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Calendar size={40} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">
                    {searched ? "Sin citas completadas pendientes" : "Busca un paciente para ver sus citas médicas"}
                  </p>
                </div>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{appointment.paciente || appointment.pacienteNombre}</p>
                        <p className="text-xs text-gray-500">{appointment.medicoNombre || appointment.doctorNombre || "Médico"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm" style={{ color: primary }}>
                          {fmt(appointment.precio || 50000)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {new Date(appointment.fecha).toLocaleDateString("es-CO")}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {appointment.hora}
                      </div>
                    </div>

                    <p className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block">
                      {appointment.servicio || appointment.servicioNombre || "Consulta"}
                    </p>

                    <button
                      onClick={() => handleAddService(appointment)}
                      className="w-full py-1.5 rounded-lg text-white font-semibold text-xs transition-all active:scale-95"
                      style={{ background: primary }}
                    >
                      <Plus size={14} className="inline mr-1" />
                      Agregar a Venta
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Búsqueda de Catálogo */}
          <div className="space-y-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar servicio en el catálogo por nombre..."
                value={catalogSearchTerm}
                onChange={(e) => setCatalogSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Lista de Servicios del Catálogo */}
          <div className="flex-1 overflow-y-auto space-y-2 bg-gray-50 rounded-xl p-3">
            {catalogLoading ? (
              <div className="flex items-center justify-center h-full text-gray-400">Cargando catálogo...</div>
            ) : filteredCatalogServices.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Calendar size={40} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No se encontraron servicios en el catálogo</p>
                </div>
              </div>
            ) : (
              filteredCatalogServices.map((service) => (
                <div key={service.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{service.nombre}</p>
                        <p className="text-xs text-gray-500">{service.categoriaNombre || "Procedimiento"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm" style={{ color: primary }}>
                          {fmt(service.precio)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {service.duracion} min
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddCatalogService(service)}
                      className="w-full py-1.5 rounded-lg text-white font-semibold text-xs transition-all active:scale-95"
                      style={{ background: primary }}
                    >
                      <Plus size={14} className="inline mr-1" />
                      Agregar a Venta
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Carrito de Servicios */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 h-48 flex flex-col flex-shrink-0">
        <h3 className="font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">🏥 Servicios en carrito</h3>
        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">Sin servicios agendados</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2">
            {cart.map((service) => (
              <div key={service.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{service.nombre || service.paciente || service.doctorNombre}</p>
                    <p className="text-xs text-gray-500">{service.especialidad || service.motivo}</p>
                  </div>
                  <button onClick={() => onRemoveService(service.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{service.fecha ? new Date(service.fecha).toLocaleDateString("es-CO") : ""} {service.hora}</span>
                  <p className="font-bold" style={{ color: primary }}>
                    {fmt(service.precio)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesSearchView;
