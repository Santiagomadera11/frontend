import React, { useState } from "react";
import { ShoppingCart, User, Stethoscope, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { LS } from '../../../shared/services/lsService';
import useCart from '../../../shared/context/CartContext';

export const PublicNavbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const cart = useCart();
  const CartButton = () => {
    return (
      <button onClick={() => cart.setIsCartOpen(true)} className="relative p-1.5 text-gray-400 hover:text-primary-400 transition-colors">
        <ShoppingCart size={20} />
        <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
          {cart.cartCount}
        </span>
      </button>
    );
  };

  const navItems = [
    { label: "Inicio", path: "/" },
    { label: "Productos", path: "/productos" },
    { label: "Servicios", path: "/servicios" },
    { label: "Contacto", path: "/contacto" },
  ];

  const isActive = (path) => location.pathname === path;
  return (
    <nav className="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100 h-14 flex items-center">
      <div className="max-w-6xl mx-auto w-full px-4">
        <div className="flex justify-between items-center">
          {/* LOGO & BURGER BUTTON CONTAINER */}
          <div className="flex items-center">
            {/* HAMBURGER BUTTON (MOBILE ONLY) */}
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-1.5 text-gray-500 hover:text-primary-400 transition-colors rounded-lg mr-2 focus:outline-none"
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>

            {/* LOGO */}
            <Link to="/" className="flex items-center gap-2 cursor-pointer group">
              <div className="bg-primary-400 text-white p-1.5 rounded-lg shadow-md group-hover:bg-primary-500 transition-colors">
                <Stethoscope size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight text-primary-900">
                Sys<span className="text-primary-400">Pharma</span>
              </span>
            </Link>
          </div>

          {/* MENÚ CENTRO */}
          <div className="hidden md:flex space-x-6 items-center font-medium text-sm text-gray-500">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`transition-colors pb-1 border-b-2 ${
                  isActive(item.path)
                    ? "text-primary-400 border-primary-400"
                    : "hover:text-primary-400 border-b-2 border-transparent hover:border-primary-400"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* BOTONES DERECHA */}
          <div className="flex items-center space-x-3">
            <CartButton />

            {/* ENLACE REGISTRARSE (SOLO CLIENTES) */}
            <Link
              to="/registro"
              className="text-xs font-bold text-gray-500 hover:text-primary-600 transition-colors hidden sm:block"
            >
              Registrarse
            </Link>

            {/* BOTÓN INGRESAR */}
            <Link
              to="/login"
              className="flex items-center gap-1.5 bg-primary-400 hover:bg-primary-500 text-white px-4 py-1.5 rounded-full transition-all shadow-sm hover:shadow-md font-bold text-xs"
            >
              <User size={16} />
              <span>Ingresar</span>
            </Link>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* MOBILE DRAWER SIDEBAR */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2C3E50] text-white shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 flex items-center justify-between px-5 border-b border-gray-700 bg-[#243342]">
          <div className="flex items-center gap-2">
            <div className="bg-primary-400 text-white p-1.5 rounded-lg shadow-md">
              <Stethoscope size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide">SysPharma</h1>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider">Menú Público</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/10 rounded-md transition"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? "bg-primary-400 text-white font-semibold"
                  : "text-gray-300 hover:bg-[#34495E] hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}

          <div className="border-t border-gray-700 my-4 pt-4 space-y-2">
            <Link
              to="/registro"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-bold text-gray-300 hover:bg-[#34495E] hover:text-white rounded-lg transition-colors border border-gray-600"
            >
              Registrarse
            </Link>
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1.5 w-full bg-primary-400 hover:bg-primary-500 text-white px-4 py-2.5 rounded-lg transition-colors font-bold text-sm shadow-sm"
            >
              <User size={16} />
              <span>Ingresar</span>
            </Link>
          </div>
        </nav>
      </div>
    </nav>
  );
};
