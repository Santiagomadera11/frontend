import { useCurrentUser } from "/src/shared/context/UserContext";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

const getDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const CalendarPicker = ({
  selectedDate,
  onDateSelect,
  disabledDates = [],
  minDate,
  maxDate,
}) => {
  const { currentUser } = useCurrentUser();
  const currentUserRole = (currentUser.rol || "Empleado").toLowerCase();
  const isEmployeePanel = currentUserRole === "empleado";
  const selectedBgClass = isEmployeePanel ? "bg-blue-600" : "bg-emerald-600";
  const selectedBorderClass = isEmployeePanel ? "border-blue-700" : "border-emerald-700";
  const hoverBgClass = isEmployeePanel ? "hover:bg-blue-50" : "hover:bg-emerald-50";
  const hoverBorderClass = isEmployeePanel ? "hover:border-blue-300" : "hover:border-emerald-300";
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      const [year, month] = selectedDate.split("-");
      return new Date(parseInt(year), parseInt(month) - 1);
    }
    return new Date();
  });

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    const today = new Date();
    if (currentMonth > today) {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
      );
    }
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  // Retorna información sobre si la fecha está deshabilitada y la razón (si aplica)
  const getDisabledInfo = (day) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    const dateStr = getDateString(date);

    // Validar rango de fechas
    if (minDate) {
  const [y, m, d] = minDate.split("-").map(Number);
  const minDateLocal = new Date(y, m - 1, d);
  if (date < minDateLocal) return { disabled: true, reason: "min" };
  }
  if (maxDate) {
    const [y, m, d] = maxDate.split("-").map(Number);
    const maxDateLocal = new Date(y, m - 1, d);
    if (date > maxDateLocal) return { disabled: true, reason: "max" };
  }

    if (!disabledDates || disabledDates.length === 0)
      return { disabled: false };

    // disabledDates puede ser array de strings o array de objetos { date, reason }
    const foundObj = disabledDates.find((d) => {
      if (!d) return false;
      if (typeof d === "string") return d === dateStr;
      if (typeof d === "object" && d.date) return d.date === dateStr;
      return false;
    });

    if (foundObj) {
      const reason =
        typeof foundObj === "string"
          ? "farmacia"
          : foundObj.reason || "farmacia";
      return { disabled: true, reason };
    }

    return { disabled: false };
  };

  const handleDateClick = (day) => {
    const disabledInfo = getDisabledInfo(day);
    if (!disabledInfo.disabled) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day,
      );
      onDateSelect(getDateString(date));
    }
  };

  const days = [];
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  // Agregar celdas vacías al inicio
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Agregar días del mes
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = currentMonth.toLocaleString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 rounded text-gray-600"
          type="button"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-sm font-semibold text-gray-700 capitalize">
          {monthName}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 rounded text-gray-600"
          type="button"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((dayName) => (
          <div
            key={dayName}
            className="text-center text-[10px] font-semibold text-gray-500 py-1"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const disabledInfo = getDisabledInfo(day);
          const isDisabled = !!disabledInfo.disabled;
          const isSelected =
            selectedDate ===
            getDateString(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                day,
              ),
            );

          // Determinar clases según motivo
          let badgeClass =
            `bg-white text-gray-700 border border-gray-200 ${hoverBgClass} ${hoverBorderClass}`;
          let title = "";

          if (isSelected) {
            badgeClass = `${selectedBgClass} text-white border ${selectedBorderClass}`;
          } else if (isDisabled) {
            const reason = String(disabledInfo.reason || "").toLowerCase();
            if (reason.includes("doctor") || reason.includes("medic")) {
              badgeClass =
                "bg-red-200 text-red-800 border border-red-300 cursor-not-allowed";
              title = "Médico no disponible";
            } else if (
              reason.includes("farmacia") ||
              reason.includes("pharmacy") ||
              reason.includes("global")
            ) {
              badgeClass =
                "bg-amber-200 text-amber-800 border border-amber-300 cursor-not-allowed";
              title = "Farmacia / sistema no disponible";
            } else {
              badgeClass =
                "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200";
              title = "No disponible";
            }
          }

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              type="button"
              className={`
                aspect-square rounded-lg text-xs font-medium
                transition-all duration-150
                flex items-center justify-center
                ${badgeClass}
              `}
              title={title}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded ${selectedBgClass}`} />
          <span className="text-[10px] text-gray-600">Día seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-200 border border-amber-300" />
          <span className="text-[10px] text-gray-600">
            No disponible (Farmacia / sistema)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-200 border border-red-300" />
          <span className="text-[10px] text-gray-600">
            No disponible (Médico)
          </span>
        </div>
      </div>
    </div>
  );
};

export default CalendarPicker;
