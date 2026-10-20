const tokens = require('./src/shell/ui/tokens.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/shell/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: tokens.color,
      borderRadius: Object.fromEntries(Object.entries(tokens.radius).map(([k, v]) => [`game-${k}`, `${v}px`])),
      fontFamily: { display: [tokens.type.display] },
    },
  },
  plugins: [],
};
