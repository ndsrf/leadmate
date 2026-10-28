import { readFileSync } from 'fs';
import { join } from 'path';

const source = (name: string) => readFileSync(join(__dirname, name), 'utf8');
/** The body of one function component in a source file, up to the next top-level function. */
function component(code: string, name: string): string {
  const start = code.indexOf(`function ${name}(`);
  const next = code.indexOf('\nfunction ', start + 1);
  const nextExport = code.indexOf('\nexport function ', start + 1);
  const ends = [next, nextExport].filter((i) => i > start);
  return code.slice(start, ends.length ? Math.min(...ends) : undefined);
}

describe('Debrief and Mission screens', () => {
  it('shows no Walk Diary answers on the Debrief, only the Mission it is practice for', () => {
    const debrief = component(source('NodeScreens.tsx'), 'DebriefBody');
    expect(debrief.length).toBeGreaterThan(0);
    expect(debrief).not.toContain('WalkDiaryBar');
    expect(debrief).toContain("'debrief.practiseFor'");
  });

  it('asks the three Walk Diary answers on the Mission check-in', () => {
    expect(component(source('MissionScreens.tsx'), 'MissionCheckInScreen')).toContain('<WalkDiaryBar');
  });

  it('offers "Otra cosa" after the fixed problems, and no free-text entry', () => {
    const picker = component(source('MissionScreens.tsx'), 'MissionProblemScreen');
    expect(picker).toContain("'mission.problem.other'");
    expect(picker).not.toMatch(/TextInput/);
  });

  it('shows "Move on anyway" on the Fix page only when allowed', () => {
    expect(component(source('MissionScreens.tsx'), 'FixScreen')).toMatch(/\{canMoveOn && \(/);
  });

  it('uses no animation, so there is nothing to reduce under reduced motion', () => {
    expect(source('MissionScreens.tsx')).not.toMatch(/react-native-reanimated|Animated/);
  });
});
