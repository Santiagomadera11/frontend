import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight,
  Eye, CheckCircle, X, Stethoscope, FileText, Mail, Phone, Info,
} from "lucide-react";
import { doctorService } from "./services/doctorService";
import DoctorFormModal from "./components/DoctorFormModal";
import { StatusNotification } from "/src/shared/ui/StatusNotification";
import { ConfirmDialog } from "/src/shared/ui/ConfirmDialog";

const DIAS_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [doctorToToggle, setDoctorToToggle] = useState(null);
  const [isToggleConfirmOpen, setIsToggleConfirmOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const isMountedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const itemsPerPage = 10;
  const { currentUser } = useCurrentUser();
  const userRole = (currentUser.rol || "").toLowerCase().trim();
  const userPerms = (currentUser.permisos || []).map((perm) => String(perm || "").toLowerCase().trim());
  const isAdmin = userRole === "administrador";
  const isEmployeePanel = !isAdmin;
  const theme = isEmployeePanel
    ? { main: "bg-blue-600", mainHover: "hover:bg-blue-700", text: "text-blue-700", ring: "focus:ring-blue-500", lightBg: "bg-blue-50", lightBorder: "border-blue-100", lightText: "text-blue-600", iconHover: "hover:bg-blue-50" }
    : { main: "bg-emerald-600", mainHover: "hover:bg-emerald-700", text: "text-emerald-700", ring: "focus:ring-emerald-500", lightBg: "bg-emerald-50", lightBorder: "border-emerald-100", lightText: "text-emerald-600", iconHover: "hover:bg-emerald-50" };
  const hasPerm = (perm) => isAdmin || userPerms.includes(perm);
  const canCreate = hasPerm("appointments.doctors.create");
  const canEdit = hasPerm("appointments.doctors.edit");
  const canDelete = hasPerm("appointments.doctors.delete");
  const canChangeStatus = hasPerm("appointments.doctors.status");

  const loadDoctors = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      setLoading(true);
      const data = await doctorService.getAll();
      if (!isMountedRef.current) return;
      setDoctors(data);
    } catch (error) {
      console.error("Error cargando médicos:", error);
      if (isMountedRef.current) {
        setNotification({ message: "Error al cargar médicos", type: "error" });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadDoctors();
    return () => {
      isMountedRef.current = false;
      isLoadingRef.current = false;
    };
  }, [loadDoctors]);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const handleOpenCreate = () => { if (canCreate) { setEditingDoctor(null); setIsModalOpen(true); } };
  const handleOpenEdit = (doctor) => { if (canEdit) { setEditingDoctor(doctor); setIsModalOpen(true); } };
  const handleViewDetail = (doctor) => { setSelectedDoctor(doctor); setIsDetailModalOpen(true); };

  const handleSaveDoctor = async (formData) => {
    if (editingDoctor && !canEdit) {
      setNotification({ message: "No tienes permiso para editar médicos", type: "error" });
      return;
    }
    if (!editingDoctor && !canCreate) {
      setNotification({ message: "No tienes permiso para crear médicos", type: "error" });
      return;
    }

    if (editingDoctor) {
      await doctorService.update({ ...editingDoctor, ...formData });
      setNotification({ message: "Médico actualizado correctamente", type: "success" });
    } else {
      await doctorService.create(formData);
      setNotification({ message: "Médico creado correctamente", type: "success" });
    }
    await loadDoctors();
    window.dispatchEvent(new Event("doctors:changed"));
    setIsModalOpen(false);
    setEditingDoctor(null);
  };

  const handleToggleStatus = (doctor) => { if (canChangeStatus) { setDoctorToToggle(doctor); setIsToggleConfirmOpen(true); } };

  const confirmToggleStatus = async () => {
    if (!doctorToToggle) return;
    if (!canChangeStatus) return;
    try {
      await doctorService.toggleStatus(doctorToToggle.id, doctorToToggle.estado);
      await loadDoctors();
      window.dispatchEvent(new Event("doctors:changed"));
      const newStatus = !doctorToToggle.estado;
      setNotification({
        message: `Médico ${doctorToToggle.nombre} ${newStatus ? "activado" : "desactivado"}`,
        type: newStatus ? "success" : "warning",
      });
    } catch {
      setNotification({ message: "Error al cambiar estado", type: "error" });
    } finally {
      setIsToggleConfirmOpen(false);
      setDoctorToToggle(null);
    }
  };

  const handleDeleteDoctor = (doctor) => {
    if (!canDelete) {
      setNotification({ message: "No tienes permiso para eliminar médicos", type: "error" });
      return;
    }
    setShowDeleteConfirm(doctor);
  };

 const confirmDelete = async () => {
  if (!showDeleteConfirm) return;
  if (!canDelete) {
    setNotification({ message: "No tienes permiso para eliminar médicos", type: "error" });
    setShowDeleteConfirm(null);
    return;
  }
  try {
    await doctorService.delete(showDeleteConfirm.id);
    await loadDoctors();
    window.dispatchEvent(new Event("doctors:changed"));
    setNotification({ message: "Médico eliminado correctamente", type: "success" });
  } catch (error) {
    setNotification({ message: error.message || "Error al eliminar médico", type: "warning" });
  } finally {
    setShowDeleteConfirm(null);
  }
};

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.especialidad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && doc.estado) ||
      (filterStatus === "inactive" && !doc.estado);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const paginatedDoctors = filteredDoctors.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <div className="h-full flex flex-col gap-6 font-sans overflow-hidden no-scrollbar">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>Gestión de Médicos</h1>
          <p className="text-gray-500 text-xs mt-0.5">Administra el registro completo de profesionales médicos</p>
        </div>
      </div>

      <div className="flex gap-4 flex-shrink-0 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Buscar por nombre, especialidad o email..."
            className={`w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 ${theme.ring}`}
            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }} />
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(0); }}
          className={`px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 ${theme.ring} bg-white`}>
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        {canCreate && (
          <button onClick={handleOpenCreate}
            className={`${theme.main} ${theme.mainHover} text-white px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2`}>
            <Plus size={16} /> Nuevo Médico
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto no-scrollbar bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">Cargando médicos...</div>
        ) : (
          <table className="w-full">
            <thead className={`${theme.main} text-white sticky top-0`}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Especialidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedDoctors.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No se encontraron médicos</td></tr>
              ) : (
                paginatedDoctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={doctor.avatar} alt={doctor.nombre} className="w-8 h-8 rounded-full" />
                        <span className="font-medium text-gray-900">{doctor.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{doctor.especialidad}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{doctor.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{doctor.telefono}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${doctor.estado ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {doctor.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleViewDetail(doctor)} className={`p-1.5 rounded-md ${theme.lightText} ${theme.iconHover} transition-colors`} title="Ver detalle">
                          <Eye size={16} />
                        </button>
                        {canChangeStatus && (
                          <button onClick={() => handleToggleStatus(doctor)} className={`p-1.5 rounded-md ${theme.lightText} ${theme.iconHover} transition-colors`} title="Cambiar estado">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {canEdit && (
                          <button onClick={() => handleOpenEdit(doctor)} className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors" title="Editar">
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDeleteDoctor(doctor)} className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-shrink-0">
          <span className="text-sm text-gray-600">
            Mostrando {paginatedDoctors.length > 0 ? currentPage * itemsPerPage + 1 : 0}-{Math.min((currentPage + 1) * itemsPerPage, filteredDoctors.length)} de {filteredDoctors.length}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"><ChevronLeft size={20} /></button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i)}
                className={`px-3 py-1 rounded text-sm font-medium ${currentPage === i ? `${theme.main} text-white` : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage === totalPages - 1}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"><ChevronRight size={20} /></button>
          </div>
        </div>
      )}

      <DoctorFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingDoctor(null); }}
        onSave={handleSaveDoctor} doctor={editingDoctor} accentColor={isEmployeePanel ? "blue" : "emerald"} />

      {notification && <StatusNotification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

      {isDetailModalOpen && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className={`px-6 py-4 flex items-center justify-between border-b ${theme.lightBorder} ${theme.lightBg} flex-shrink-0`}>
              <h2 className={`text-lg font-semibold ${theme.text}`}>Detalle del Médico</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className={`p-1 ${theme.iconHover} rounded-lg ${theme.lightText}`}><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <img src={selectedDoctor.avatar} alt={selectedDoctor.nombre} className="w-14 h-14 rounded-full flex-shrink-0 border-2 border-gray-100" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{selectedDoctor.nombre}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedDoctor.especialidad || "Sin especialidad"}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mt-1.5 ${selectedDoctor.estado ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {selectedDoctor.estado ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-gray-100">
                    <div className={`inline-flex p-1.5 rounded-md mb-1.5 ${theme.lightBg} ${theme.lightText}`}><FileText size={13} /></div>
                    <p className="text-[10px] text-gray-400">Documento</p>
                    <p className="text-xs font-semibold text-gray-900 truncate">{selectedDoctor.documento || "Sin especificar"}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-100">
                    <div className={`inline-flex p-1.5 rounded-md mb-1.5 ${theme.lightBg} ${theme.lightText}`}><Stethoscope size={13} /></div>
                    <p className="text-[10px] text-gray-400">Especialidad</p>
                    <p className="text-xs font-semibold text-gray-900 truncate">{selectedDoctor.especialidad || "Sin especificar"}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-100">
                    <div className={`inline-flex p-1.5 rounded-md mb-1.5 ${theme.lightBg} ${theme.lightText}`}><Mail size={13} /></div>
                    <p className="text-[10px] text-gray-400">Email</p>
                    <p className="text-xs font-semibold text-gray-900 truncate">{selectedDoctor.email || "Sin especificar"}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-100">
                    <div className={`inline-flex p-1.5 rounded-md mb-1.5 ${theme.lightBg} ${theme.lightText}`}><Phone size={13} /></div>
                    <p className="text-[10px] text-gray-400">Teléfono</p>
                    <p className="text-xs font-semibold text-gray-900 truncate">{selectedDoctor.telefono || "Sin especificar"}</p>
                  </div>
                </div>

                <div className={`rounded-lg border ${theme.lightBorder} ${theme.lightBg} p-3 flex items-start gap-2`}>
                  <Info size={14} className={`${theme.lightText} flex-shrink-0 mt-0.5`} />
                  <p className={`text-xs font-medium ${theme.text}`}>
                    El horario detallado se configura desde la pestaña <strong>Disponibilidad</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end flex-shrink-0">
              <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!showDeleteConfirm}
        title="Eliminar Médico"
        message={showDeleteConfirm ? `¿Eliminar al médico "${showDeleteConfirm.nombre}"?` : ""}
        confirmText="Eliminar"
        danger
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={isToggleConfirmOpen && !!doctorToToggle}
        title={doctorToToggle?.estado ? "Desactivar Médico" : "Activar Médico"}
        message={doctorToToggle ? (doctorToToggle.estado ? `¿Desactivar al médico "${doctorToToggle.nombre}"?` : `¿Activar al médico "${doctorToToggle.nombre}"?`) : ""}
        subMessage=""
        confirmText={doctorToToggle?.estado ? "Desactivar" : "Activar"}
        danger={!!doctorToToggle?.estado}
        onCancel={() => setIsToggleConfirmOpen(false)}
        onConfirm={confirmToggleStatus}
      />
    </div>
  );
};

export default DoctorsPage;