import {
  detectDebriefTroubleRecommendation,
  diffCalendarDays,
  loadShopState,
  recordGeneralOfferIgnored,
  recordShopPopupShown,
  resetGeneralOfferIgnored,
  saveShopState,
  shouldOfferShop,
  shouldShowLink,
  shouldShowRecommendation,
  toCalendarDateString,
  type ShopState,
  type ShopStorage,
} from './shop';

describe('shop pure rules', () => {
  const today = '2026-11-08';
  const yesterday = '2026-11-07';
  const threeDaysAgo = '2026-11-05';
  const fourDaysAgo = '2026-11-04';

  const baseState: ShopState = {
    generalOfferIgnoredCount: 0,
    lastRecommendationDates: {},
    firstSeenDate: fourDaysAgo,
  };

  describe('one-popup-per-day cap', () => {
    it('prevents general offer when any shop popup was already shown today', () => {
      const stateWithPopupToday: ShopState = {
        ...baseState,
        lastPopupDate: today,
      };
      expect(shouldOfferShop({ state: stateWithPopupToday, today })).toBe(false);
    });

    it('prevents trouble recommendation popup when any shop popup was already shown today', () => {
      const stateWithPopupToday: ShopState = {
        ...baseState,
        lastPopupDate: today,
      };
      expect(
        shouldShowLink({
          recommendationId: 'rec-poste',
          trigger: 'poste-trouble',
          state: stateWithPopupToday,
          today,
        })
      ).toBe(false);
    });

    it('allows popup when the last popup was on a previous calendar day', () => {
      const stateWithOldPopup: ShopState = {
        ...baseState,
        lastPopupDate: yesterday,
        lastGeneralOfferDate: fourDaysAgo,
      };
      expect(shouldOfferShop({ state: stateWithOldPopup, today })).toBe(true);
      expect(
        shouldShowLink({
          recommendationId: 'rec-poste',
          trigger: 'poste-trouble',
          state: stateWithOldPopup,
          today,
        })
      ).toBe(true);
    });
  });

  describe('trouble-beats-general-offer', () => {
    it('suppresses general offer when a trouble popup is pending', () => {
      expect(
        shouldOfferShop({
          state: baseState,
          today,
          hasPendingTrouble: true,
        })
      ).toBe(false);
    });

    it('allows general offer when no trouble popup is pending', () => {
      expect(
        shouldOfferShop({
          state: baseState,
          today,
          hasPendingTrouble: false,
        })
      ).toBe(true);
    });
  });

  describe('3-day cadence', () => {
    it('suppresses general offer if shown 1 or 2 days ago', () => {
      const state1DayAgo: ShopState = { ...baseState, lastGeneralOfferDate: yesterday };
      expect(shouldOfferShop({ state: state1DayAgo, today })).toBe(false);

      const state2DaysAgo: ShopState = { ...baseState, lastGeneralOfferDate: '2026-11-06' };
      expect(shouldOfferShop({ state: state2DaysAgo, today })).toBe(false);
    });

    it('allows general offer when 3 or more days have elapsed', () => {
      const state3DaysAgo: ShopState = { ...baseState, lastGeneralOfferDate: threeDaysAgo };
      expect(shouldOfferShop({ state: state3DaysAgo, today })).toBe(true);

      const state4DaysAgo: ShopState = { ...baseState, lastGeneralOfferDate: fourDaysAgo };
      expect(shouldOfferShop({ state: state4DaysAgo, today })).toBe(true);
    });
  });

  describe('3-ignore opt-out', () => {
    it('allows offer when ignored 0, 1, or 2 times', () => {
      expect(shouldOfferShop({ state: { ...baseState, generalOfferIgnoredCount: 0 }, today })).toBe(true);
      expect(shouldOfferShop({ state: { ...baseState, generalOfferIgnoredCount: 1 }, today })).toBe(true);
      expect(shouldOfferShop({ state: { ...baseState, generalOfferIgnoredCount: 2 }, today })).toBe(true);
    });

    it('suppresses offer permanently once ignored 3 or more times', () => {
      expect(shouldOfferShop({ state: { ...baseState, generalOfferIgnoredCount: 3 }, today })).toBe(false);
      expect(shouldOfferShop({ state: { ...baseState, generalOfferIgnoredCount: 5 }, today })).toBe(false);
    });
  });

  describe('per-Recommendation daily limit', () => {
    it('suppresses a recommendation if it was already shown today', () => {
      const stateRecShownToday: ShopState = {
        ...baseState,
        lastPopupDate: yesterday, // another popup was yesterday
        lastRecommendationDates: {
          'rec-arnes': today,
        },
      };

      expect(
        shouldShowLink({
          recommendationId: 'rec-arnes',
          trigger: 'poste-trouble',
          state: stateRecShownToday,
          today,
        })
      ).toBe(false);

      // But a different recommendation that was not shown today can be shown
      expect(
        shouldShowLink({
          recommendationId: 'rec-other',
          trigger: 'poste-trouble',
          state: stateRecShownToday,
          today,
        })
      ).toBe(true);
    });

    it('allows recommendation if it was shown on a previous day', () => {
      const stateRecShownYesterday: ShopState = {
        ...baseState,
        lastPopupDate: yesterday,
        lastRecommendationDates: {
          'rec-arnes': yesterday,
        },
      };

      expect(
        shouldShowLink({
          recommendationId: 'rec-arnes',
          trigger: 'poste-trouble',
          state: stateRecShownYesterday,
          today,
        })
      ).toBe(true);
    });
  });

  describe('training gate', () => {
    it('suppresses general offer while training is active', () => {
      expect(shouldOfferShop({ state: baseState, today, isTrainingActive: true })).toBe(false);
      expect(shouldOfferShop({ state: baseState, today, currentFlow: 'stage' })).toBe(false);
      expect(shouldOfferShop({ state: baseState, today, currentFlow: 'minigame' })).toBe(false);
      expect(shouldOfferShop({ state: baseState, today, currentFlow: 'close' })).toBe(false);
      expect(shouldOfferShop({ state: baseState, today, currentFlow: 'lesson' })).toBe(false);
    });

    it('allows general offer on World Map', () => {
      expect(shouldOfferShop({ state: baseState, today, isTrainingActive: false, currentFlow: 'map' })).toBe(true);
    });

    it('suppresses trouble popup while training is active', () => {
      expect(
        shouldShowLink({
          recommendationId: 'rec-1',
          trigger: 'poste-trouble',
          state: baseState,
          today,
          isTrainingActive: true,
        })
      ).toBe(false);

      expect(
        shouldShowLink({
          recommendationId: 'rec-1',
          trigger: 'poor-score',
          state: baseState,
          today,
          currentFlow: 'stage',
        })
      ).toBe(false);
    });

    it('allows trouble popup on the World Map', () => {
      expect(
        shouldShowLink({
          recommendationId: 'rec-1',
          trigger: 'poste-trouble',
          state: baseState,
          today,
          isTrainingActive: false,
          currentFlow: 'map',
        })
      ).toBe(true);
    });
  });

  describe('day-one gate', () => {
    it('suppresses general offer on the user first active day', () => {
      const firstDayState: ShopState = {
        ...baseState,
        firstSeenDate: today,
      };
      expect(shouldOfferShop({ state: firstDayState, today })).toBe(false);
      expect(shouldOfferShop({ state: baseState, today, isFirstDay: true })).toBe(false);
    });
  });

  describe('in-content view cards', () => {
    it('always shows view cards when target is available, even if popup was shown today', () => {
      const stateWithPopupToday: ShopState = {
        ...baseState,
        lastPopupDate: today,
      };

      expect(
        shouldShowLink({
          recommendationId: 'rec-view-card',
          trigger: 'view',
          state: stateWithPopupToday,
          today,
          targetInShop: true,
        })
      ).toBe(true);
    });

    it('hides view card if target is not in the shop catalogue', () => {
      expect(
        shouldShowLink({
          recommendationId: 'rec-view-card',
          trigger: 'view',
          state: baseState,
          today,
          targetInShop: false,
        })
      ).toBe(false);
    });
  });

  describe('date utility helpers', () => {
    it('calculates calendar difference accurately across days and months', () => {
      expect(diffCalendarDays('2026-11-08', '2026-11-05')).toBe(3);
      expect(diffCalendarDays('2026-11-01', '2026-10-31')).toBe(1);
      expect(diffCalendarDays('2026-11-08', '2026-11-08')).toBe(0);
    });

    it('formats dates consistently', () => {
      const d = new Date(2026, 10, 8); // month index 10 = November
      expect(toCalendarDateString(d)).toBe('2026-11-08');
    });
  });
});

