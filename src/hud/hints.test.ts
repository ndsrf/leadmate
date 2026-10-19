import { HintTracker } from './hints';
import { es } from '../i18n';

describe('leash hints', () => {
  it('shows the Taut hint once, then not again in the same Stage', () => {
    const h = new HintTracker();
    expect(h.observe('slack')).toBeNull();
    expect(h.observe('taut')).toBe('hint.taut');
    expect(h.observe('slack')).toBeNull();
    expect(h.observe('taut')).toBeNull();
  });

  it('shows the Rigid Pull hint once', () => {
    const h = new HintTracker();
    expect(h.observe('rigid')).toBe('hint.rigid');
    expect(h.observe('rigid')).toBeNull();
  });

  it('starts fresh for a new Stage', () => {
    new HintTracker().observe('taut');
    expect(new HintTracker().observe('taut')).toBe('hint.taut');
  });

  it('takes its text from the catalog, with no literal text added', () => {
    expect(es['hint.taut']).toBeTruthy();
    expect(es['hint.rigid']).toBeTruthy();
  });
});
