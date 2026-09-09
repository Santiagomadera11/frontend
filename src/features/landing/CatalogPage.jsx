import React from "react";
import { PublicLayout } from "./PublicLayout";
import { CatalogProductsSection } from "./components/CatalogProductsSection";

export const CatalogPage = () => {
  return (
    <PublicLayout>
      <div className="bg-white text-gray-800 py-6 text-center">
        <h1 className="text-2xl font-bold mb-1">Catálogo</h1>
        <p className="text-gray-600 text-xs">Todos los productos</p>
      </div>
      <div className="flex-1">
        <CatalogProductsSection />
      </div>
    </PublicLayout>
  );
};

export default CatalogPage;