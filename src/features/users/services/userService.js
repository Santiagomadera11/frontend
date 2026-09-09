import { apiClient } from "../../../shared/utils/apiClient";

const API_BASE = import.meta.env.VITE_API_URL || "https://syspharma-backend.onrender.com";
const USER_ENDPOINT = "Usuario";
const ROLES_ENDPOINT = "RolMaestro";

const mapUser = (u) => ({
  ...u,
  rol: u.rolNombre || u.rol || "",
  estado: u.estado,
  tipoDocumentoId: u.tipoDocumentoId || null,
  tipoDocumento: u.tipoDocumento || "",
  // ✅ Si tiene avatar real del backend usa URL completa, si no usa DiceBear
  avatar: u.avatar
    ? u.avatar.startsWith("http")
      ? u.avatar
      : `${API_BASE}${u.avatar}`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.nombre || u.id)}`,
});

export const userService = {
  getAll: async () => {
    const res = await apiClient.get(USER_ENDPOINT);
    return res.data.map(mapUser);
  },

  getById: async (id) => {
    const res = await apiClient.get(`${USER_ENDPOINT}/${id}`);
    return mapUser(res.data);
  },

  getRoles: async () => {
    const res = await apiClient.get(ROLES_ENDPOINT);
    return res.data;
  },

  create: async (userData) => {
    const payload = {
      nombre: `${userData.nombres || ""} ${userData.apellidos || ""}`.trim() || userData.nombre,
      email: userData.email,
      tipoDocumentoId: userData.tipoDocumentoId ? Number(userData.tipoDocumentoId) : null,
      documento: userData.documento || null,
      telefono: userData.telefono || null,
      rolId: Number(userData.rolId),
      estado: typeof userData.estado === "boolean" ? userData.estado : true,
      contrasena: userData.password,
    };
    const res = await apiClient.post(USER_ENDPOINT, payload);
    return mapUser(res.data);
  },

  update: async (userData) => {
    const payload = {
      id: userData.id,
      nombre: `${userData.nombres || ""} ${userData.apellidos || ""}`.trim() || userData.nombre,
      email: userData.email,
      tipoDocumentoId: userData.tipoDocumentoId ? Number(userData.tipoDocumentoId) : null,
      documento: userData.documento || null,
      telefono: userData.telefono || null,
      rolId: Number(userData.rolId),
      estado: typeof userData.estado === "boolean" ? userData.estado : true,
    };
    const res = await apiClient.put(USER_ENDPOINT, payload);
    return mapUser(res.data);
  },

  toggleStatus: async (id, estadoActual) => {
    const res = await apiClient.patch(`${USER_ENDPOINT}/${id}/estado`, !estadoActual);
    return res.data;
  },

  delete: async (id) => {
    await apiClient.delete(`${USER_ENDPOINT}/${id}`);
  },

  uploadFoto: async (userId, file) => {
    const formData = new FormData();
    formData.append("foto", file);
    
    const token = sessionStorage.getItem("syspharma_token");
    const response = await apiClient.post(`/api/Usuario/${userId}/foto`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = response.data;

    // ✅ Devolver URL completa para que sessionStorage quede bien
    return {
      avatar: data.avatar.startsWith("http")
        ? data.avatar
        : `${API_BASE}${data.avatar}`
    };
  },
};