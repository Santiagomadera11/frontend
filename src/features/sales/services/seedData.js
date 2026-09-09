import { salesService } from "./salesService";
import { expensesService } from "./expensesService";

export const seedSalesData = () => {
  // Eliminado: siembra de datos simulados. Solo se usarán datos reales del localStorage.
  return;
    const sampleExpenses = [
      {
        descripcion: "Alquiler de local",
        monto: 500000,
        categoria: "Transporte",
      },
      {
        descripcion: "Suministros de limpieza",
        monto: 50000,
        categoria: "Mantenimiento",
      },
      {
        descripcion: "Café para el personal",
        monto: 30000,
        categoria: "Comida",
      },
    ];

    sampleExpenses.forEach((expense) => {
      expensesService.create(expense);
    });
  }
};
