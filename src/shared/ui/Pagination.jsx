import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ACCENTS = {
  emerald: { active: "bg-emerald-600 text-white shadow-sm" },
  blue: { active: "bg-blue-600 text-white shadow-sm" },
};

const getPageWindow = (currentPage, totalPages) => {
  const maxButtons = 5;
  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let end = start + maxButtons - 1;
  if (end > totalPages) {
    end = totalPages;
    start = end - maxButtons + 1;
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  accentColor = "emerald",
  className = "",
}) => {
  const accent = ACCENTS[accentColor] || ACCENTS.emerald;
  const safeTotalPages = totalPages || 1;
  const pages = getPageWindow(currentPage, safeTotalPages);

  const rangeLabel =
    totalItems !== undefined && itemsPerPage
      ? (() => {
          if (totalItems === 0) return "Sin resultados";
          const from = (currentPage - 1) * itemsPerPage + 1;
          const to = Math.min(currentPage * itemsPerPage, totalItems);
          return `Mostrando ${from}–${to} de ${totalItems}`;
        })()
      : `Página ${currentPage} de ${safeTotalPages}`;

  return (
    <div className={`bg-gray-50 px-3 py-2 border-t border-gray-200 flex items-center justify-between flex-shrink-0 gap-2 ${className}`}>
      <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">{rangeLabel}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft size={14} className="text-gray-600" />
        </button>

        <div className="hidden md:flex gap-1">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                p === currentPage ? accent.active : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
          disabled={currentPage === safeTotalPages || totalPages === 0}
          className="p-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          <ChevronRight size={14} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
