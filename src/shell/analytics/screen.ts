import type { FunnelStep, ScreenName } from './contract';

export interface ScreenFlow {
  name: string;
  id?: string;
  mode?: string;
  view?: string;
  result?: unknown;
  run?: { step: string; node: { id: string; mode: string } };
}

export interface ScreenInput {
  route: { name: string; step?: string; flow?: unknown };
  /** The Funnel step the route shows, from `funnelStepOf` (null outside the Funnel). */
  funnelStep: FunnelStep | null;
  /** The active flow, whatever the route. */
  flow: ScreenFlow | null;
  /** The visible Settings Area. */
  settingsTab: 'dog' | 'preferences' | 'account';
}

export interface ScreenResult {
  screen: ScreenName;
  itemId?: string;
}

// same shape the event contract accepts for an `id` property
const ITEM_ID = /^[a-z0-9][a-z0-9_.:-]{0,63}$/;

function item(screen: ScreenName, id: string | undefined): ScreenResult {
  return id !== undefined && ITEM_ID.test(id) ? { screen, itemId: id } : { screen };
}

const MISSION_SCREENS: Record<string, ScreenName> = {
  check: 'mission_check',
  brief: 'mission_brief',
  waiting: 'mission_waiting',
  checkin: 'mission_checkin',
  problem: 'mission_problem',
  fix: 'mission_fix',
  passed: 'mission_passed',
};

/** The screen at the front, or null when it cannot be told yet (the caller keeps the last one). */
export function screenOf({ route, funnelStep, flow, settingsTab }: ScreenInput): ScreenResult | null {
  if (route.name === 'splash') return { screen: 'splash' };

  if (route.name === 'flow' && flow) {
    switch (flow.name) {
      case 'auth':
        return { screen: flow.mode === 'login' ? 'auth_login' : 'auth_signup' };
      case 'register':
        return { screen: funnelStep === 'register_prompt' ? 'register_prompt' : 'register' };
      case 'library':
        return { screen: 'library' };
      case 'diary':
        return { screen: 'diary' };
      case 'lesson':
        return item('lesson', flow.id);
      case 'mission': {
        const screen = MISSION_SCREENS[flow.view ?? ''];
        return screen ? item(screen, flow.id) : null;
      }
      case 'node': {
        if (!flow.run) return null;
        const { step, node } = flow.run;
        if (step === 'primer') return item('node_primer', node.id);
        if (step === 'checkpoint') return item('node_checkpoint', node.id);
        if (step === 'debrief') return item('node_debrief', node.id);
        if (step === 'simulation') return item(node.mode === 'minigame' ? 'node_minigame' : 'node_stage', node.id);
        return null;
      }
      case 'daily':
        return { screen: flow.result == null ? 'daily_stage' : 'daily_result' };
      case 'warmup':
        return { screen: 'warmup_stage' };
      case 'puzzle':
        return { screen: 'barkdoku' };
      case 'shop':
        return { screen: 'shop' };
      case 'paywall':
        return { screen: 'paywall' };
      default:
        return null;
    }
  }

  switch (route.name) {
    case 'funnel':
    case 'taste':
    case 'first-stage':
      return funnelStep ? { screen: funnelStep } : null;
    case 'paywall':
      return { screen: 'paywall' };
    case 'recap':
      return { screen: 'value_recap' };
    case 'settings':
      return { screen: `settings_${settingsTab}` };
    case 'map':
      return { screen: 'map' };
    default:
      return null;
  }
}

export interface ScreenView {
  screen: ScreenName;
  previous_screen?: ScreenName;
  itemId?: string;
}

/** Reports a view only when `screen` or the item id changes, with the screen it came from. */
export class ScreenViews {
  private screen: ScreenName | null = null;
  private itemId: string | undefined;

  /** The screen at the front now; splash before any view. */
  public get current(): ScreenName {
    return this.screen ?? 'splash';
  }

  public view(next: ScreenResult | null): ScreenView | null {
    if (!next) return null;
    if (next.screen === this.screen && next.itemId === this.itemId) return null;
    const previous = this.screen;
    this.screen = next.screen;
    this.itemId = next.itemId;
    const out: ScreenView = { screen: next.screen };
    if (previous) out.previous_screen = previous;
    if (next.itemId !== undefined) out.itemId = next.itemId;
    return out;
  }
}
