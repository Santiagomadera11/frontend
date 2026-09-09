/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      xs: '360px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      colors: {
        // Tu nueva paleta "Verde Menta / SysPharma Moderno"
        primary: {
          900: '#064E3B', // Texto muy oscuro
          800: '#065F46',
          700: '#047857',
          600: '#059669', 
          500: '#10B981', // Verde Esmeralda Estándar
          400: '#34D399', // <--- ESTE es el color brillante de tu imagen ("Inicio", botones)
          300: '#6EE7B7',
          200: '#A7F3D0', 
          100: '#D1FAE5', // Fondos suaves
          50:  '#ECFDF5', // Fondo de pantalla casi blanco
        },
        // Color específico para el Sidebar (Gris Azulado Oscuro de la imagen)
        sidebar: {
          bg: '#2C3E50',     // Fondo del menú lateral
          hover: '#34495E',  // Color al pasar el mouse por un item
          active: '#1ABC9C', // El verde cuando un item está seleccionado
          text: '#ECF0F1'    // Texto blanco/gris claro
        }
      }
    },
  },
  plugins: [],
}