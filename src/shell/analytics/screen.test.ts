import { SCREENS } from './contract';
import { screenOf, ScreenViews, type ScreenInput } from './screen';

const node = (step: string, mode = 'stage', id = 'walk-distraction') => ({
  name: 'node',
  run: { step, node: { id, mode } },
});

function of(input: Partial<ScreenInput>) {
  return screenOf({ route: { name: 'map' }, funnelStep: null, flow: null, settingsTab: 'dog', ...input });
}

describe('screenOf', () => {
  it('shows splash until the app is ready', () => {
    expect(of({ route: { name: 'splash' } })).toEqual({ screen: 'splash' });
  });

  it('uses the Funnel step for funnel, taste and first-stage routes', () => {
    expect(of({ route: { name: 'funnel', step: 'dog' }, funnelStep: 'dog' })).toEqual({ screen: 'dog' });
    expect(of({ route: { name: 'taste' }, funnelStep: 'taste_payoff' })).toEqual({ screen: 'taste_payoff' });
    expect(of({ route: { name: 'first-stage' }, funnelStep: 'first_walk' })).toEqual({ screen: 'first_walk' });
  });

  it('is the paywall on the paywall route, with or without a Funnel step', () => {
    expect(of({ route: { name: 'paywall' }, funnelStep: 'paywall' })).toEqual({ screen: 'paywall' });
    expect(of({ route: { name: 'paywall' } })).toEqual({ screen: 'paywall' });
  });

  it('is null on a Funnel route that has no step yet', () => {
    expect(of({ route: { name: 'funnel', step: 'language' } })).toBeNull();
  });

  it('names the map, the recap and the three Settings Areas', () => {
    expect(of({})).toEqual({ screen: 'map' });
    expect(of({ route: { name: 'recap' } })).toEqual({ screen: 'value_recap' });
    for (const tab of ['dog', 'preferences', 'account'] as const) {
      expect(of({ route: { name: 'settings' }, settingsTab: tab })).toEqual({ screen: `settings_${tab}` });
    }
  });

  it('names library, diary and the single-item screens with their ids', () => {
    const flow = (f: object) => of({ route: { name: 'flow', flow: f }, flow: f as ScreenInput['flow'] });
    expect(flow({ name: 'library' })).toEqual({ screen: 'library' });
    expect(flow({ name: 'diary' })).toEqual({ screen: 'diary' });
    expect(flow({ name: 'lesson', id: 'lesson-leash' })).toEqual({ screen: 'lesson', itemId: 'lesson-leash' });
    for (const view of ['check', 'brief', 'waiting', 'checkin', 'problem', 'fix', 'passed']) {
      expect(flow({ name: 'mission', id: 'm-1', view })).toEqual({ screen: `mission_${view}`, itemId: 'm-1' });
    }
  });

  it('names every Node step, with the Node id', () => {
    const flow = (f: object) => of({ route: { name: 'flow', flow: f }, flow: f as ScreenInput['flow'] });
    expect(flow(node('primer'))).toEqual({ screen: 'node_primer', itemId: 'walk-distraction' });
    expect(flow(node('checkpoint'))).toEqual({ screen: 'node_checkpoint', itemId: 'walk-distraction' });
    expect(flow(node('simulation'))).toEqual({ screen: 'node_stage', itemId: 'walk-distraction' });
    expect(flow(node('simulation', 'close_exercise'))).toEqual({ screen: 'node_stage', itemId: 'walk-distraction' });
    expect(flow(node('simulation', 'minigame'))).toEqual({ screen: 'node_minigame', itemId: 'walk-distraction' });
    expect(flow(node('debrief'))).toEqual({ screen: 'node_debrief', itemId: 'walk-distraction' });
  });

  it('names daily, warm-up, barkdoku, shop and the paywall flow', () => {
    const flow = (f: object) => of({ route: { name: 'flow', flow: f }, flow: f as ScreenInput['flow'] });
    expect(flow({ name: 'daily', result: null })).toEqual({ screen: 'daily_stage' });
    expect(flow({ name: 'daily', result: {} })).toEqual({ screen: 'daily_result' });
    expect(flow({ name: 'warmup' })).toEqual({ screen: 'warmup_stage' });
    expect(flow({ name: 'puzzle' })).toEqual({ screen: 'barkdoku' });
    expect(flow({ name: 'shop' })).toEqual({ screen: 'shop' });
    expect(flow({ name: 'paywall' })).toEqual({ screen: 'paywall' });
  });

  it('names the account flows, over the Funnel too', () => {
    const flow = (f: object, funnelStep: ScreenInput['funnelStep'] = null) =>
      of({ route: { name: 'flow', flow: f }, flow: f as ScreenInput['flow'], funnelStep });
    expect(flow({ name: 'auth', mode: 'login' }, 'account')).toEqual({ screen: 'auth_login' });
    expect(flow({ name: 'auth', mode: 'signup' })).toEqual({ screen: 'auth_signup' });
    expect(flow({ name: 'register' }, 'register_prompt')).toEqual({ screen: 'register_prompt' });
    expect(flow({ name: 'register' })).toEqual({ screen: 'register' });
  });

  it('omits an item id that is not a catalog id', () => {
    const f = { name: 'lesson', id: 'Luna' };
    expect(of({ route: { name: 'flow', flow: f }, flow: f as ScreenInput['flow'] })).toEqual({ screen: 'lesson' });
  });

  it('covers every value of SCREENS', () => {
    const seen = new Set<string>(['splash']);
    const add = (r: ReturnType<typeof of>) => r && seen.add(r.screen);
    for (const step of SCREENS) {
      add(of({ route: { name: 'funnel', step: 'x' }, funnelStep: step as ScreenInput['funnelStep'] }));
    }
    const flows: object[] = [
      { name: 'library' }, { name: 'diary' }, { name: 'lesson', id: 'a' }, { name: 'warmup' },
      { name: 'puzzle' }, { name: 'shop' }, { name: 'register' }, { name: 'daily', result: null }, { name: 'daily', result: {} },
      { name: 'auth', mode: 'login' }, { name: 'auth', mode: 'signup' },
      node('primer'), node('checkpoint'), node('simulation'), node('simulation', 'minigame'), node('debrief'),
      ...['check', 'brief', 'waiting', 'checkin', 'problem', 'fix', 'passed'].map((view) => ({ name: 'mission', id: 'm', view })),
    ];
    for (const f of flows) add(of({ route: { name: 'flow', flow: f }, flow: f as ScreenInput['flow'] }));
    add(of({})); add(of({ route: { name: 'recap' } })); add(of({ route: { name: 'paywall' } }));
    for (const tab of ['dog', 'preferences', 'account'] as const) add(of({ route: { name: 'settings' }, settingsTab: tab }));
    expect([...SCREENS].filter((s) => !seen.has(s))).toEqual([]);
  });
});

