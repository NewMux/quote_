/** @type {import('tailwindcss').Config} */

// Semantic color tokens. Their values come from CSS variables that the root layout sets for the
// current Light/Dark appearance (see src/lib/theme.ts), so `bg-card`, `text-label`, etc. adapt
// automatically.
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: token('brand'),
          dark: token('brandDark'),
          darker: '#0B2B27',
          mint: '#8FE3C0',
        },
        background: token('background'),
        grouped: token('grouped'),
        card: token('card'),
        elevated: token('elevated'),
        fill: token('fill'),
        label: token('label'),
        secondary: token('secondary'),
        placeholder: token('placeholder'),
        separator: token('separator'),
        field: token('field'),
        tint: token('tint'),
        destructive: token('destructive'),
        warning: token('warning'),
        success: token('success'),
      },
    },
  },
  plugins: [],
};
