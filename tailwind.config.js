const tokens = require('./src/shell/ui/tokens.json');

const px = (n) => `${n}px`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/shell/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: tokens.color,
      borderRadius: Object.fromEntries(Object.entries(tokens.radius).map(([k, v]) => [`game-${k}`, px(v)])),
      borderWidth: { ink: px(tokens.border.ink), hud: px(tokens.border.hud) },
      fontFamily: { display: [tokens.type.family.display] },
      fontSize: Object.fromEntries(Object.entries(tokens.type.size).map(([k, [size, line]]) => [k, [px(size), px(line)]])),
    },
  },
  plugins: [],
};
