import React from 'react';
import { Menu } from 'lucide-react';
import { useCurrentUser } from "/src/shared/context/UserContext";

export const Header = ({ onMenuClick }) => {
  const { currentUser } = useCurrentUser();
  const user = currentUser || { nombre: 'Usuario', rol: 'Invitado' };

  return (
    <header className="h-14 bg-primary-600 border-b border-primary-700 flex items-center justify-between px-3 sm:px-5 shadow-md z-20 text-white flex-shrink-0">

      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition flex-shrink-0"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white leading-none group-hover:opacity-90 truncate">{user.nombre}</p>
            <p className="text-[10px] text-primary-100 font-medium uppercase mt-0.5">{user.rol}</p>
          </div>
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white text-primary-600 rounded-full flex items-center justify-center font-bold border-2 border-primary-200 shadow-sm text-xs flex-shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt={user.nombre} className="w-full h-full rounded-full object-cover border-2 border-primary-200 shadow-sm" />
            ) : (
              <div className="w-full h-full bg-white text-primary-600 rounded-full flex items-center justify-center font-bold">
                {user.nombre?.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
