import { apiClient } from "../../../shared/utils/apiClient";

const ENDPOINT = "Turno";

let _turnoActivo = null;

export const turnService = {
  openTurn: async (userData, montoBase) => {
    const res = await apiClient.post(`${ENDPOINT}/abrir`, {
      usuarioId: userData.userId || userData.id,
      montoBase: parseFloat(montoBase),
      notas: null,
    });
    _turnoActivo = res.data;
    window.dispatchEvent(new CustomEvent("turn:opened", { detail: _turnoActivo }));
    return _turnoActivo;
  },

  closeTurn: async (closureData = {}) => {
    const turno = await turnService.getActiveTurn();
    if (!turno) throw new Error("No hay turno activo para cerrar");

    const res = await apiClient.post(`${ENDPOINT}/cerrar`, {
      id: turno.id,
      montoFinal: closureData.montoFinal || 0,
      notas: closureData.notas || null,
    });

    _turnoActivo = null;
    window.dispatchEvent(new CustomEvent("turn:closed", { detail: res.data }));
    return res.data;
  },

  getActiveTurn: async (usuarioId) => {
    try {
      const user = JSON.parse(sessionStorage.getItem("syspharma_user") || "{}");
      const uid = usuarioId || user?.id;
      if (!uid) return null;

      const res = await apiClient.get(`${ENDPOINT}/activo/${uid}`);
      _turnoActivo = res.data;
      return _turnoActivo;
    } catch {
      _turnoActivo = null;
      return null;
    }
  },

  getCachedTurn: () => _turnoActivo,

  hasActiveTurn: async (usuarioId) => {
    const turno = await turnService.getActiveTurn(usuarioId);
    return turno !== null;
  },

  getAllTurnsForAdmin: async () => {
    const res = await apiClient.get(ENDPOINT);
    return res.data;
  },

  validateOperationAllowed: async (user) => {
    const rol = String(user?.rol || "").toLowerCase().trim();
    if (rol === "cliente" || rol === "administrador") {
      return { valid: true, message: "" };
    }
    const turno = await turnService.getActiveTurn(user?.id);
    if (!turno) return { valid: false, message: "No hay turno activo. Debes abrir caja primero." };
    return { valid: true, message: "" };
  },

  calculateExpectedBalance: async () => {
    const turno = await turnService.getActiveTurn();
    if (!turno) return { saldoEsperado: 0, montoBase: 0, totalVentas: 0, totalGastos: 0 };
    return {
      montoBase: turno.montoBase,
      totalVentas: turno.totalVentas,
      totalGastos: turno.totalGastos,
      saldoEsperado: turno.montoBase + turno.totalVentas - turno.totalGastos,
    };
  },

  recordSale: () => {},
  recordExpense: () => {},
  recordMedicalService: () => {},
  getUserSales: () => [],
  getUserExpenses: () => [],
  getAllServices: () => [],
  getServicesByMedico: () => [],
  getEmployeesSummary: () => [],
  getMedicosSummary: () => [],
  clearActiveTurn: () => { _turnoActivo = null; },
  closeTurnAndLogout: async (closureData = {}) => {
    try {
      await turnService.closeTurn(closureData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
};