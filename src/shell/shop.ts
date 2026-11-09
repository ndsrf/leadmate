import AsyncStorage from '@react-native-async-storage/async-storage';
import { POOR_SCORE_BELOW } from './stars';

export { POOR_SCORE_BELOW };

export const SHOP_STATE_STORAGE_KEY = 'leadmate.shopState';

export interface ShopStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem?: (key: string) => Promise<void>;
}

export interface ShopState {
  /** YYYY-MM-DD string of the last shop popup shown (trouble trigger or general offer) */
  lastPopupDate?: string;
  /** YYYY-MM-DD string of the last general shop offer shown */
  lastGeneralOfferDate?: string;
  /** Consecutive times the general offer popup was ignored/dismissed (3 = opt out) */
  generalOfferIgnoredCount: number;
  /** Map of recommendation ID -> YYYY-MM-DD string when its popup was last shown */
  lastRecommendationDates: Record<string, string>;
  /** YYYY-MM-DD string when the shop was first seen on this device (for day one gate) */
  firstSeenDate?: string;
}

export const DEFAULT_SHOP_STATE: Readonly<ShopState> = {
  generalOfferIgnoredCount: 0,
  lastRecommendationDates: {},
};

/**
 * Formats a Date as a calendar date string (YYYY-MM-DD) in local time.
 */
export function toCalendarDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Computes difference in calendar days between two YYYY-MM-DD date strings.
 */
export function diffCalendarDays(dateStr1: string, dateStr2: string): number {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs(utc1 - utc2) / msPerDay);
}

export type AppFlowName =
  | 'map'
  | 'warmup'
  | 'register'
  | 'auth'
  | 'daily'
  | 'node'
  | 'library'
  | 'diary'
  | 'lesson'
  | 'mission'
  | 'paywall'
  | 'puzzle'
  | 'shop'
  | (string & {});

export interface ShopTimeContext {
  state: ShopState;
  now?: Date;
  today?: string;
}

export interface ShopFlowContext {
  isTrainingActive?: boolean;
  currentFlow?: AppFlowName;
}

/** Determines if a given flow or training flag represents active training. */
export function isTrainingFlow(flow?: AppFlowName, isTrainingActive?: boolean): boolean {
  if (isTrainingActive !== undefined) return isTrainingActive;
  if (!flow) return false;
  return ['stage', 'minigame', 'close', 'lesson', 'node'].includes(flow);
}

export interface ShouldOfferShopOptions {
  time?: ShopTimeContext;
  flow?: ShopFlowContext;
  state?: ShopState;
  now?: Date;
  today?: string;
  hasShopItems?: boolean;
  hasPendingTrouble?: boolean;
  isTrainingActive?: boolean;
  currentFlow?: AppFlowName;
  isFirstDay?: boolean;
}

/**
 * Pure function determining whether the general Shop offer popup should appear.
 * Rules:
 * 1. Active pack must have buyable shop items.
 * 2. Training gate: Never show while a stage, minigame, close exercise, or lesson is active.
 * 3. Trouble beats general offer: If a trouble popup is pending, do not offer.
 * 4. At most one shop popup per calendar day overall.
 * 5. 3-ignore opt out: Stops offering after user ignores/dismisses 3 times.
 * 6. Not on day one (first active day).
 * 7. Cadence: At most every 3 calendar days.
 */
export function shouldOfferShop(options: ShouldOfferShopOptions): boolean {
  const state = options.time?.state ?? options.state!;
  const now = options.time?.now ?? options.now ?? new Date();
  const today = options.time?.today ?? options.today ?? toCalendarDateString(now);
  const {
    hasShopItems = true,
    hasPendingTrouble = false,
    isFirstDay,
  } = options;

  // 1. Must have shop items
  if (!hasShopItems) return false;

  // 2. Training gate: Never show during training
  const training = isTrainingFlow(
    options.flow?.currentFlow ?? options.currentFlow,
    options.flow?.isTrainingActive ?? options.isTrainingActive,
  );
  if (training) return false;

  // 3. Trouble beats general offer
  if (hasPendingTrouble) return false;

  // 4. One popup per day cap overall
  if (state.lastPopupDate === today) return false;

  // 5. 3-ignore opt-out
  if (state.generalOfferIgnoredCount >= 3) return false;

  // 6. Not on day one
  const firstDay = isFirstDay ?? (state.firstSeenDate === today);
  if (firstDay) return false;

  // 7. 3-day cadence
  if (state.lastGeneralOfferDate) {
    const daysSince = diffCalendarDays(today, state.lastGeneralOfferDate);
    if (daysSince < 3) return false;
  }

  return true;
}

