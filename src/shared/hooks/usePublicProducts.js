import { useState, useEffect, useCallback } from "react";
import { productService } from "../../features/inventory/products/services/productService";

// Reemplaza la antigua caché en localStorage["syspharma_products"]: trae el
// catálogo público directamente de la API y se refresca cuando el admin
// crea/edita/elimina un producto (evento "syspharma_products_updated").
export const usePublicProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await productService.getPublicCatalog();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando catálogo público:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("syspharma_products_updated", load);
    return () => window.removeEventListener("syspharma_products_updated", load);
  }, [load]);

  return { products, loading, reload: load };
};

export default usePublicProducts;
