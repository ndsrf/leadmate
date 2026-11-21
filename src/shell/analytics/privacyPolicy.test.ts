import fs from 'fs';
import path from 'path';
import { EVENTS } from './contract';

const policy = fs.readFileSync(path.resolve(__dirname, '../../../docs/privacy-policy.md'), 'utf8');
const split = policy.indexOf('# Política de Privacidad');
const english = policy.slice(0, split);
const spanish = policy.slice(split);

describe('Privacy policy names every analytics event (Task 11.8)', () => {
  it('has both language parts', () => {
    expect(split).toBeGreaterThan(0);
  });

  for (const name of Object.keys(EVENTS)) {
    it(`${name} is named in English and Spanish`, () => {
      expect(english).toContain(`\`${name}\``);
      expect(spanish).toContain(`\`${name}\``);
    });
  }

  it('describes tap capture without screen text and the context properties in both languages', () => {
    expect(english).toMatch(/Taps never include the text on screen/);
    expect(english).toMatch(/context properties/);
    expect(spanish).toMatch(/Los toques nunca incluyen el texto de la pantalla/);
    expect(spanish).toMatch(/propiedades de contexto/);
  });
});
