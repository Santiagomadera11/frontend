import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const slides = [
  {
    id: 1,
    title: "Tu Salud Primero",
    desc: "Expertos cuidando de ti y tu familia.",
    gradient:
      "bg-gradient-to-r from-primary-900 via-primary-700 to-primary-400",
    image: null,
  },
  {
    id: 2,
    title: "Inyectología Segura",
    desc: "Profesionales capacitados en sede.",
    gradient: "bg-gradient-to-r from-blue-900 via-blue-700 to-blue-400",
    image: null,
  },
  {
    id: 3,
    title: "Dermocosmética",
    desc: "Cuida tu piel con las mejores marcas.",
    gradient: "bg-gradient-to-r from-teal-800 via-teal-600 to-primary-300",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop",
  },
];

export const HeroCarousel = () => {
  const [curr, setCurr] = useState(0);

  const prev = () =>
    setCurr((curr) => (curr === 0 ? slides.length - 1 : curr - 1));
  const next = () =>
    setCurr((curr) => (curr === slides.length - 1 ? 0 : curr + 1));

  useEffect(() => {
    const slideInterval = setInterval(next, 5000);
    return () => clearInterval(slideInterval);
  }, []);

  return (
    // Cambio: h-[380px] para hacerlo panorámico y corto
    <div className="relative overflow-hidden w-full h-[380px] bg-gray-100">
      <div
        className="flex transition-transform ease-out duration-700 h-full"
        style={{ transform: `translateX(-${curr * 100}%)` }}
      >
        {slides.map((s) => (
          <div
            key={s.id}
            className={`w-full flex-shrink-0 h-full flex flex-row justify-between items-center pl-10 md:pl-20 pr-10 text-white ${s.gradient}`}
          >
            {/* Contenido izquierdo */}
            <div className="max-w-xl animate-fade-in-up flex-1">
              <span className="bg-white/20 text-white px-3 py-0.5 rounded-full text-xs font-bold backdrop-blur-sm mb-3 inline-block border border-white/30">
                Novedades
              </span>
              {/* Textos más pequeños */}
              <h1 className="text-4xl font-extrabold mb-3 leading-tight drop-shadow-sm">
                {s.title}
              </h1>
              <p className="text-lg opacity-90 mb-6 font-light">{s.desc}</p>

              {/* Botones */}
              <div className="flex gap-3">
                <Link to="/servicios">
                  <button className="bg-white text-primary-900 px-6 py-2 rounded-full font-bold hover:bg-gray-50 transition-all shadow-lg hover:scale-105 active:scale-95 text-sm">
                    Ver Servicios
                  </button>
                </Link>
                <button className="border-2 border-white text-white px-6 py-2 rounded-full font-bold hover:bg-white/10 transition-all shadow-lg hover:scale-105 active:scale-95 text-sm backdrop-blur-sm">
                  Ver Ofertas
                </button>
              </div>
            </div>

            {/* Imagen derecha (solo en slide de Dermocosmética) */}
            {s.image && (
              <div className="flex-1 flex justify-end items-center">
                <img
                  src={s.image}
                  alt={s.title}
                  className="h-80 w-80 object-cover rounded-2xl shadow-2xl"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 left-6 md:left-20 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurr(i)}
            className={`transition-all duration-300 rounded-full ${
              i === curr
                ? "bg-white w-8 h-2"
                : "bg-white/40 w-2 h-2 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      <div className="absolute bottom-6 right-6 flex gap-2 z-10">
        <button
          onClick={prev}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm transition"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={next}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm transition"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};