describe('shop state storage operations', () => {
  function createMockStorage(): ShopStorage & { store: Record<string, string> } {
    const store: Record<string, string> = {};
    return {
      store,
      getItem: jest.fn((k: string) => Promise.resolve(store[k] ?? null)),
      setItem: jest.fn((k: string, v: string) => {
        store[k] = v;
        return Promise.resolve();
      }),
      removeItem: jest.fn((k: string) => {
        delete store[k];
        return Promise.resolve();
      }),
    };
  }

  it('loads default state and records firstSeenDate on initial run', async () => {
    const storage = createMockStorage();
    const now = new Date(2026, 10, 8);
    const loaded = await loadShopState(storage, now);

    expect(loaded.firstSeenDate).toBe('2026-11-08');
    expect(loaded.generalOfferIgnoredCount).toBe(0);
    expect(loaded.lastRecommendationDates).toEqual({});
  });

  it('persists and updates popup timestamp and general offer date', async () => {
    const storage = createMockStorage();
    const now = new Date(2026, 10, 8);
    const initial = await loadShopState(storage, now);

    const updated = await recordShopPopupShown(initial, {
      isGeneralOffer: true,
      now,
      storage,
    });

    expect(updated.lastPopupDate).toBe('2026-11-08');
    expect(updated.lastGeneralOfferDate).toBe('2026-11-08');

    // Reload from storage
    const reloaded = await loadShopState(storage, now);
    expect(reloaded.lastPopupDate).toBe('2026-11-08');
    expect(reloaded.lastGeneralOfferDate).toBe('2026-11-08');
  });

  it('tracks per-recommendation popup timestamps', async () => {
    const storage = createMockStorage();
    const now = new Date(2026, 10, 8);
    const initial = await loadShopState(storage, now);

    const updated = await recordShopPopupShown(initial, {
      recommendationId: 'rec-arnes-poste',
      now,
      storage,
    });

    expect(updated.lastPopupDate).toBe('2026-11-08');
    expect(updated.lastRecommendationDates['rec-arnes-poste']).toBe('2026-11-08');
  });

  it('increments and resets ignored count', async () => {
    const storage = createMockStorage();
    let state = await loadShopState(storage);

    state = await recordGeneralOfferIgnored(state, storage);
    expect(state.generalOfferIgnoredCount).toBe(1);

    state = await recordGeneralOfferIgnored(state, storage);
    expect(state.generalOfferIgnoredCount).toBe(2);

    state = await resetGeneralOfferIgnored(state, storage);
    expect(state.generalOfferIgnoredCount).toBe(0);
  });

  describe('detectDebriefTroubleRecommendation', () => {
    const shopCatalogue = {
      idToKind: {
        'arnes-y': 'product' as const,
        'collar-fijo': 'product' as const,
      },
    };

    const recommendations = [
      { id: 'rec-poste', target: 'arnes-y', when: 'poste-trouble', explanation: 'Ayuda con Poste' },
      { id: 'rec-score', target: 'collar-fijo', when: 'poor-score', explanation: 'Ayuda con Score' },
    ];

    it('detects poste trouble recommendation when posteFailures >= 2', () => {
      const result = detectDebriefTroubleRecommendation({
        recommendations,
        posteFailures: 2,
        score: 80,
        shopCatalogue,
      });
      expect(result).toBeDefined();
      expect(result?.recommendationId).toBe('rec-poste');
      expect(result?.when).toBe('poste-trouble');
    });

    it('detects poor score recommendation when score < 200 and no poste trouble', () => {
      const result = detectDebriefTroubleRecommendation({
        recommendations,
        posteFailures: 1,
        score: 150,
        shopCatalogue,
      });
      expect(result).toBeDefined();
      expect(result?.recommendationId).toBe('rec-score');
      expect(result?.when).toBe('poor-score');
    });

    it('returns undefined when score is high and posteFailures < 2', () => {
      const result = detectDebriefTroubleRecommendation({
        recommendations,
        posteFailures: 0,
        score: 750,
        shopCatalogue,
      });
      expect(result).toBeUndefined();
    });
  });
});