describe('ScreenViews', () => {
  it('reports a first view without a previous screen', () => {
    const views = new ScreenViews();
    expect(views.view({ screen: 'welcome' })).toEqual({ screen: 'welcome' });
  });

  it('does not report the same screen twice', () => {
    const views = new ScreenViews();
    views.view({ screen: 'map' });
    expect(views.view({ screen: 'map' })).toBeNull();
  });

  it('reports a change of screen with the previous one', () => {
    const views = new ScreenViews();
    views.view({ screen: 'map' });
    expect(views.view({ screen: 'lesson', itemId: 'l1' })).toEqual({ screen: 'lesson', previous_screen: 'map', itemId: 'l1' });
  });

  it('reports a different item on the same screen as a new view', () => {
    const views = new ScreenViews();
    views.view({ screen: 'lesson', itemId: 'l1' });
    expect(views.view({ screen: 'lesson', itemId: 'l1' })).toBeNull();
    expect(views.view({ screen: 'lesson', itemId: 'l2' })).toEqual({ screen: 'lesson', previous_screen: 'lesson', itemId: 'l2' });
  });

  it('ignores a null screen and keeps the last one', () => {
    const views = new ScreenViews();
    views.view({ screen: 'welcome' });
    expect(views.view(null)).toBeNull();
    expect(views.current).toBe('welcome');
    expect(views.view({ screen: 'language' })?.previous_screen).toBe('welcome');
  });

  it('exposes the current screen for the common context', () => {
    const views = new ScreenViews();
    expect(views.current).toBe('splash');
    views.view({ screen: 'map' });
    expect(views.current).toBe('map');
  });
});
