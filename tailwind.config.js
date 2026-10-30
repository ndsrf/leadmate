const tokens = require('./src/shell/ui/tokens.json');

const px = (n) => `${n}px`;

/** Colours read the palette the app root sets with `vars()`, so classes follow the Appearance; channel form keeps `bg-ink/70` working. */
const colors = Object.fromEntries(Object.keys(tokens.color).map((k) => [k, `rgb(var(--c-${k}) / <alpha-value>)`]));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/shell/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors,
      borderRadius: Object.fromEntries(Object.entries(tokens.radius).map(([k, v]) => [`game-${k}`, px(v)])),
      borderWidth: { ink: px(tokens.border.ink), hud: px(tokens.border.hud) },
      fontFamily: { display: [tokens.type.family.display] },
      fontSize: Object.fromEntries(Object.entries(tokens.type.size).map(([k, [size, line]]) => [k, [px(size), px(line)]])),
    },
  },
  plugins: [],
};
