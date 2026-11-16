import { summarizeScentWalk } from './debriefSummary';
import { emptyScentWalkCounts } from './scentWalk';

const sw = (o: object) => ({ scentWalk: { ...emptyScentWalkCounts(), jackpotsSmart: 0, jackpotsWasted: 0, ...o } });

describe('summarizeScentWalk', () => {
  it('is empty outside scent Stages', () => {
    expect(summarizeScentWalk({})).toEqual({ doneWell: [], tryNext: [] });
  });
  it('picks at most two right and one wrong by priority', () => {
    const r = summarizeScentWalk(sw({ sniffsGranted: 5, chains: 1, plantsWaited: 2, foodLeft: 1, empty: 0, sniffsEmpty: 3, foodEaten: 1, plantsDragged: 2 }));
    expect(r).toEqual({ doneWell: ['chain', 'waited-plant'], tryNext: ['food-eaten'] });
  });
  it('is empty when nothing happened', () => {
    expect(summarizeScentWalk(sw({}))).toEqual({ doneWell: [], tryNext: [] });
  });
  it('suggests repeated-move-ignored only when a repeated move was ignored', () => {
    expect(summarizeScentWalk(sw({ repeatedMoves: 2, repeatedMovesIgnored: 0 })).tryNext).toEqual([]);
    expect(summarizeScentWalk(sw({ repeatedMoves: 2, repeatedMovesIgnored: 1 })).tryNext).toEqual(['repeated-move-ignored']);
  });
});
