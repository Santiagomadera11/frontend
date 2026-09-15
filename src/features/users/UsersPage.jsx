import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState, useEffect } from "react";
import {
  Search, Plus, Eye, Edit, Trash2,
  CheckCircle,
} from "lucide-react";
import { userService } from "./services/userService";
import { UserFormModal } from "./components/UserFormModal";
import UserDetailModal from "./components/UserDetailModal";
import { StatusNotification } from "/src/shared/ui/StatusNotification";
import { ConfirmDialog } from "/src/shared/ui/ConfirmDialog";
import { Pagination } from "/src/shared/ui/Pagination";

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleColorMap, setRoleColorMap] = useState({});
  const { currentUser } = useCurrentUser();
  const userPerms = currentUser.permisos || [];
  const userRole = (currentUser.rol || "").toLowerCase();
  const isAdmin = userRole === "administrador";

  const canCreateUser = isAdmin || userPerms.includes("users.create");
  const canEditUser   = isAdmin || userPerms.includes("users.edit");
  const canDeleteUser = isAdmin || userPerms.includes("users.delete");
  const canViewDetail    = isAdmin || userPerms.includes("users.view");
  const canToggleStatus  = isAdmin || userPerms.includes("users.status");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, user: null });
  const [confirmStatus, setConfirmStatus] = useState({ show: false, user: null });
  const [currentPage, setCurrentPage] = useState(0);

  const itemsPerPage = 10;

  useEffect(() => {
    loadUsers();
    loadRoleColors();
    const onRolesChanged = () => { loadUsers(); loadRoleColors(); };
    window.addEventListener("rolesChanged", onRolesChanged);
    return () => window.removeEventListener("rolesChanged", onRolesChanged);
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
    } catch {
      setNotification({ message: "Error al cargar usuarios", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const loadRoleColors = async () => {
    try {
      const roles = await userService.getRoles();
      const colorMap = {};
      const savedColors = JSON.parse(localStorage.getItem("syspharma_role_colors") || "{}");
      const defaultColors = { "Administrador": "#4fd1c5", "Empleado": "#3b82f6" };
      const palette = ["#4fd1c5", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280"];
      roles.forEach((r, i) => {
        const key = (r.nombre || "").toLowerCase();
        colorMap[key] = savedColors[r.nombre]
          ? (["#4fd1c5","#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#6b7280"].includes(savedColors[r.nombre]) ? savedColors[r.nombre] : palette[i % palette.length])
          : (defaultColors[r.nombre] || palette[i % palette.length]);
      });
      setRoleColorMap(colorMap);
    } catch { /* silencioso */ }
  };

  const handleOpenCreate = () => { setEditingUser(null); setIsModalOpen(true); };
  const handleOpenEdit = (user) => { setEditingUser(user); setIsModalOpen(true); };
  const handleOpenDetail = (user) => { setDetailUser(user); setIsDetailOpen(true); };

  const handleSaveUser = async (formData) => {
    try {
        if (editingUser) {
          await userService.update({ ...formData, id: editingUser.id });
          setNotification({ message: "Usuario actualizado correctamente", type: "success" });
        } else {
          await userService.create(formData);
          setNotification({ message: "Usuario creado correctamente", type: "success" });
        }
        await loadUsers();
        setIsModalOpen(false);
    } catch {
        setNotification({ message: "Error al guardar usuario", type: "error" });
    }
  };

  const handleToggleStatus = (user) => {
    if (user.estado && (user.rol || "").toLowerCase() === "administrador") {
      setNotification({ message: "No se puede desactivar a un usuario con rol Administrador", type: "error" });
      return;
    }
    setConfirmStatus({ show: true, user });
  };

  const confirmToggleStatus = async () => {
    if (!confirmStatus.user) return;
    try {
      await userService.toggleStatus(confirmStatus.user.id, confirmStatus.user.estado);
      await loadUsers();
      const newStatus = !confirmStatus.user.estado;
      setNotification({
        message: `${confirmStatus.user.nombre} ahora está ${newStatus ? "Activo" : "Inactivo"}`,
        type: newStatus ? "success" : "warning",
      });
    } catch (error) {
      setNotification({ message: error?.response?.data?.message || "Error al cambiar estado", type: "error" });
    } finally {
      setConfirmStatus({ show: false, user: null });
    }
  };

  const handleDelete = (user) => setConfirmDelete({ show: true, user });

  const confirmDeleteUser = async () => {
    try {
      await userService.delete(confirmDelete.user.id); 
      setUsers(prev => prev.filter(u => u.id !== confirmDelete.user.id));
      setNotification({ message: `${confirmDelete.user.nombre} ha sido eliminado permanentemente`, type: "success" });
    } catch {
      setNotification({ message: "Error al eliminar usuario", type: "error" });
    } finally {
      setConfirmDelete({ show: false, user: null });
    }
  };

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase().trim();
    if (filterStatus === "active" && !u.estado) return false;
    if (filterStatus === "inactive" && u.estado) return false;
    if (!term) return true;
    return (
      u.nombre?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.rol?.toLowerCase().includes(term) ||
      u.documento?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const displayedUsers = filteredUsers.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const hexToRgba = (hex, alpha = 1) => {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="h-full flex flex-col gap-3 font-sans">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Usuarios</h1>
          <p className="text-gray-500 text-xs">Gestión de personal y clientes</p>
        </div>
        {canCreateUser && (
          <button onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg font-bold shadow-sm text-xs flex items-center gap-1.5">
            <Plus size={16} /> Nuevo
          </button>
        )}
      </div>

      <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 flex-shrink-0">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-300 text-xs bg-gray-50 focus:bg-white" />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(0); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-xs">
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
        <div className="overflow-auto no-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Cargando usuarios...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-emerald-600 text-white text-xs uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 font-semibold">ID</th>
                  <th className="px-3 py-3 font-semibold">Usuario</th>
                  <th className="px-3 py-3 font-semibold">Email</th>
                  <th className="px-3 py-3 font-semibold">Rol</th>
                  <th className="px-3 py-3 font-semibold">Documento</th>
                  <th className="px-3 py-3 font-semibold text-center">Estado</th>
                  <th className="px-3 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {displayedUsers.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">No se encontraron usuarios</td></tr>
                ) : (
                  displayedUsers.map((user, idx) => {
                    const col = roleColorMap[(user.rol || "").toLowerCase()];
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5 font-mono">{currentPage * itemsPerPage + idx + 1}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full border border-gray-200 flex-shrink-0 flex items-center justify-center bg-gray-100 text-gray-600 font-bold text-xs overflow-hidden">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.nombre} className="w-full h-full object-cover" />
                              ) : (
                                user.nombre?.charAt(0)
                              )}
                            </div>
                            <span className="font-bold text-gray-700 truncate max-w-[140px]">{user.nombre}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-gray-500">{user.email}</td>
                        <td className="px-3 py-2.5">
                          {col ? (
                            <span style={{ backgroundColor: hexToRgba(col, 0.12), color: col, border: `1px solid ${hexToRgba(col, 0.18)}` }}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold">{user.rol}</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">{user.rol}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-gray-500 font-mono">{user.documento || "---"}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${user.estado ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                            {user.estado ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canViewDetail && (
                              <button onClick={() => handleOpenDetail(user)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors" title="Ver detalle">
                                <Eye size={16} />
                              </button>
                            )}
                            {canToggleStatus && (
                              (() => {
                                const isLockedAdmin = user.estado && (user.rol || "").toLowerCase() === "administrador";
                                return (
                                  <button
                                    onClick={() => handleToggleStatus(user)}
                                    className={`p-1.5 rounded-md transition-colors ${isLockedAdmin ? "text-gray-300 cursor-not-allowed" : "text-emerald-600 hover:bg-emerald-50"}`}
                                    title={isLockedAdmin ? "No se puede desactivar al Administrador" : "Cambiar estado"}
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                );
                              })()
                            )}
                            {canEditUser && (
                              <button onClick={() => handleOpenEdit(user)} className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors" title="Editar">
                                <Edit size={16} />
                              </button>
                            )}
                            {canDeleteUser && (
                              <button onClick={() => handleDelete(user)} className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {filteredUsers.length > 0 && (
          <Pagination
            currentPage={currentPage + 1}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p - 1)}
            totalItems={filteredUsers.length}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>

      <UserFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveUser} userToEdit={editingUser} />
      <UserDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} user={detailUser} />

      {notification && <StatusNotification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

      <ConfirmDialog
        open={confirmDelete.show && !!confirmDelete.user}
        title="Eliminar Registro"
        message={confirmDelete.user ? `¿Estás seguro de eliminar a "${confirmDelete.user.nombre}"?` : ""}
        subMessage="Esta acción borrará al usuario permanentemente de la base de datos."
        confirmText="Eliminar ahora"
        danger
        onCancel={() => setConfirmDelete({ show: false, user: null })}
        onConfirm={confirmDeleteUser}
      />

      <ConfirmDialog
        open={confirmStatus.show && !!confirmStatus.user}
        title={confirmStatus.user?.estado ? "Desactivar Usuario" : "Activar Usuario"}
        message={confirmStatus.user ? (confirmStatus.user.estado ? `¿Deseas desactivar el acceso de "${confirmStatus.user.nombre}"?` : `¿Deseas activar el acceso de "${confirmStatus.user.nombre}"?`) : ""}
        subMessage=""
        confirmText={confirmStatus.user?.estado ? "Desactivar" : "Activar"}
        danger={!!confirmStatus.user?.estado}
        onCancel={() => setConfirmStatus({ show: false, user: null })}
        onConfirm={confirmToggleStatus}
      />
    </div>
  );
};