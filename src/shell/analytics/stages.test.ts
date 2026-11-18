import {
  PlayTracker,
  type StartPlayInfo,
} from './stages';

describe('PlayTracker (Task 6.1)', () => {
  it('starts a Stage and ends it as finished with duration and handling_score', () => {
    const tracker = new PlayTracker();
    const t0 = 10000;

    const start = tracker.start(
      {
        type: 'stage',
        stage_kind: 'node',
        stage_id: 'walk-distraction',
        mode: 'stage',
        attempt: 1,
      },
      t0
    );

    expect(start).toEqual({
      name: 'stage_started',
      props: {
        stage_kind: 'node',
        stage_id: 'walk-distraction',
        mode: 'stage',
        attempt: 1,
      },
    });
    expect(tracker.isOpen).toBe(true);

    const end = tracker.end('finished', t0 + 15400, 85);
    expect(end).toEqual({
      name: 'stage_ended',
      props: {
        stage_kind: 'node',
        stage_id: 'walk-distraction',
        mode: 'stage',
        attempt: 1,
        outcome: 'finished',
        duration_seconds: 15,
        handling_score: 85,
      },
    });
    expect(tracker.isOpen).toBe(false);
  });

  it('second end and end with nothing open return null', () => {
    const tracker = new PlayTracker();
    expect(tracker.end('left', 1000)).toBeNull();

    tracker.start(
      {
        type: 'stage',
        stage_kind: 'node',
        stage_id: 'walk-distraction',
        mode: 'stage',
        attempt: 1,
      },
      1000
    );

    const end1 = tracker.end('finished', 5000);
    expect(end1).not.toBeNull();

    const end2 = tracker.end('finished', 6000);
    expect(end2).toBeNull();

    const end3 = tracker.end('left', 7000);
    expect(end3).toBeNull();
  });

  it('accounts for paused wall time and ignores time while paused', () => {
    const tracker = new PlayTracker();
    const t0 = 10000;
    tracker.start(
      {
        type: 'stage',
        stage_kind: 'daily',
        stage_id: 'daily:2026-11-18',
        mode: 'stage',
        attempt: 1,
      },
      t0
    );

    // Run for 3s active
    // Pause for 10s
    tracker.pause(t0 + 3000);
    tracker.resume(t0 + 13000);

    // Run for 4s active (total 7s active)
    const end = tracker.end('finished', t0 + 17000);
    expect(end).toMatchObject({
      name: 'stage_ended',
      props: {
        duration_seconds: 7,
      },
    });
  });

  it('handles ending while currently paused', () => {
    const tracker = new PlayTracker();
    const t0 = 10000;
    tracker.start(
      {
        type: 'stage',
        stage_kind: 'taste',
        stage_id: 'taste',
        mode: 'stage',
        attempt: 1,
      },
      t0
    );

    // Run for 2s
    tracker.pause(t0 + 2000);

    // End after 8s of pause (total wall time 10s, active 2s)
    const end = tracker.end('skipped', t0 + 10000);
    expect(end).toMatchObject({
      name: 'stage_ended',
      props: {
        outcome: 'skipped',
        duration_seconds: 2,
      },
    });
  });

  it('skip-then-release: second end call returns null and keeps skipped outcome', () => {
    const tracker = new PlayTracker();
    tracker.start(
      {
        type: 'stage',
        stage_kind: 'node',
        stage_id: 'calm-hands',
        mode: 'stage',
        attempt: 1,
      },
      1000
    );

    const skip = tracker.end('skipped', 4000);
    expect(skip).toMatchObject({
      name: 'stage_ended',
      props: { outcome: 'skipped', duration_seconds: 3 },
    });

    const release = tracker.end('left', 5000);
    expect(release).toBeNull();
  });

  it('debrief-then-release: debrief finishes and release is ignored', () => {
    const tracker = new PlayTracker();
    tracker.start(
      {
        type: 'stage',
        stage_kind: 'node',
        stage_id: 'calm-hands',
        mode: 'stage',
        attempt: 1,
      },
      1000
    );

    const debrief = tracker.end('finished', 6000, 92);
    expect(debrief).toMatchObject({
      name: 'stage_ended',
      props: { outcome: 'finished', duration_seconds: 5, handling_score: 92 },
    });

    const release = tracker.end('left', 7000);
    expect(release).toBeNull();
  });

  it('error-while-loading: ends as left without score', () => {
    const tracker = new PlayTracker();
    tracker.start(
      {
        type: 'stage',
        stage_kind: 'first',
        stage_id: 'intro-node',
        mode: 'stage',
        attempt: 1,
      },
      1000
    );

    const loadError = tracker.end('left', 2500);
    expect(loadError).toMatchObject({
      name: 'stage_ended',
      props: {
        stage_kind: 'first',
        stage_id: 'intro-node',
        outcome: 'left',
        duration_seconds: 1,
      },
    });
    expect((loadError?.props as any).handling_score).toBeUndefined();
  });

  it('taste skip-then-payoff: stays skipped and payoff finish returns null', () => {
    const tracker = new PlayTracker();
    tracker.start(
      {
        type: 'stage',
        stage_kind: 'taste',
        stage_id: 'taste',
        mode: 'stage',
        attempt: 1,
      },
      1000
    );

    // User skips from Pause Menu onExit
    const skip = tracker.end('skipped', 3000);
    expect(skip?.props.outcome).toBe('skipped');

    // Payoff timer / reaction calls finished
    const finish = tracker.end('finished', 5000);
    expect(finish).toBeNull();
  });

  it('minigame start and end (finished and left)', () => {
    const tracker = new PlayTracker();
    const start = tracker.start(
      {
        type: 'minigame',
        node_id: 'poste-practice',
        attempt: 2,
      },
      1000
    );

    expect(start).toEqual({
      name: 'minigame_started',
      props: {
        node_id: 'poste-practice',
        attempt: 2,
      },
    });

    const finish = tracker.end('finished', 8000, 70);
    expect(finish).toEqual({
      name: 'minigame_ended',
      props: {
        node_id: 'poste-practice',
        attempt: 2,
        outcome: 'finished',
        duration_seconds: 7,
        handling_score: 70,
      },
    });

    // Minigame left without score
    tracker.start(
      {
        type: 'minigame',
        node_id: 'doorbell-mat',
        attempt: 1,
      },
      10000
    );
    const left = tracker.end('left', 14000);
    expect(left).toEqual({
      name: 'minigame_ended',
      props: {
        node_id: 'doorbell-mat',
        attempt: 1,
        outcome: 'left',
        duration_seconds: 4,
      },
    });
    expect((left?.props as any).handling_score).toBeUndefined();
  });

  it('new start while one is open first ends the old one as left', () => {
    const tracker = new PlayTracker();
    tracker.start(
      {
        type: 'stage',
        stage_kind: 'warmup',
        stage_id: 'warmup',
        mode: 'stage',
        attempt: 1,
      },
      1000
    );

    const start2 = tracker.start(
      {
        type: 'stage',
        stage_kind: 'node',
        stage_id: 'calm-hands',
        mode: 'close_exercise',
        attempt: 1,
      },
      5000
    );

    expect(start2.ended).toEqual({
      name: 'stage_ended',
      props: {
        stage_kind: 'warmup',
        stage_id: 'warmup',
        mode: 'stage',
        attempt: 1,
        outcome: 'left',
        duration_seconds: 4,
      },
    });
    expect(start2.name).toBe('stage_started');
    expect(start2.props).toEqual({
      stage_kind: 'node',
      stage_id: 'calm-hands',
      mode: 'close_exercise',
      attempt: 1,
    });
  });
});
