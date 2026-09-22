const API_BASE = import.meta.env.VITE_API_URL || "https://syspharma-backend.onrender.com";

const AVATAR_COLORS = ["0F766E", "1D4ED8", "6D28D9", "B45309", "0369A1", "334155", "0891B2", "4338CA"].join(",");

export const resolveAvatarUrl = (avatar, fallbackSeed) => {
  if (avatar) {
    return avatar.startsWith("http") ? avatar : `${API_BASE}${avatar}`;
  }
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fallbackSeed || "usuario")}&backgroundColor=${AVATAR_COLORS}&fontFamily=Helvetica&fontWeight=600`;
};
