import { act, create } from 'react-test-renderer';
import { RUSTY_CAPACITY } from './rusty';
import { useRustyDog, type RustyDog } from './useRustyDog';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Record = { lastStageDate: string | null };

const NOW = new Date('2026-11-20T10:00:00.000Z');
const daysAgo = (days: number): Record => ({ lastStageDate: new Date(NOW.getTime() - days * 86_400_000).toISOString() });
const later = (days: number) => jest.setSystemTime(NOW.getTime() + days * 86_400_000);

/** Renders the hook on its own; `get()` is its latest value and `load` hands it another record. */
function render(record: Record | null) {
  let value!: RustyDog;
  function Probe({ record }: { record: Record | null }) {
    value = useRustyDog(record);
    return null;
  }
  let renderer!: ReturnType<typeof create>;
  act(() => void (renderer = create(<Probe record={record} />)));
  return { get: () => value, load: (next: Record | null) => act(() => renderer.update(<Probe record={next} />)) };
}

const realConsoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (String(args[0]).includes('react-test-renderer is deprecated')) return;
    realConsoleError(...args);
  });
});
beforeEach(() => jest.useFakeTimers({ now: NOW }));
afterEach(() => jest.useRealTimers());

describe('useRustyDog', () => {
  it('decides once the record has loaded', () => {
    const hook = render(null);
    expect(hook.get().rusty).toBe(false);
    hook.load(daysAgo(5));
    expect(hook.get()).toMatchObject({ rusty: true, warmup: 'none', capacity: 1 });
  });

  it('keeps the decision until a new App Session, whatever the clock and the record do', () => {
    const hook = render(daysAgo(2));
    later(5);
    hook.load(daysAgo(2));
    expect(hook.get().rusty).toBe(false);
  });

  it('turns Rusty in a new App Session once the gap is reached', () => {
    const record = daysAgo(2);
    const hook = render(record);
    later(1);
    act(() => hook.get().startSession(record));
    expect(hook.get().rusty).toBe(true);
  });

  it('is not Rusty in a new App Session after a graded Stage', () => {
    const hook = render(daysAgo(5));
    act(() => hook.get().startSession(daysAgo(0)));
    expect(hook.get()).toMatchObject({ rusty: false, capacity: 1 });
  });

  it.each(['completed', 'skipped'] as const)('forgets a %s warm-up in a new App Session', (outcome) => {
    const record = daysAgo(5);
    const hook = render(record);
    act(() => hook.get().setWarmup(outcome));
    expect(hook.get()).toMatchObject({ warmup: outcome, capacity: outcome === 'skipped' ? RUSTY_CAPACITY : 1 });
    act(() => hook.get().startSession(record));
    expect(hook.get()).toMatchObject({ rusty: true, warmup: 'none', capacity: 1 });
  });

  it('is cleared by a progress reset, which starts over from the fresh record', () => {
    const hook = render(daysAgo(5));
    act(() => hook.get().setWarmup('skipped'));
    // the reset restarts the decision before the fresh record has replaced the old one
    act(() => hook.get().startSession({ lastStageDate: null }));
    expect(hook.get()).toMatchObject({ rusty: false, warmup: 'none', capacity: 1 });
    hook.load({ lastStageDate: null });
    expect(hook.get().rusty).toBe(false);
  });

  it('decides from the record when it loads after a session started without one', () => {
    const hook = render(null);
    act(() => hook.get().startSession(null));
    hook.load(daysAgo(5));
    expect(hook.get().rusty).toBe(true);
  });
});
