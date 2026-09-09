import React from "react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "./components/PublicNavbar";
import { Mail, Phone } from "lucide-react";

export const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      <PublicNavbar />

      <main className="flex-1">{children}</main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <h4 className="text-white font-bold text-lg mb-4">SysPharma</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Tu farmacia de confianza. Medicamentos de calidad entregados
                rápidamente a tu hogar.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Navegación</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link
                    to="/productos"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Catálogo
                  </Link>
                </li>
                <li>
                  <Link
                    to="/servicios"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Servicios
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contacto"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contacto</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Phone size={16} className="text-emerald-500" />
                  <span className="text-gray-400">313 616 0504</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={16} className="text-emerald-500" />
                  <span className="text-gray-400">
                    farmacenterla10@gmail.com
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
              <p>
                &copy; 2025 SysPharma - Farmacenter La 10. Todos los derechos
                reservados.
              </p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-white transition-colors">
                  Privacidad
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Términos
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
