const API_BASE = import.meta.env.VITE_API_URL || "https://syspharma-backend.onrender.com";

// El backend guarda el avatar como ruta relativa (ej: "/fotos-perfil/user_1_123.jpg"),
// válida solo contra su propio origen. Sin este resuelto, cualquier <img src={avatar}>
// intenta cargarla desde el origen del frontend y sale rota en cuanto front y back
// quedan en dominios distintos (como en producción).
export const resolveAvatarUrl = (avatar, fallbackSeed) => {
  if (avatar) {
    return avatar.startsWith("http") ? avatar : `${API_BASE}${avatar}`;
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackSeed || "usuario")}`;
};
