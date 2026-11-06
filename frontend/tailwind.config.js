/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
      },
      colors: {
        iush: {
          navy: '#002856',
          dark: '#081c34',
          purple: '#7c2a90',
          teal: '#0d8abc',
          'teal-hover': '#09729d',
          accent: '#00a3e0',
          surface: '#f8fafc',
          border: '#e2e8f0',
        },
      },
    },
  },
  plugins: [],
};
