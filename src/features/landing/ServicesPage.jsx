import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Stethoscope, Clock, DollarSign, Tag, Search, CalendarCheck } from "lucide-react";
import { PublicLayout } from "./PublicLayout";
import { apiClient } from "../../shared/utils/apiClient";

const API_URL = "/api/Servicio";

const getCategoryIcon = (categoria) => {
  const cat = (categoria || "").toLowerCase();
  if (cat.includes("vacu") || cat.includes("inyec")) return "💉";
  if (cat.includes("médic") || cat.includes("medic") || cat.includes("consul")) return "🩺";
  if (cat.includes("presión") || cat.includes("presion")) return "🩸";
  if (cat.includes("odont") || cat.includes("dental")) return "🦷";
  if (cat.includes("nutri")) return "🥗";
  return "⚕️";
};

export const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get(API_URL);
        const data = Array.isArray(res.data) ? res.data : [];
        setServices(data.filter((s) => s.estado));
      } catch {
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categories = [
    "Todas",
    ...Array.from(new Set(services.map((s) => s.categoriaNombre).filter(Boolean))),
  ];

  const filtered = services.filter((srv) => {
    const matchSearch =
      (srv.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (srv.categoriaNombre || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === "Todas" || srv.categoriaNombre === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <PublicLayout>
      {/* Banner cita */}
      <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-sm text-emerald-700">
          <CalendarCheck size={16} className="shrink-0" />
          <span>
            ¿Quieres agendar una cita?{" "}
            <Link to="/registro" className="font-semibold underline hover:text-emerald-900 transition-colors">
              Regístrate gratis
            </Link>{" "}
            y agenda en minutos.
          </span>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-emerald-700 text-white py-16 px-4 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-white/20 rounded-full p-4">
            <Stethoscope size={40} className="text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-3">Nuestros Servicios</h1>
        <p className="text-emerald-100 text-lg max-w-xl mx-auto">
          Atención profesional y personalizada para tu salud y bienestar.
          Contamos con un equipo de expertos listos para ayudarte.
        </p>
      </div>

      {/* Contenido */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Stethoscope size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No se encontraron servicios</p>
            <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5">
              Mostrando <span className="font-semibold text-gray-700">{filtered.length}</span> servicio{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-emerald-100 transition-colors">
                      {getCategoryIcon(srv.categoriaNombre)}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-medium border border-emerald-100">
                      <Tag size={10} />
                      {srv.categoriaNombre || "General"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-800 mb-2 group-hover:text-emerald-700 transition-colors">
                    {srv.nombre}
                  </h3>
                  {srv.descripcion && (
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                      {srv.descripcion}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-emerald-600">
                      <DollarSign size={14} />
                      <span className="text-sm font-bold">
                        {Number(srv.precio).toLocaleString("es-CO")}
                      </span>
                    </div>
                    {srv.duracion && (
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <Clock size={12} />
                        <span>{srv.duracion} min</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
};

export default ServicesPage;