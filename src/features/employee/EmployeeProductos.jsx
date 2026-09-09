import React, { useState, useEffect } from "react";
import {
  Search, Eye, ChevronLeft, ChevronRight, Package,
} from "lucide-react";
import { productService } from "../inventory/products/services/productService";
import ProductDetailModal from "../../shared/ui/ProductDetailModal";

export const EmployeeProductos = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailProduct, setDetailProduct] = useState(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await productService.getAll();
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        setProducts([]);
      }
    };

    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleViewDetail = (product) => {
    setDetailProduct(product);
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoriaNombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === "todos" ||
      (filterStatus === "Activo" ? p.estado : !p.estado);
    return matchSearch && matchStatus;
  });

  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const StateBadge = ({ estado }) => (
    <span className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-bold ${
      estado ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"
    }`}>
      {estado ? "Activo" : "Inactivo"}
    </span>
  );

  return (
    <div className="h-full flex flex-col p-6 font-sans text-gray-800 bg-white md:bg-transparent relative">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold">Productos</h1>
          <p className="text-xs text-gray-500">Catálogo disponible</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar productos..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="todos">Todos</option>
          <option value="Activo">Activos</option>
          <option value="Inactivo">Inactivos</option>
        </select>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-blue-700 text-white sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-[11px] font-semibold">ID</th>
                <th className="py-3 px-4 text-[11px] font-semibold">Nombre</th>
                <th className="py-3 px-4 text-[11px] font-semibold">Categoría</th>
                <th className="py-3 px-4 text-[11px] text-center font-semibold">Stock</th>
                <th className="py-3 px-4 text-[11px] text-right font-semibold">Precio</th>
                <th className="py-3 px-4 text-[11px] text-center font-semibold">Estado</th>
                <th className="py-3 px-4 text-[11px] text-center font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.length > 0 ? (
                currentItems.map((prod) => (
                  <tr key={prod.id} className="hover:bg-blue-50 transition-colors">
                    <td className="py-3 px-4 text-xs font-medium text-gray-900">{prod.id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-blue-500" />
                        <span className="text-xs font-semibold text-gray-900">{prod.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">{prod.categoriaNombre}</td>
                    <td className={`py-3 px-4 text-xs text-center font-semibold ${
                      prod.stock === 0 ? "bg-red-100 text-red-700 font-bold" : "text-gray-900"
                    }`}>
                      {prod.stock}
                    </td>
                    <td className="py-3 px-4 text-xs text-right font-semibold text-blue-600">
                      $ {prod.precio}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StateBadge estado={prod.estado} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleViewDetail(prod)}
                          className="p-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 px-4 text-center">
                    <p className="text-gray-400 text-sm">No hay productos que coincidan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 px-3 py-1.5 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-gray-500">
            Pág {currentPage} de {totalPages || 1}
          </span>
          <div className="flex gap-0.5">
            <button
              onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
              disabled={currentPage === 1}
              className="px-1.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-1.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
      />
    </div>
  );
};

export default EmployeeProductos;