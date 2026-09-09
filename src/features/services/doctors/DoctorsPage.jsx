import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight,
  Eye, AlertCircle, CheckCircle, X,
} from "lucide-react";
import { doctorService } from "./services/doctorService";
import DoctorFormModal from "./components/DoctorFormModal";
import { StatusNotification } from "/src/shared/ui/StatusNotification";

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
  const itemsPerPage = 5;
  const { currentUser } = useCurrentUser();
  const userRole = (currentUser.rol || "").toLowerCase().trim();
  const userPerms = (currentUser.permisos || []).map((perm) => String(perm || "").toLowerCase().trim());
  const isAdmin = userRole === "administrador";
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
      {/* Header */}
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-emerald-700">Gestión de Médicos</h1>
          <p className="text-gray-500 text-xs mt-0.5">Administra el registro completo de profesionales médicos</p>
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex gap-4 flex-shrink-0 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Buscar por nombre, especialidad o email..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }} />
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(0); }}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white">
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        {canCreate && (
          <button onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2">
            <Plus size={16} /> Nuevo Médico
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto no-scrollbar bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">Cargando médicos...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-emerald-600 text-white sticky top-0">
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
                        <button onClick={() => handleViewDetail(doctor)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors" title="Ver detalle">
                          <Eye size={16} />
                        </button>
                        {canChangeStatus && (
                          <button onClick={() => handleToggleStatus(doctor)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors" title="Cambiar estado">
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

      {/* Paginación */}
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
                className={`px-3 py-1 rounded text-sm font-medium ${currentPage === i ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage === totalPages - 1}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"><ChevronRight size={20} /></button>
          </div>
        </div>
      )}

      {/* Modal Formulario */}
      <DoctorFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingDoctor(null); }}
        onSave={handleSaveDoctor} doctor={editingDoctor} />

      {/* Notificación */}
      {notification && <StatusNotification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

      {/* Modal Detalle */}
      {isDetailModalOpen && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between border-b border-emerald-100 bg-emerald-50">
              <h2 className="text-lg font-semibold text-emerald-900">{selectedDoctor.nombre}</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Especialidad", value: selectedDoctor.especialidad },
                { label: "Documento", value: selectedDoctor.documento },
                { label: "Email", value: selectedDoctor.email },
                { label: "Teléfono", value: selectedDoctor.telefono },
              ].map(({ label, value }) => value && (
                <div key={label}>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">{label}</label>
                  <p className="text-sm text-gray-900 font-medium">{value}</p>
                </div>
              ))}
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                <p className="text-xs text-emerald-700 font-medium">
                  💡 El horario detallado se configura desde la pestaña <strong>Disponibilidad</strong>.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t flex justify-end">
              <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-red-50 px-5 py-3 border-b border-red-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><AlertCircle size={18} className="text-red-600" />Eliminar Médico</h3>
              <button onClick={() => setShowDeleteConfirm(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700">¿Eliminar al médico <strong>"{showDeleteConfirm.nombre}"</strong>?</p>
              <p className="text-xs text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
            </div>
            <div className="bg-red-50 px-5 py-3 border-t border-red-200 flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md">Cancelar</button>
              <button onClick={confirmDelete} className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center gap-1">
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Toggle Estado */}
      {isToggleConfirmOpen && doctorToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className={`px-5 py-3 border-b flex justify-between items-center ${doctorToToggle.estado ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                {doctorToToggle.estado ? <AlertCircle size={18} className="text-red-600" /> : <CheckCircle size={18} className="text-green-600" />}
                {doctorToToggle.estado ? "Desactivar Médico" : "Activar Médico"}
              </h3>
              <button onClick={() => setIsToggleConfirmOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700">
                {doctorToToggle.estado ? `¿Desactivar al médico "${doctorToToggle.nombre}"?` : `¿Activar al médico "${doctorToToggle.nombre}"?`}
              </p>
            </div>
            <div className={`px-5 py-3 border-t flex justify-end gap-2 ${doctorToToggle.estado ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
              <button onClick={() => setIsToggleConfirmOpen(false)} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md">Cancelar</button>
              <button onClick={confirmToggleStatus}
                className={`px-4 py-2 text-xs font-bold text-white rounded-md ${doctorToToggle.estado ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>
                {doctorToToggle.estado ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsPage;