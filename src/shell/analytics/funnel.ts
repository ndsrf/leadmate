import type { FunnelStep } from './contract';
import type { SetupPart } from '../onboarding/setup';

export interface FunnelStepInput {
  route: { name: string; step?: string };
  setupPart?: SetupPart | string | null;
  tasteBriefed?: boolean;
  tastePayoff?: boolean;
  introStep?: 'primer' | 'checkpoint' | 'simulation' | 'debrief' | string | null;
  flowName?: string | null;
  isFunnelAuth?: boolean;
  funnelOpen?: boolean;
}

export function funnelStepOf(input: FunnelStepInput): FunnelStep | null {
  const { route, setupPart, tasteBriefed, tastePayoff, introStep, flowName, isFunnelAuth, funnelOpen } = input;

  // Account / Registration flows over the funnel
  if (flowName === 'register') {
    return 'register_prompt';
  }
  if (flowName === 'auth' && isFunnelAuth) {
    return 'account';
  }

  // Route: funnel
  if (route.name === 'funnel') {
    const step = route.step;
    if (step === 'setup') {
      const part = setupPart ?? 'equipment';
      return `setup_${part}` as FunnelStep;
    }
    if (
      step === 'welcome' ||
      step === 'language' ||
      step === 'dog' ||
      step === 'concern' ||
      step === 'diagnostic' ||
      step === 'plan' ||
      step === 'method'
    ) {
      return step;
    }
    return null;
  }

  // Route: taste
  if (route.name === 'taste') {
    if (tastePayoff) {
      return 'taste_payoff';
    }
    if (tasteBriefed) {
      return 'taste_stage';
    }
    return 'taste_briefing';
  }

  // Route: first-stage
  if (route.name === 'first-stage') {
    if (introStep === 'primer') return 'first_primer';
    if (introStep === 'checkpoint') return 'first_checkpoint';
    if (introStep === 'simulation') return 'first_walk';
    if (introStep === 'debrief') return 'first_debrief';
    return null;
  }

  // Route: paywall
  if (route.name === 'paywall') {
    return 'paywall';
  }

  // Route: map
  if (route.name === 'map') {
    return funnelOpen ? 'map' : null;
  }

  return null;
}

export interface FunnelStepViewResult {
  step: FunnelStep;
  repeat: boolean;
  openChangedTo?: boolean;
  doneOnceChangedTo?: boolean;
}

export class FunnelTracker {
  private lastStep: FunnelStep | null = null;
  private funnelOpen: boolean;
  private funnelDoneOnce: boolean;

  constructor(initialState?: { funnelDoneOnce?: boolean; funnelOpen?: boolean }) {
    this.funnelDoneOnce = Boolean(initialState?.funnelDoneOnce);
    this.funnelOpen = Boolean(initialState?.funnelOpen);
  }

  public get isOpen(): boolean {
    return this.funnelOpen;
  }

  public get isDoneOnce(): boolean {
    return this.funnelDoneOnce;
  }

  public syncState(flags: { funnelDoneOnce?: boolean; funnelOpen?: boolean }): void {
    if (flags.funnelDoneOnce !== undefined) this.funnelDoneOnce = flags.funnelDoneOnce;
    if (flags.funnelOpen !== undefined) this.funnelOpen = flags.funnelOpen;
  }

  public resetLastStep(): void {
    this.lastStep = null;
  }

  public stepChange(input: Omit<FunnelStepInput, 'funnelOpen'>): FunnelStepViewResult | null {
    const derived = funnelStepOf({ ...input, funnelOpen: this.funnelOpen });
    if (!derived) {
      return null;
    }

    if (derived === this.lastStep) {
      return null; // Dedupe: re-render is not a new arrival
    }

    this.lastStep = derived;
    const repeat = this.funnelDoneOnce;

    let openChangedTo: boolean | undefined;
    let doneOnceChangedTo: boolean | undefined;

    if (derived === 'map') {
      this.funnelOpen = false;
      this.funnelDoneOnce = true;
      openChangedTo = false;
      doneOnceChangedTo = true;
    } else {
      if (!this.funnelOpen) {
        this.funnelOpen = true;
        openChangedTo = true;
      }
    }

    return {
      step: derived,
      repeat,
      openChangedTo,
      doneOnceChangedTo,
    };
  }
}
