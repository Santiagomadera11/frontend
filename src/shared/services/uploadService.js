import { apiClient } from "../utils/apiClient";

// Sube una imagen suelta a Cloudinary (vía el backend) y devuelve su URL final.
// Pensado para formularios que eligen la imagen ANTES de que exista el recurso
// al que pertenece (ej: crear un producto) — se sube primero, y la URL que
// devuelve se guarda como un campo de texto más junto al resto del formulario.
export const uploadService = {
  uploadImage: async (file, carpeta = "otros") => {
    const formData = new FormData();
    formData.append("archivo", file);

    const token = sessionStorage.getItem("syspharma_token");
    const response = await apiClient.post(`/api/uploads/imagen?carpeta=${encodeURIComponent(carpeta)}`, formData, {
      // La instancia de apiClient fija Content-Type: application/json por defecto;
      // hay que pisarlo para que el navegador arme el multipart/form-data con boundary.
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
    });

    return response.data.url;
  },
};
