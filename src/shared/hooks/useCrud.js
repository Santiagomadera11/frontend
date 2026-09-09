import { useState, useEffect } from "react";

export const useCrud = (storageKey, initialData) => {
  // 1. Cargar datos del LocalStorage o usar los iniciales
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : initialData;
    } catch (error) {
      console.error("Error cargando datos", error);
      return initialData;
    }
  });

  // 2. Guardar en LocalStorage cada vez que cambien los items
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  // 3. Escuchar eventos externos para sincronizar cambios realizados fuera del hook
  useEffect(() => {
    const onCustomUpdate = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        setItems(stored ? JSON.parse(stored) : initialData);
      } catch {
        // ignore
      }
    };

    const onStorage = (evt) => {
      if (!evt) return;
      // evt.key puede ser null en algunos navegadores - en ese caso recargar todo
      if (!evt.key || evt.key === storageKey) {
        onCustomUpdate();
      }
    };

    window.addEventListener(`${storageKey}_updated`, onCustomUpdate);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(`${storageKey}_updated`, onCustomUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, [storageKey, initialData]);

  // --- ACCIONES ---

  // AGREGAR
  const addItem = (newItem) => {
    // Generar un ID simple si no viene
    const itemWithId = { ...newItem, id: newItem.id || `${Date.now()}` };
    setItems((prev) => [itemWithId, ...prev]);
  };

  // EDITAR
  const updateItem = (id, updatedFields) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updatedFields } : item,
      ),
    );
  };

  // ELIMINAR
  const deleteItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return { items, addItem, updateItem, deleteItem };
};
