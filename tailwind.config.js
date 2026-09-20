/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#157A63',
          dark: '#0F3D3A',
          darker: '#0B2B27',
          mint: '#8FE3C0',
        },
        surface: '#F4F6F7',
      },
    },
  },
  plugins: [],
};
