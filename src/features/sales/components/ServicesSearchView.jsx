import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Search, Plus, Calendar, Clock, AlertCircle, Stethoscope } from "lucide-react";
import { appointmentService } from "../../services/appointments/services/appointmentService";

const fmt = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

export const ServicesSearchView = ({ onAddService, primary }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [activeSubTab, setActiveSubTab] = useState("citas");
  const [catalogServices, setCatalogServices] = useState([]);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);

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

  const handleSearchPatient = useCallback(async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const allAppointments = await appointmentService.getAppointments();
      const filtered = allAppointments.filter(
        (apt) =>
          (apt.paciente || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (apt.pacienteNombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (apt.documento || "").toLowerCase().includes(searchTerm.toLowerCase())
      );

      const completedAndUnpaid = filtered.filter(
        (apt) => {
          const estado = (apt.estado || apt.estadoNombre || "").toLowerCase();
          return estado.includes("completada") && !apt.ventaId;
        }
      );

      setFilteredAppointments(completedAndUnpaid);
    } catch (err) {
      console.warn(`Error buscando citas: ${err}`);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const handleAddService = useCallback((appointment) => {
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
    <div className="h-full flex flex-col gap-3">
      <div className="flex bg-gray-100 p-0.5 rounded-lg w-fit flex-shrink-0 text-[10px] font-black uppercase">
        <button
          onClick={() => setActiveSubTab("citas")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${
            activeSubTab === "citas" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Calendar size={11} /> Citas
        </button>
        <button
          onClick={() => setActiveSubTab("catalogo")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${
            activeSubTab === "catalogo" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Stethoscope size={11} /> Catálogo
        </button>
      </div>

      {activeSubTab === "citas" ? (
        <>
          <div className="space-y-1.5">
            <div className="relative flex gap-1.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text"
                  placeholder="Nombre o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearchPatient()}
                  className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
              <button
                onClick={handleSearchPatient}
                disabled={!searchTerm.trim() || loading}
                className="px-3 py-1.5 rounded-lg font-semibold transition-all text-white disabled:opacity-50 text-xs"
                style={{ background: primary }}
              >
                {loading ? "..." : "Buscar"}
              </button>
            </div>
          </div>

          {searched && filteredAppointments.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex gap-1.5">
              <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700">
                {searchTerm.trim() ? "No hay citas completadas pendientes para este paciente." : "Ingresa un nombre o documento."}
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-1.5 bg-gray-50 rounded-lg p-2">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-xs">Buscando citas...</div>
            ) : filteredAppointments.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Calendar size={28} className="mx-auto mb-1.5 opacity-20" />
                  <p className="text-xs">
                    {searched ? "Sin citas completadas pendientes" : "Busca un paciente para ver sus citas médicas"}
                  </p>
                </div>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-2 space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-xs text-gray-900">{appointment.paciente || appointment.pacienteNombre}</p>
                        <p className="text-[10px] text-gray-500">{appointment.medicoNombre || appointment.doctorNombre || "Médico"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xs" style={{ color: primary }}>
                          {fmt(appointment.precio || 50000)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(appointment.fecha).toLocaleDateString("es-CO")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        {appointment.hora}
                      </div>
                    </div>

                    <p className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded inline-block">
                      {appointment.servicio || appointment.servicioNombre || "Consulta"}
                    </p>

                    <button
                      onClick={() => handleAddService(appointment)}
                      className="w-full py-1.5 rounded-lg text-white font-semibold text-[10px] transition-all active:scale-95"
                      style={{ background: primary }}
                    >
                      <Plus size={12} className="inline mr-1" />
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
          <div className="space-y-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Buscar servicio..."
                value={catalogSearchTerm}
                onChange={(e) => setCatalogSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 bg-gray-50 rounded-lg p-2">
            {catalogLoading ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-xs">Cargando catálogo...</div>
            ) : filteredCatalogServices.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Calendar size={28} className="mx-auto mb-1.5 opacity-20" />
                  <p className="text-xs">No se encontraron servicios en el catálogo</p>
                </div>
              </div>
            ) : (
              filteredCatalogServices.map((service) => (
                <div key={service.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-2 space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-xs text-gray-900">{service.nombre}</p>
                        <p className="text-[10px] text-gray-500">{service.categoriaNombre || "Procedimiento"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xs" style={{ color: primary }}>
                          {fmt(service.precio)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        {service.duracion} min
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddCatalogService(service)}
                      className="w-full py-1.5 rounded-lg text-white font-semibold text-[10px] transition-all active:scale-95"
                      style={{ background: primary }}
                    >
                      <Plus size={12} className="inline mr-1" />
                      Agregar a Venta
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ServicesSearchView;
