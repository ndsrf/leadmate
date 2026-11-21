import {
  buildEvent,
  SCHEMA_VERSION,
  FUNNEL_STEPS,
  SCREENS,
  CommonProperties,
  EVENTS,
} from './contract';

const baseCommon: CommonProperties = {
  app_version: '1.2.0',
  content_version: 42,
  content_channel: 'beta',
  language: 'es',
  seconds_since_install: 120,
};

describe('Analytics Event Contract (Task 2.1)', () => {
  it('returns null for an unknown event name', () => {
    const event = buildEvent('unknown_event_name' as any, {}, baseCommon);
    expect(event).toBeNull();
  });

  it('returns null when an undeclared property is passed', () => {
    const event = buildEvent(
      'funnel_step_viewed',
      {
        step: 'welcome',
        repeat: false,
        undeclared_prop: 'bad',
      } as any,
      baseCommon
    );
    expect(event).toBeNull();
  });

  it('returns null when a required property is missing', () => {
    const event = buildEvent(
      'funnel_step_viewed',
      {
        step: 'welcome',
        // repeat is missing
      } as any,
      baseCommon
    );
    expect(event).toBeNull();
  });

  describe('id property kind validation', () => {
    it('rejects values with spaces', () => {
      const event = buildEvent(
        'lesson_opened',
        { lesson_id: 'bad id', source: 'trail' },
        baseCommon
      );
      expect(event).toBeNull();
    });

    it('rejects values with upper case characters', () => {
      const event = buildEvent(
        'lesson_opened',
        { lesson_id: 'BadLesson', source: 'trail' },
        baseCommon
      );
      expect(event).toBeNull();
    });

    it('rejects values with @ character', () => {
      const event = buildEvent(
        'lesson_opened',
        { lesson_id: 'user@domain.com', source: 'trail' },
        baseCommon
      );
      expect(event).toBeNull();
    });

    it('rejects values longer than 64 characters', () => {
      const longId = 'a'.repeat(65);
      const event = buildEvent(
        'lesson_opened',
        { lesson_id: longId, source: 'trail' },
        baseCommon
      );
      expect(event).toBeNull();
    });

    it('rejects UUID-shaped values', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const event = buildEvent(
        'lesson_opened',
        { lesson_id: uuid, source: 'trail' },
        baseCommon
      );
      expect(event).toBeNull();
    });

    it('accepts valid id formats (lowercase, digits, ., :, -, _)', () => {
      const validIds = ['welcome', 'intro-node', 'daily:2026-11-18', 'world_1.step-2'];
      for (const id of validIds) {
        const event = buildEvent(
          'lesson_opened',
          { lesson_id: id, source: 'trail' },
          baseCommon
        );
        expect(event).not.toBeNull();
        expect(event?.properties.lesson_id).toBe(id);
      }
    });
  });

  describe('int property kind validation', () => {
    it('rejects NaN', () => {
      const event = buildEvent(
        'session_started',
        { days_since_install: NaN, first_session: true, upgraded_install: false },
        baseCommon
      );
      expect(event).toBeNull();
    });

    it('rejects Infinity and -Infinity', () => {
      const eventPos = buildEvent(
        'session_started',
        { days_since_install: Infinity, first_session: true, upgraded_install: false },
        baseCommon
      );
      expect(eventPos).toBeNull();

      const eventNeg = buildEvent(
        'session_started',
        { days_since_install: -Infinity, first_session: true, upgraded_install: false },
        baseCommon
      );
      expect(eventNeg).toBeNull();
    });

    it('rounds numbers to nearest whole integer', () => {
      const event = buildEvent(
        'session_started',
        { days_since_install: 3.7, first_session: true, upgraded_install: false },
        baseCommon
      );
      expect(event).not.toBeNull();
      expect(event?.properties.days_since_install).toBe(4);
    });
  });

  it('every built event carries schema_version 1 and common properties', () => {
    const event = buildEvent(
      'funnel_step_viewed',
      { step: 'welcome', repeat: false },
      baseCommon
    );
    expect(event).not.toBeNull();
    expect(event?.name).toBe('funnel_step_viewed');
    expect(event?.properties.schema_version).toBe(SCHEMA_VERSION);
    expect(event?.properties.schema_version).toBe(1);
    expect(event?.properties.app_version).toBe('1.2.0');
    expect(event?.properties.content_version).toBe(42);
    expect(event?.properties.content_channel).toBe('beta');
    expect(event?.properties.language).toBe('es');
    expect(event?.properties.seconds_since_install).toBe(120);
    expect(event?.properties.step).toBe('welcome');
    expect(event?.properties.repeat).toBe(false);
  });

  it('clamps negative seconds_since_install to 0', () => {
    const commonClockBack: CommonProperties = {
      ...baseCommon,
      seconds_since_install: -50,
    };
    const event = buildEvent(
      'funnel_step_viewed',
      { step: 'welcome', repeat: false },
      commonClockBack
    );
    expect(event).not.toBeNull();
    expect(event?.properties.seconds_since_install).toBe(0);
  });

  describe('Encounter Stage properties (Task 8.1)', () => {
    it('accepts optional encounter_id and encounter_attempt on stage_started', () => {
      const event = buildEvent(
        'stage_started',
        {
          stage_kind: 'node',
          stage_id: 'walk-distraction',
          mode: 'stage',
          attempt: 1,
          encounter_id: 'loose-start',
          encounter_attempt: 2,
        },
        baseCommon
      );
      expect(event).not.toBeNull();
      expect(event?.properties.encounter_id).toBe('loose-start');
      expect(event?.properties.encounter_attempt).toBe(2);
    });

    it('accepts optional encounter_id, encounter_attempt and paws on stage_ended', () => {
      const event = buildEvent(
        'stage_ended',
        {
          stage_kind: 'node',
          stage_id: 'walk-distraction',
          mode: 'stage',
          attempt: 1,
          outcome: 'finished',
          duration_seconds: 14,
          encounter_id: 'turn-look',
          encounter_attempt: 1,
          paws: 3,
        },
        baseCommon
      );
      expect(event).not.toBeNull();
      expect(event?.properties.encounter_id).toBe('turn-look');
      expect(event?.properties.encounter_attempt).toBe(1);
      expect(event?.properties.paws).toBe(3);
    });

    it('rejects invalid encounter_id or non-int paws/encounter_attempt', () => {
      const badId = buildEvent(
        'stage_started',
        {
          stage_kind: 'node',
          stage_id: 'walk-distraction',
          mode: 'stage',
          attempt: 1,
          encounter_id: 'Bad_Caps',
          encounter_attempt: 1,
        },
        baseCommon
      );
      expect(badId).toBeNull();

      const badPaws = buildEvent(
        'stage_ended',
        {
          stage_kind: 'node',
          stage_id: 'walk-distraction',
          mode: 'stage',
          attempt: 1,
          outcome: 'finished',
          duration_seconds: 10,
          paws: NaN,
        },
        baseCommon
      );
      expect(badPaws).toBeNull();
    });
  });

  describe('Dog Games analytics (Task 6.1)', () => {
    it('accepts game_random_picked with game_id and optional plus_status', () => {
      const event = buildEvent(
        'game_random_picked',
        { game_id: 'eleccion-mano', plus_status: 'free' },
        baseCommon
      );
      expect(event).not.toBeNull();
      expect(event?.properties.game_id).toBe('eleccion-mano');
      expect(event?.properties.plus_status).toBe('free');

      const eventNoPlus = buildEvent(
        'game_random_picked',
        { game_id: 'eleccion-mano' },
        baseCommon
      );
      expect(eventNoPlus).not.toBeNull();
      expect(eventNoPlus?.properties.game_id).toBe('eleccion-mano');
    });

    it('rejects invalid game_id or non-enum plus_status', () => {
      const badId = buildEvent(
        'game_random_picked',
        { game_id: 'Bad_Game_Id' },
        baseCommon
      );
      expect(badId).toBeNull();

      const badPlus = buildEvent(
        'game_random_picked',
        { game_id: 'eleccion-mano', plus_status: 'gold' as any },
        baseCommon
      );
      expect(badPlus).toBeNull();
    });
  });
});

