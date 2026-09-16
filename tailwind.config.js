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
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
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
        },
        // Paleta "Azul Corporativo" — identidad visual del panel de Empleado.
        // Misma estructura que `primary` (900 oscuro → 50 fondo) para mantener
        // la misma disciplina tipográfica/de contraste entre ambos paneles.
        employee: {
          900: '#122A54', // Texto muy oscuro
          800: '#1B3B75',
          700: '#24509C',
          600: '#2F66C2', // Header / acciones principales
          500: '#3B7DDE', // Estándar (equivalente a primary-500)
          400: '#5B9BF5', // Acento brillante (activos, botones destacados)
          300: '#93C5FD',
          200: '#BFDBFE',
          100: '#DCEAFE', // Fondos suaves
          50:  '#EFF5FF', // Fondo casi blanco
        },
      }
    },
  },
  plugins: [],
}