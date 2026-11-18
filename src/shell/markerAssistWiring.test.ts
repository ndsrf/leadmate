import { newDogRecord } from './dogRecord';
import { recordMarkerAssist, telegraphStartFields } from './markerAssistWiring';

const state = { level: 'late' as const, successRun: 1, failRun: 0 };
const record = () => newDogRecord();

describe('telegraph start fields', () => {
  it('sends the stored assist, the setting and whether this is the guided first Stage', () => {
    const r = { ...record(), markerAssist: state };
    expect(telegraphStartFields(r, { alwaysTimingHelp: true }, 'first-stage')).toEqual({ markerAssist: state, alwaysTimingHelp: true, guidedFirstStage: true });
    expect(telegraphStartFields(r, { alwaysTimingHelp: false }, 'daily').guidedFirstStage).toBe(false);
  });

  it('reads a record without the field as Full', () => {
    const r = { ...record() };
    delete r.markerAssist;
    expect(telegraphStartFields(r, { alwaysTimingHelp: false }, 'node').markerAssist).toEqual({ level: 'full', successRun: 0, failRun: 0 });
  });
});

describe('recording the Timing assist', () => {
  it('writes it in a recorded Stage and in the Daily Stage', () => {
    expect(recordMarkerAssist(record(), state, 'node').markerAssist).toEqual(state);
    expect(recordMarkerAssist(record(), state, 'daily').markerAssist).toEqual(state);
    expect(recordMarkerAssist(record(), state, 'first-stage').markerAssist).toEqual(state);
  });

  it('leaves the record untouched in the Taste Stage', () => {
    const r = record();
    expect(recordMarkerAssist(r, state, 'taste')).toBe(r);
  });
});
