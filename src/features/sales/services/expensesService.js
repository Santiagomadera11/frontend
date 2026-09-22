import { apiClient } from "../../../shared/utils/apiClient";

const API_URL = "/api";

const getToken = () => {
  return sessionStorage.getItem("syspharma_token") || "";
};

const headers = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getToken()}`
});

export const expensesService = {
  getTodayExpenses: async (usuarioId = null) => {
    const url = usuarioId 
      ? `${API_URL}/gasto/today?usuarioId=${usuarioId}`
      : `${API_URL}/gasto/today`;
    
    const res = await apiClient.get(url, { headers: headers() });
    return res.data?.data || [];
  },

  getKpis: async (fecha = null) => {
    const url = fecha 
      ? `${API_URL}/gasto/kpis?fecha=${fecha.toISOString().split('T')[0]}`
      : `${API_URL}/gasto/kpis`;
    
    const res = await apiClient.get(url, { headers: headers() });
    return res.data?.data;
  },

  create: async (gastoData) => {
    
    const res = await apiClient.post(`${API_URL}/gasto`, gastoData, { headers: headers() });
    return res.data;
  },

  delete: async (id) => {
    const res = await apiClient.put(`${API_URL}/gasto/${id}/anular`, "Gasto anulado desde caja", { headers: headers() });
    return res.data;
  },

  deleteHard: async (id) => {
    const res = await apiClient.delete(`${API_URL}/gasto/${id}`, { headers: headers() });
    return res.data;
  },

  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_URL}/gasto?${query}` : `${API_URL}/gasto`;
    
    const res = await apiClient.get(url, { headers: headers() });
    return res.data;
  },

  getByDate: async (date) => {
    const url = `${API_URL}/gasto/fecha/${date.toISOString().split('T')[0]}`;
    const res = await apiClient.get(url, { headers: headers() });
    return res.data;
  },

  getByTurn: async (turnoId) => {
    const url = `${API_URL}/gasto/turno/${turnoId}`;
    const res = await apiClient.get(url, { headers: headers() });
    return res.data;
  },

  getExpensesByDate: async (date) => {
    try {
      const data = await expensesService.getByDate(date);
      return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      console.error("Error filtrando gastos por fecha:", error);
      return [];
    }
  },

  getExpensesByTurn: async (turnoId) => {
    try {
      const data = await expensesService.getByTurn(turnoId);
      return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      console.error("Error obteniendo gastos del turno:", error);
      return [];
    }
  }
};