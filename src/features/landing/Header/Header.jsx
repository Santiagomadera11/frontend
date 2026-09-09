import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';

export const Header = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
      
      {/* Izquierda: Buscador Global (Compacto) */}
      <div className="flex items-center gap-4">
        <button className="md:hidden text-gray-500">
          <Menu size={24} />
        </button>
        <div className="relative hidden md:block">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="pl-10 pr-4 py-1.5 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all w-64"
          />
        </div>
      </div>

      {/* Derecha: Notificaciones y Perfil */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-primary-600 transition-colors rounded-full hover:bg-gray-100">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        
        <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>

        <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-gray-700 leading-none">Admin</p>
            <p className="text-[10px] text-gray-400 font-medium">Farmacenter La 10</p>
          </div>
          <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold border-2 border-primary-50">
            A
          </div>
        </div>
      </div>
    </header>
  );
};