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
        primary: {
          900: '#064E3B',
          800: '#065F46',
          700: '#047857',
          600: '#059669', 
          500: '#10B981',
          400: '#34D399',
          300: '#6EE7B7',
          200: '#A7F3D0', 
          100: '#D1FAE5',
          50:  '#ECFDF5',
        },
        sidebar: {
          bg: '#2C3E50',
          hover: '#34495E',
          active: '#1ABC9C',
          text: '#ECF0F1'
        },
        employee: {
          900: '#122A54',
          800: '#1B3B75',
          700: '#24509C',
          600: '#2F66C2',
          500: '#3B7DDE',
          400: '#5B9BF5',
          300: '#93C5FD',
          200: '#BFDBFE',
          100: '#DCEAFE',
          50:  '#EFF5FF',
        },
      }
    },
  },
  plugins: [],
}