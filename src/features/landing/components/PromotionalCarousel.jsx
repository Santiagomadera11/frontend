import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const slides = [
  {
    id: 1,
    title: "Super Ofertas",
    subtitle: "Hasta 50% en productos seleccionados",
    cta: "Ver Ofertas",
    gradient: "bg-gradient-to-r from-teal-600 via-green-500 to-emerald-400",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop",
  },
  {
    id: 2,
    title: "Dermocosmética",
    subtitle: "Cuida tu piel con las mejores marcas premium",
    cta: "Explorar",
    gradient: "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&h=300&fit=crop",
  },
  {
    id: 3,
    title: "Vitaminas & Suplementos",
    subtitle: "Potencia tu salud y bienestar diario",
    cta: "Descubrir",
    gradient: "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400",
    image:
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&h=300&fit=crop",
  },
  {
    id: 4,
    title: "Medicinas Genéricas",
    subtitle: "Medicamentos de calidad a precios accesibles",
    cta: "Ver Catálogo",
    gradient: "bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-400",
    image:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde0f?w=300&h=300&fit=crop",
  },
];

export const PromotionalCarousel = () => {
  const [curr, setCurr] = useState(0);

  const prev = () =>
    setCurr((curr) => (curr === 0 ? slides.length - 1 : curr - 1));
  const next = () =>
    setCurr((curr) => (curr === slides.length - 1 ? 0 : curr + 1));

  useEffect(() => {
    const slideInterval = setInterval(next, 6000);
    return () => clearInterval(slideInterval);
  }, []);

  const goToSlide = (index) => setCurr(index);

  return (
    <div className="group relative overflow-hidden w-full h-72 bg-gray-100 rounded-3xl">
      {/* Slides Container */}
      <div
        className="flex h-full transition-transform ease-out duration-700"
        style={{ transform: `translateX(-${curr * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className={`w-full flex-shrink-0 h-full flex justify-between items-center px-10 md:px-16 text-white ${slide.gradient} rounded-3xl`}
          >
            {/* Contenido Izquierdo */}
            <div className="max-w-2xl flex-1">
              <h2 className="text-5xl font-extrabold mb-3 drop-shadow-lg leading-tight">
                {slide.title}
              </h2>
              <p className="text-lg opacity-95 mb-6 font-light drop-shadow-md">
                {slide.subtitle}
              </p>

              <div className="flex gap-3">
                <Link to="/servicios">
                  <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold hover:bg-gray-50 transition-all shadow-lg hover:scale-105 active:scale-95 text-sm">
                    Ver Servicios
                  </button>
                </Link>
                <button className="border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white/20 transition-all shadow-lg hover:scale-105 active:scale-95 text-sm backdrop-blur-sm">
                  {slide.cta}
                </button>
              </div>
            </div>

            {/* Imagen Derecha */}
            <div className="flex-1 flex justify-end items-center hidden md:flex">
              <img
                src={slide.image}
                alt={slide.title}
                className="h-72 w-80 object-cover rounded-2xl shadow-2xl drop-shadow-xl"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Dots Indicators - Bottom Center */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={`transition-all duration-300 rounded-full ${
              i === curr
                ? "bg-teal-500 w-8 h-3"
                : "bg-white/40 w-3 h-3 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Left Arrow */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-white/30 hover:bg-white/50 text-white border border-white/40 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Right Arrow */}
      <button
        onClick={next}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-white/30 hover:bg-white/50 text-white border border-white/40 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
};

export default PromotionalCarousel;
