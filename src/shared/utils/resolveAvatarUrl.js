const API_BASE = import.meta.env.VITE_API_URL || "https://syspharma-backend.onrender.com";

// Paleta sobria (sin colores estridentes) para las iniciales generadas: variedad
// entre usuarios sin caer en tonos infantiles.
const AVATAR_COLORS = ["0F766E", "1D4ED8", "6D28D9", "B45309", "0369A1", "334155", "0891B2", "4338CA"].join(",");

// El backend guarda el avatar como ruta relativa (ej: "/fotos-perfil/user_1_123.jpg"),
// válida solo contra su propio origen. Sin este resuelto, cualquier <img src={avatar}>
// intenta cargarla desde el origen del frontend y sale rota en cuanto front y back
// quedan en dominios distintos (como en producción).
//
// Sin foto propia, se genera un avatar de iniciales (estilo Slack/Gmail) en vez del
// muñeco de caricatura (dicebear "avataaars"): más acorde a un sistema de gestión
// clínica/farmacéutica que a una app de consumo.
export const resolveAvatarUrl = (avatar, fallbackSeed) => {
  if (avatar) {
    return avatar.startsWith("http") ? avatar : `${API_BASE}${avatar}`;
  }
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fallbackSeed || "usuario")}&backgroundColor=${AVATAR_COLORS}&fontFamily=Helvetica&fontWeight=600`;
};