describe('Screens and context (Task 11.1)', () => {
  const context = {
    screen: 'map',
    world_id: 'world-1',
    stops_done: 7,
    furthest_stop_index: 8,
    funnel_done: true,
    has_account: true,
    plus_status: 'trial',
    session_number: 3,
    seconds_in_session: 41.6,
    platform: 'android',
    runtime: 'dev_build',
  } as const;

  it('lists every Funnel step except map once, plus map and the other screens', () => {
    expect(new Set(SCREENS).size).toBe(SCREENS.length);
    for (const step of FUNNEL_STEPS) expect(SCREENS).toContain(step);
    for (const name of ['splash', 'value_recap', 'settings_dog', 'settings_preferences', 'settings_account', 'library', 'diary', 'lesson', 'games', 'game', 'node_minigame', 'daily_result', 'warmup_stage', 'barkdoku', 'shop', 'auth_login', 'auth_signup', 'register']) {
      expect(SCREENS).toContain(name);
    }
  });

  it('builds screen_viewed with an optional previous screen and item id', () => {
    const first = buildEvent('screen_viewed', { screen: 'welcome' }, baseCommon);
    expect(first?.properties.screen).toBe('welcome');
    expect(first?.properties.previous_screen).toBeUndefined();
    const lesson = buildEvent(
      'screen_viewed',
      { screen: 'lesson', previous_screen: 'map', screen_item_id: 'lesson-leash-basics' },
      baseCommon
    );
    expect(lesson?.properties.screen_item_id).toBe('lesson-leash-basics');
  });

  it('drops screen_viewed with an unknown screen or a name-shaped item id', () => {
    expect(buildEvent('screen_viewed', { screen: 'nope' }, baseCommon)).toBeNull();
    expect(buildEvent('screen_viewed', { screen: 'lesson', screen_item_id: 'Luna' }, baseCommon)).toBeNull();
  });

  it('builds app_backgrounded with screen and seconds_in_session', () => {
    const event = buildEvent('app_backgrounded', { screen: 'lesson', seconds_in_session: 40 }, baseCommon);
    expect(event?.properties.screen).toBe('lesson');
    expect(event?.properties.seconds_in_session).toBe(40);
  });

  it('adds the context properties to every event and keeps schema_version 1', () => {
    const event = buildEvent('lesson_opened', { lesson_id: 'l1', source: 'trail' }, { ...baseCommon, ...context });
    expect(event?.properties).toMatchObject({
      schema_version: 1,
      screen: 'map',
      world_id: 'world-1',
      stops_done: 7,
      furthest_stop_index: 8,
      funnel_done: true,
      has_account: true,
      plus_status: 'trial',
      session_number: 3,
      seconds_in_session: 42,
      platform: 'android',
      runtime: 'dev_build',
    });
  });

  it('omits world_id before the Dog has a World and leaves context out when not given', () => {
    const noWorld = buildEvent('lesson_opened', { lesson_id: 'l1', source: 'trail' }, { ...baseCommon, ...context, world_id: undefined });
    expect(noWorld?.properties).not.toHaveProperty('world_id');
    const bare = buildEvent('lesson_opened', { lesson_id: 'l1', source: 'trail' }, baseCommon);
    expect(bare?.properties).not.toHaveProperty('screen');
  });

  it("the event's own screen wins over the context screen", () => {
    const event = buildEvent('screen_viewed', { screen: 'lesson' }, { ...baseCommon, ...context });
    expect(event?.properties.screen).toBe('lesson');
  });
});

