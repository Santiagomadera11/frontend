import React from "react";
import { Link } from "react-router-dom";
import farmaciaImage from "../../assets/farmacia.avif";
import { PublicNavbar } from "./components/PublicNavbar";
import { Zap, Shield, DollarSign, Pill, Mail, Phone } from "lucide-react";
import { useCrud } from "../../shared/hooks/useCrud";
import { useState } from "react";
import ProductDetailModal from "../../shared/ui/ProductDetailModal";
import ProductCardGrid from "../client/components/ProductCard";
import useCart from "../../shared/context/CartContext";
import { toast } from "../../shared/utils/toast";

export const LandingPage = () => {
    // Servicios sincronizados con el storage principal `sys_services`
    const { items: services } = useCrud("sys_services", []);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const cart = useCart();
  // Productos sincronizados con el storage principal `syspharma_products`
  const { items: products } = useCrud("syspharma_products", []);
  // Mostrar todos los productos disponibles
  const allProducts = products || [];

  const testimonials = [
    { name: "Pfizer", logo: "💊" },
    { name: "Bayer", logo: "⚕️" },
    { name: "Roche", logo: "🔬" },
    { name: "Abbott", logo: "💉" },
  ];

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <PublicNavbar />

      {/* HERO SECTION */}
      <section className="relative py-20 px-4 md:px-6 bg-gradient-to-br from-gray-50 via-white to-emerald-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="flex flex-col justify-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Tu salud no espera,{" "}
              <span className="text-emerald-600">SysPharma</span> te la lleva
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Medicamentos certificados entregados en tu puerta en menos de 30
              minutos. Confianza, rapidez y los mejores precios del mercado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="/registro"
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-center"
              >
                Regístrate Ahora
              </Link>
              <a
                href="#catalogo"
                className="px-8 py-4 border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-semibold rounded-lg transition-colors text-center"
              >
                Conoce nuestros productos
              </a>
            </div>
          </div>

          {/* Right: Illustration/Image */}
          <div className="relative hidden md:flex items-center justify-center">
            <div className="w-full h-96 bg-gradient-to-br from-emerald-100 to-transparent rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden">
              <img
                src={farmaciaImage}
                alt="Farmacia"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS SECTION */}
      <section className="py-20 px-4 md:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-lg text-gray-600">
              Tres razones que nos hacen líderes en el mercado
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group p-8 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-emerald-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
                <Zap
                  size={28}
                  className="text-emerald-600 group-hover:text-white transition-colors"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Rapidez</h3>
              <p className="text-gray-600">
                Entregas en menos de 30 minutos. Tu salud es nuestra prioridad,
                por eso no esperas.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group p-8 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-emerald-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
                <Shield
                  size={28}
                  className="text-emerald-600 group-hover:text-white transition-colors"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Confianza
              </h3>
              <p className="text-gray-600">
                Medicamentos 100% certificados. Todos nuestros productos cuentan
                con registro sanitario.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group p-8 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-emerald-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
                <DollarSign
                  size={28}
                  className="text-emerald-600 group-hover:text-white transition-colors"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Ahorro</h3>
              <p className="text-gray-600">
                Los mejores precios del mercado. Promociones semanales y
                descuentos exclusivos para clientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CATÁLOGO COMPLETO */}
      {allProducts.length > 0 && (
        <section id="catalogo" className="py-20 px-4 md:px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Catálogo de Productos
              </h2>
              <p className="text-lg text-gray-600">
                Todos los productos disponibles
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {allProducts.map((product) => {
                const stock = product.stock ?? product.existencia ?? 0;
                const mapped = {
                  id: product.id,
                  name: product.nombre || product.name,
                  marca: product.proveedor || product.marca,
                  image: product.imagen || product.image || null,
                  price: Number(product.precio ?? product.price ?? 0),
                  stock,
                };
                return (
                  <ProductCardGrid
                    key={product.id}
                    product={mapped}
                    onOpenDetail={() => setSelectedProduct(product)}
                    onAdd={() => {
                      try {
                        cart.addToCart(product);
                        toast.success(`¡${product.nombre} agregado al carrito!`);
                      } catch (e) {
                        console.error(e);
                        toast.error("Error al agregar al carrito");
                      }
                    }}
                    onQuickBuy={() => setSelectedProduct(product)}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* SERVICIOS COMPLETOS */}
      {services.length > 0 && (
        <section id="servicios" className="py-20 px-4 md:px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Servicios Disponibles
              </h2>
              <p className="text-lg text-gray-600">
                Todos los servicios ofrecidos por SysPharma
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div key={service.id} className="p-6 rounded-xl bg-gray-50 border border-gray-200 shadow-sm hover:shadow-lg transition-all">
                  <h3 className="text-xl font-bold text-emerald-700 mb-2">{service.nombre}</h3>
                  <p className="text-gray-700 mb-2">{service.descripcion}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-lg font-semibold text-gray-900">${service.precio}</span>
                    <span className="text-sm text-gray-500">{service.categoria}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">Duración: {service.duracion} min</div>
                  <div className="mt-2 text-xs text-gray-400">Estado: {service.estado}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* TRUST SECTION */}
      <section className="py-16 px-4 md:px-6 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Contamos con el respaldo de
            </h3>
            <p className="text-gray-600">
              Laboratorios y marcas líderes a nivel mundial
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {testimonials.map((brand, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-6 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-5xl mb-3">{brand.logo}</div>
                <p className="font-semibold text-gray-800 text-center">
                  {brand.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-16 px-4 md:px-6 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div>
              <h4 className="text-white font-bold text-lg mb-4">SysPharma</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Tu farmacia de confianza. Medicamentos de calidad entregados
                rápidamente a tu hogar.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Catálogo
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Agendar Cita
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Domicilios
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
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
