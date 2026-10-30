import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..', '..');

function tsx(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return tsx(path);
    return name.endsWith('.tsx') ? [path] : [];
  });
}

const FILES = [...tsx(join(ROOT, 'src', 'shell')), join(ROOT, 'App.tsx')];
const PALETTE = /\b(?:bg|text|border|ring|from|to|via|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?\b/;
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const FONT_LITERAL = /fontFamily:\s*['"]/;

/** The Light-only regions (a running Stage and its overlays, the Splash, illustrations): the only files that may use `lightColor`. */
const LIGHT_ONLY = [
  'App.tsx',
  'src/shell/SimView.tsx',
  'src/shell/SimView.web.tsx',
  'src/shell/Overlays.tsx',
  'src/shell/screens/SplashScreen.tsx',
  'src/shell/ui/art.tsx',
  'src/shell/ui/lessonArt.tsx',
  'src/shell/ui/BreedArt.tsx',
  'src/shell/ui/CanineMinigameAvatar.tsx',
  'src/shell/ui/MinigameProps.tsx',
];

function usesLightColor(code: string): boolean {
  return /\blightColor\b/.test(code);
}

describe('screens draw only from the theme', () => {
  it('finds the shell files', () => {
    expect(FILES.length).toBeGreaterThan(10);
  });

  it.each(FILES.map((f) => [f.slice(ROOT.length + 1), f]))('%s has no raw colour or font', (_name, file) => {
    const code = readFileSync(file, 'utf8').replace(/\/\/.*$/gm, '');
    const found = [PALETTE.exec(code)?.[0], HEX.exec(code)?.[0], FONT_LITERAL.exec(code)?.[0]].filter(Boolean);
    expect(found).toEqual([]);
  });

  it.each(FILES.map((f) => [f.slice(ROOT.length + 1), f]).filter(([name]) => !LIGHT_ONLY.includes(name) && !name.includes('.test.')))('%s takes its colours from the active palette', (_name, file) => {
    expect(usesLightColor(readFileSync(file, 'utf8'))).toBe(false);
  });

  it('spots a file that pins the Light palette', () => {
    expect(usesLightColor("import { lightColor } from './theme';")).toBe(true);
    expect(usesLightColor("const color = usePalette();")).toBe(false);
  });

  it('keeps labels from being truncated, so a longer translation wraps instead of clipping', () => {
    for (const file of FILES) {
      const code = readFileSync(file, 'utf8');
      expect({ file, truncates: /numberOfLines=\{1\}|\btruncate\b|ellipsizeMode/.test(code) }).toEqual({ file, truncates: false });
    }
  });
});
