import { apiClient } from "../../../shared/utils/apiClient";

const ENDPOINT = "Turno";

// Cache en memoria del turno activo (se pierde al recargar, se restaura con getActiveTurn)
let _turnoActivo = null;

export const turnService = {
  // ── Abrir turno ──────────────────────────────────────────────
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

  // ── Cerrar turno ─────────────────────────────────────────────
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

  // ── Obtener turno activo del usuario ─────────────────────────
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

  // ── Cache en memoria (sin llamada al servidor) ───────────────
  getCachedTurn: () => _turnoActivo,

  // ── Verificar si hay turno activo ────────────────────────────
  hasActiveTurn: async (usuarioId) => {
    const turno = await turnService.getActiveTurn(usuarioId);
    return turno !== null;
  },

  // ── Obtener todos los turnos (admin) ─────────────────────────
  getAllTurnsForAdmin: async () => {
    const res = await apiClient.get(ENDPOINT);
    return res.data;
  },

  // ── Validar si se puede operar ───────────────────────────────
  validateOperationAllowed: async (user) => {
    // Clientes y Administradores no necesitan turno
    if (user?.rol === "Cliente" || user?.rol === "Administrador") {
      return { valid: true, message: "" };
    }
    // Los empleados sí necesitan turno activo
    const turno = await turnService.getActiveTurn(user?.id);
    if (!turno) return { valid: false, message: "No hay turno activo. Debes abrir caja primero." };
    return { valid: true, message: "" };
  },

  // ── Calcular saldo esperado ───────────────────────────────────
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

  // ── Compatibilidad con código anterior ───────────────────────
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