export interface ShouldShowRecommendationOptions {
  recommendationId: string;
  trigger?: string;
  time?: ShopTimeContext;
  flow?: ShopFlowContext;
  state?: ShopState;
  now?: Date;
  today?: string;
  targetInShop?: boolean;
  isTrainingActive?: boolean;
  currentFlow?: AppFlowName;
}

export type ShouldShowLinkOptions = ShouldShowRecommendationOptions;

/**
 * Pure function determining whether an authored Recommendation popup should be displayed.
 * Conforms to GLOSSARY.md domain terminology ("Recommendation").
 * Rules:
 * - Target must exist and be buyable in the resolved shop catalogue.
 * - 'view' trigger renders as an in-content card (not a popup) and is always shown when target is available.
 * - Trouble triggers ('poste-trouble', 'poor-score', 'problem:*') render as popups on the World Map:
 *   1. Training gate: Never shown during an active exercise.
 *   2. At most one popup per calendar day overall.
 *   3. At most one popup per recommendation per calendar day.
 */
export function shouldShowRecommendation(options: ShouldShowRecommendationOptions): boolean {
  const {
    recommendationId,
    trigger = 'view',
    targetInShop = true,
  } = options;

  const state = options.time?.state ?? options.state!;
  const now = options.time?.now ?? options.now ?? new Date();
  const today = options.time?.today ?? options.today ?? toCalendarDateString(now);

  // Target must be present and buyable
  if (!targetInShop) return false;

  // In-content cards have no popup frequency limits
  if (trigger === 'view') {
    return true;
  }

  // Trouble popup triggers:
  // 1. Training gate
  const training = isTrainingFlow(
    options.flow?.currentFlow ?? options.currentFlow,
    options.flow?.isTrainingActive ?? options.isTrainingActive,
  );
  if (training) return false;

  // 2. One popup per calendar day cap
  if (state.lastPopupDate === today) return false;

  // 3. Per-recommendation daily limit
  if (state.lastRecommendationDates && state.lastRecommendationDates[recommendationId] === today) {
    return false;
  }

  return true;
}

// Backward-compatible alias
export const shouldShowLink = shouldShowRecommendation;

export interface PendingShopRecommendation {
  recommendationId: string;
  target: string;
  targetKind: 'category' | 'subcategory' | 'product';
  when: string;
  explanation: string;
}

export interface DetectDebriefTroubleParams {
  recommendations?: Array<{
    id: string;
    target: string;
    targetKind?: 'category' | 'subcategory' | 'product';
    when: string;
    explanation: string | any;
  }>;
  posteFailures: number;
  score?: number;
  shopCatalogue?: {
    idToKind: Record<string, string>;
  };
  poorScoreThreshold?: number;
}

/**
 * Pure helper detecting whether a debrief's performance (poste failures or low score)
 * qualifies for a trouble recommendation popup. Eliminates Feature Envy from application screens.
 */