describe('Contract Snapshot (Task 2.3)', () => {
  it('matches the contract snapshot of all event names, property names and kinds', () => {
    const contractSnapshot = Object.entries(EVENTS)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([eventName, propDefs]) => ({
        event: eventName,
        properties: Object.entries(propDefs)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([propName, def]) => ({
            name: propName,
            kind: def.kind.kind === 'enum' ? `enum(${def.kind.values.join('|')})` : def.kind.kind,
            optional: !!def.optional,
          })),
      }));

    expect(contractSnapshot).toMatchSnapshot();
  });
});

describe('Contract-Level Privacy (Task 2.4)', () => {
  function getSampleValidProps(eventName: string): Record<string, unknown> {
    const defs = EVENTS[eventName];
    const props: Record<string, unknown> = {};
    for (const [propName, def] of Object.entries(defs)) {
      if (def.optional) continue;
      switch (def.kind.kind) {
        case 'int':
          props[propName] = 1;
          break;
        case 'bool':
          props[propName] = true;
          break;
        case 'enum':
          props[propName] = def.kind.values[0];
          break;
        case 'id':
          props[propName] = 'valid_id';
          break;
      }
    }
    return props;
  }

  it('no event declares a property kind that accepts free text', () => {
    const allowedKinds = new Set(['int', 'bool', 'enum', 'id']);
    for (const [eventName, propDefs] of Object.entries(EVENTS)) {
      for (const [propName, def] of Object.entries(propDefs)) {
        expect(allowedKinds.has(def.kind.kind)).toBe(true);
      }
    }
  });

  it('drops every declared id property when set to Luna, luna@example.com or a UUID', () => {
    const invalidValues = ['Luna', 'luna@example.com', '123e4567-e89b-12d3-a456-426614174000'];

    for (const [eventName, propDefs] of Object.entries(EVENTS)) {
      for (const [propName, def] of Object.entries(propDefs)) {
        if (def.kind.kind === 'id') {
          for (const badValue of invalidValues) {
            const props = {
              ...getSampleValidProps(eventName),
              [propName]: badValue,
            };
            const event = buildEvent(eventName, props, baseCommon);
            expect(event).toBeNull();
          }
        }
      }
    }
  });
});
