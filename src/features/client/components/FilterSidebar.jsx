import React, { useState, useEffect } from "react";

export const FilterSidebar = ({
  selectedCategory,
  onCategoryChange,
  onPriceChange,
}) => {
  const [categories, setCategories] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    // Cargar categorías del localStorage
    try {
      const products = JSON.parse(
        localStorage.getItem("syspharma_products") || "[]",
      );
      const uniqueCategories = [
        ...new Set(products.map((p) => p.categoria).filter(Boolean)),
      ].sort();
      setCategories(uniqueCategories);
    } catch {
      setCategories([]);
    }
  }, []);

  const handleMinhPrice = (e) => {
    const val = e.target.value;
    setMinPrice(val);
  };

  const handleMaxPrice = (e) => {
    const val = e.target.value;
    setMaxPrice(val);
  };

  const applyPriceFilter = () => {
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : 500000;
    onPriceChange([min, max]);
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    onPriceChange([0, 500000]);
    onCategoryChange(null);
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-200 p-6 min-h-screen overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-900 mb-8">Filtros</h2>

      {/* Categories Section */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">
          Categorías
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="category"
              value=""
              checked={selectedCategory === null}
              onChange={() => onCategoryChange(null)}
              className="w-4 h-4 text-emerald-600 cursor-pointer"
            />
            <span className="text-gray-700 text-sm group-hover:text-emerald-600 transition">
              Todos
            </span>
          </label>

          {categories.map((category) => (
            <label
              key={category}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="radio"
                name="category"
                value={category}
                checked={selectedCategory === category}
                onChange={() => onCategoryChange(category)}
                className="w-4 h-4 text-emerald-600 cursor-pointer"
              />
              <span className="text-gray-700 text-sm group-hover:text-emerald-600 transition capitalize">
                {category}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Section */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">
          Rango de precio
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1 font-medium">
              Mínimo
            </label>
            <input
              type="number"
              placeholder="$0"
              value={minPrice}
              onChange={handleMinhPrice}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1 font-medium">
              Máximo
            </label>
            <input
              type="number"
              placeholder="$500.000"
              value={maxPrice}
              onChange={handleMaxPrice}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="flex-1 text-sm text-gray-700 border border-gray-300 rounded py-2 hover:bg-gray-50 transition font-medium"
            >
              Limpiar
            </button>
            <button
              onClick={applyPriceFilter}
              className="flex-1 text-sm text-white bg-emerald-600 rounded py-2 hover:bg-emerald-700 transition font-medium"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
