import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Vitamina C",
    presentation: "FRASCO 500 ML",
    image:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde0f?w=200&h=200&fit=crop",
    currentPrice: 24.99,
    originalPrice: 34.99,
    discount: -20,
  },
  {
    id: 2,
    name: "Protector Solar",
    presentation: "TUBO 50 ML",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&h=200&fit=crop",
    currentPrice: 18.5,
    originalPrice: 28.5,
    discount: -35,
  },
  {
    id: 3,
    name: "Vitaminas B12",
    presentation: "CAJA 30 CAPS",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop",
    currentPrice: 15.99,
    originalPrice: 22.99,
    discount: -30,
  },
  {
    id: 4,
    name: "Suero Fisiológico",
    presentation: "BOTELLA 250 ML",
    image:
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&h=200&fit=crop",
    currentPrice: 12.0,
    originalPrice: 16.0,
    discount: -25,
  },
  {
    id: 5,
    name: "Crema Hidratante",
    presentation: "FRASCO 200 ML",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&h=200&fit=crop",
    currentPrice: 22.5,
    originalPrice: 35.0,
    discount: -36,
  },
  {
    id: 6,
    name: "Pastillas para Tos",
    presentation: "CAJA 20 UNIDADES",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop",
    currentPrice: 8.99,
    originalPrice: 12.99,
    discount: -30,
  },
  {
    id: 7,
    name: "Complejo B",
    presentation: "FRASCO 60 CAPS",
    image:
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&h=200&fit=crop",
    currentPrice: 19.99,
    originalPrice: 28.99,
    discount: -31,
  },
  {
    id: 8,
    name: "Gel Antibacterial",
    presentation: "BOTELLA 500 ML",
    image:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde0f?w=200&h=200&fit=crop",
    currentPrice: 6.5,
    originalPrice: 9.99,
    discount: -35,
  },
];

export const DailyOffersCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 4;
  const totalPages = Math.ceil(products.length / itemsPerView);

  const prev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? totalPages - 1 : prevIndex - 1,
    );
  };

  const next = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === totalPages - 1 ? 0 : prevIndex + 1,
    );
  };

  const visibleProducts = products.slice(
    currentIndex * itemsPerView,
    currentIndex * itemsPerView + itemsPerView,
  );

  return (
    <div className="w-full bg-white py-10 rounded-lg">
      <div className="max-w-6xl mx-auto px-4">
        {/* Título */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Ofertas del Día
          </h2>
          <p className="text-gray-600 text-sm">
            Descuentos especiales en productos seleccionados
          </p>
        </div>

        {/* Carrusel Container */}
        <div className="relative group">
          {/* Productos Grid */}
          <div className="grid grid-cols-4 gap-6">
            {visibleProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col group/card"
              >
                {/* Imagen Container */}
                <div className="relative bg-gray-50 h-48 flex items-center justify-center overflow-hidden">
                  {/* Badge de Descuento */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg">
                      {product.discount}%
                    </span>
                  </div>

                  {/* Imagen */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-40 w-40 object-cover group-hover/card:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Contenido */}
                <div className="p-4 flex flex-col flex-grow">
                  {/* Nombre y Presentación */}
                  <h3 className="font-bold text-gray-900 text-sm mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    {product.presentation}
                  </p>

                  {/* Precios */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl font-bold text-blue-600">
                      ${product.currentPrice.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Botón AGREGAR */}
                  <button className="w-full mt-auto bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                    <ShoppingCart size={16} />
                    AGREGAR
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Flechas Laterales */}
          <button
            onClick={prev}
            className="absolute -left-5 top-1/2 transform -translate-y-1/2 p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            onClick={next}
            className="absolute -right-5 top-1/2 transform -translate-y-1/2 p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Indicadores de Página */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-blue-600 w-8"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyOffersCarousel;
