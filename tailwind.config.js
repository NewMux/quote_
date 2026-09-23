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
      // Apple's text styles (iOS default "Large" size). Pair with the matching weight class where
      // the style has one: headline is semibold, largetitle is bold.
      fontSize: {
        largetitle: ['34px', { lineHeight: '41px' }],
        title1: ['28px', { lineHeight: '34px' }],
        title2: ['22px', { lineHeight: '28px' }],
        title3: ['20px', { lineHeight: '25px' }],
        headline: ['17px', { lineHeight: '22px' }],
        body: ['17px', { lineHeight: '22px' }],
        callout: ['16px', { lineHeight: '21px' }],
        subhead: ['15px', { lineHeight: '20px' }],
        footnote: ['13px', { lineHeight: '18px' }],
        caption: ['12px', { lineHeight: '16px' }],
        caption2: ['11px', { lineHeight: '13px' }],
      },
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
        secondaryfill: token('secondaryFill'),
        label: token('label'),
        secondary: token('secondary'),
        tertiary: token('tertiary'),
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
