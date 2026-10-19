/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/shell/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: { extend: {} },
  plugins: [],
};