export function detectDebriefTroubleRecommendation(
  params: DetectDebriefTroubleParams,
): PendingShopRecommendation | undefined {
  const {
    recommendations,
    posteFailures,
    score,
    shopCatalogue,
    poorScoreThreshold = POOR_SCORE_BELOW,
  } = params;

  if (!recommendations || recommendations.length === 0 || !shopCatalogue) {
    return undefined;
  }

  let matchedRec: (typeof recommendations)[number] | undefined;
  let matchedWhen: string | undefined;

  if (posteFailures >= 2) {
    matchedRec = recommendations.find(
      (cand) => cand.when === 'poste-trouble' && Boolean(shopCatalogue.idToKind && shopCatalogue.idToKind[cand.target]),
    );
    if (matchedRec) matchedWhen = 'poste-trouble';
  }

  if (!matchedRec && score !== undefined && score < poorScoreThreshold) {
    matchedRec = recommendations.find(
      (cand) => cand.when === 'poor-score' && Boolean(shopCatalogue.idToKind && shopCatalogue.idToKind[cand.target]),
    );
    if (matchedRec) matchedWhen = 'poor-score';
  }

  if (matchedRec && matchedWhen) {
    return {
      recommendationId: matchedRec.id,
      target: matchedRec.target,
      targetKind:
        (matchedRec.targetKind as 'category' | 'subcategory' | 'product') ??
        (shopCatalogue.idToKind[matchedRec.target] as 'category' | 'subcategory' | 'product') ??
        'product',
      when: matchedWhen,
      explanation: matchedRec.explanation,
    };
  }

  return undefined;
}

/**
 * Loads device-local ShopState from storage.
 */
export async function loadShopState(
  storage: ShopStorage = AsyncStorage,
  now: Date = new Date()
): Promise<ShopState> {
  try {
    const raw = await storage.getItem(SHOP_STATE_STORAGE_KEY);
    if (!raw) {
      const today = toCalendarDateString(now);
      const initial: ShopState = {
        ...DEFAULT_SHOP_STATE,
        firstSeenDate: today,
      };
      await storage.setItem(SHOP_STATE_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      lastPopupDate: parsed.lastPopupDate,
      lastGeneralOfferDate: parsed.lastGeneralOfferDate,
      generalOfferIgnoredCount: parsed.generalOfferIgnoredCount ?? 0,
      lastRecommendationDates: parsed.lastRecommendationDates ?? {},
      firstSeenDate: parsed.firstSeenDate,
    };
  } catch {
    return { ...DEFAULT_SHOP_STATE };
  }
}

/**
 * Persists ShopState to storage.
 */
export async function saveShopState(
  state: ShopState,
  storage: ShopStorage = AsyncStorage
): Promise<void> {
  try {
    await storage.setItem(SHOP_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Graceful no-op on storage errors
  }
}

/**
 * Records that a shop popup was shown (trouble recommendation or general offer),
 * updating daily and per-recommendation timestamps.
 */
export async function recordShopPopupShown(
  state: ShopState,
  options: {
    recommendationId?: string;
    isGeneralOffer?: boolean;
    now?: Date;
    storage?: ShopStorage;
  }
): Promise<ShopState> {
  const { recommendationId, isGeneralOffer = false, now = new Date(), storage = AsyncStorage } = options;
  const today = toCalendarDateString(now);

  const updated: ShopState = {
    ...state,
    lastPopupDate: today,
    ...(isGeneralOffer ? { lastGeneralOfferDate: today } : {}),
    lastRecommendationDates: {
      ...state.lastRecommendationDates,
      ...(recommendationId ? { [recommendationId]: today } : {}),
    },
  };

  await saveShopState(updated, storage);
  return updated;
}

/**
 * Records that the general offer popup was dismissed or timed out without visiting the shop.
 */
export async function recordGeneralOfferIgnored(
  state: ShopState,
  storage: ShopStorage = AsyncStorage
): Promise<ShopState> {
  const updated: ShopState = {
    ...state,
    generalOfferIgnoredCount: state.generalOfferIgnoredCount + 1,
  };
  await saveShopState(updated, storage);
  return updated;
}

/**
 * Resets the ignored count when the user deliberately opens or interacts with the shop.
 */
export async function resetGeneralOfferIgnored(
  state: ShopState,
  storage: ShopStorage = AsyncStorage
): Promise<ShopState> {
  if (state.generalOfferIgnoredCount === 0) {
    return state;
  }
  const updated: ShopState = {
    ...state,
    generalOfferIgnoredCount: 0,
  };
  await saveShopState(updated, storage);
  return updated;
}
