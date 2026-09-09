import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar/Sidebar'; // Asegúrate que la ruta sea correcta
import { Header } from './Header/Header';

const DashboardLayout = () => {
  return (
    // 1. Contenedor PRINCIPAL: Ocupa toda la pantalla y NO permite scroll global
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      
      {/* 2. SIDEBAR: Fijo a la izquierda */}
      <Sidebar />
      
      {/* 3. ZONA DE CONTENIDO: Columna derecha */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        
        {/* Header Fijo arriba */}
        <Header />
        
        {/* 
            Main: Aquí se renderizan las tablas (Productos, Citas).
            Usamos 'p-4' para dar margen.
            El contenido interno tendrá su propio espacio, pero trataremos
            de usar paginación para que nunca se desborde.
        */}
        <main className="flex-1 p-4 overflow-hidden relative">
          <div className="h-full w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            {/* El Outlet es donde cambian las páginas (Productos, Usuarios, etc) */}
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default DashboardLayout;