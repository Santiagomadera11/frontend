import { apiClient as api } from '../../shared/utils/apiClient';

export const rolesService = {
  getAll: () => api.get('/rolmaestro'),

  getById: (id) => api.get(`/rolmaestro/${id}`),

  save: (data) => data.id ? api.put('/rolmaestro', data) : api.post('/rolmaestro', data),

  delete: (id) => api.delete(`/rolmaestro/${id}`),

  updateStatus: (id, data) => api.patch(`/rolmaestro/${id}/estado`, data),

  getPermisos: (id) => api.get(`/rolmaestro/${id}/permisos`),

  assignPermisos: (id, permisos) => api.post(`/rolmaestro/${id}/permisos`, permisos),
};

export default rolesService;