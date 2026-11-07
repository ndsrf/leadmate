import { HOME_CONCERNS } from './concerns';
import { HOME_BEHAVIOUR_CONTENT, hasDedicatedLesson } from './homeBehaviours';
import { createTranslator, es, type TextKey } from '../i18n';
import { AGE_KEYS, CONCERN_KEYS, payoffKeys, planReasonKey, SEX_KEYS, stretchTitleKey, whoKey } from './concernText';
import { CONCERN_STRETCHES } from './onboarding/plan';
import { AGE_BANDS, CONCERNS, PLAN_BECAUSE, SEXES } from './concerns';

describe('concern text', () => {
  it('has text for every Concern, age band, sex, plan reason and Payoff line', () => {
    const t = createTranslator({});
    const keys: TextKey[] = [
      ...CONCERNS.map((c) => CONCERN_KEYS[c]),
      ...AGE_BANDS.map((a) => AGE_KEYS[a]),
      ...SEXES.map((s) => SEX_KEYS[s]),
      ...CONCERNS.map((c) => planReasonKey({ stretchId: 'x', concern: c })),
      ...PLAN_BECAUSE.map((because) => planReasonKey({ stretchId: 'x', because })),
      planReasonKey({ stretchId: 'x' }),
      ...CONCERNS.flatMap((c) => Object.values(payoffKeys([c]))),
      whoKey('male'), whoKey('female'), whoKey(null),
    ];
    for (const key of keys) expect(t(key)).not.toBe('');
  });

  it('names the Dog in every plan reason that has a Concern', () => {
    for (const c of CONCERNS) expect(es[planReasonKey({ stretchId: 'x', concern: c })]).toContain('{name}');
  });

  it('tells a Home Behaviour its Concerns will be tuned in the plan, and others the usual body', () => {
    expect(payoffKeys(['bite-owner']).body).toBe('payoff.body.home');
    expect(payoffKeys([]).body).toBe('payoff.body');
    expect(payoffKeys(['react-bicycle']).body).toBe('payoff.body');
    expect(payoffKeys(['react-bicycle']).reacted).toBe('payoff.reacted.bicycle');
    expect(payoffKeys(['bite-owner']).reacted).toBe('payoff.reacted');
    expect(payoffKeys(['bite-owner', 'react-bicycle'])).toEqual({ reacted: 'payoff.reacted.bicycle', body: 'payoff.body' });
  });

  it('uses "tu perro" when sex is unset', () => {
    expect(es[whoKey(null)]).toBe('tu perro');
  });
});

describe('Stretch titles', () => {
  it('names every Stretch a Concern points to', () => {
    const t = createTranslator({});
    // a Home Stretch whose Lesson has not shipped yet (KNOWN_GAPS) has no title to show
    const shipped = (id: string) => !HOME_CONCERNS.some((c) => HOME_BEHAVIOUR_CONTENT[c].lesson === id && !hasDedicatedLesson(c));
    for (const id of new Set(Object.values(CONCERN_STRETCHES).flat().filter(shipped))) {
      const key = stretchTitleKey(id);
      expect(key).toBeDefined();
      expect(t(key!)).not.toBe('');
    }
    expect(stretchTitleKey('nope')).toBeUndefined();
  });
});
