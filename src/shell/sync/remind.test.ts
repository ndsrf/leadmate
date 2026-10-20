import { newDogRecord, type DogRecord } from '../dogRecord';
import { countStage, markReminded, shouldRemind } from './remind';
import { NEW_SYNC_STATE, type SyncState } from './state';

const done = (over: Partial<DogRecord> = {}): DogRecord => ({ ...newDogRecord(), onboarding: { ...newDogRecord().onboarding, step: 'done' }, ...over });
const noon = new Date(2026, 4, 10, 12);

describe('shouldRemind', () => {
  it('stays quiet for a new user', () => {
    expect(shouldRemind(done(), NEW_SYNC_STATE, false, noon)).toBe(false);
  });

  it('fires after the third Stage', () => {
    let sync: SyncState = NEW_SYNC_STATE;
    for (let i = 0; i < 2; i++) sync = countStage(sync);
    expect(shouldRemind(done(), sync, false, noon)).toBe(false);
    sync = countStage(sync);
    expect(shouldRemind(done(), sync, false, noon)).toBe(true);
  });

  it('fires on a 3-day Streak', () => {
    expect(shouldRemind(done({ streak: { current: 2, best: 2, lastActiveDate: '2026-05-10' } }), NEW_SYNC_STATE, false, noon)).toBe(false);
    expect(shouldRemind(done({ streak: { current: 3, best: 3, lastActiveDate: '2026-05-10' } }), NEW_SYNC_STATE, false, noon)).toBe(true);
  });

  it('shows at most once per day', () => {
    const sync = markReminded({ ...NEW_SYNC_STATE, stagesCompleted: 5 }, noon);
    expect(shouldRemind(done(), sync, false, noon)).toBe(false);
    expect(shouldRemind(done(), sync, false, new Date(2026, 4, 11, 9))).toBe(true);
  });

  it('never fires for a signed-in user or during the funnel', () => {
    const sync = { ...NEW_SYNC_STATE, stagesCompleted: 5 };
    expect(shouldRemind(done(), sync, true, noon)).toBe(false);
    expect(shouldRemind(newDogRecord(), sync, false, noon)).toBe(false);
  });
});
