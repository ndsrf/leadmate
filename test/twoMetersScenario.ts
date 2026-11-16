import { defaultScenario, type ScenarioConfig } from '../src/sim/config';

/**
 * A test scenario with two Stage Meters (Nose and Connection) for evidence of Task 3.3.
 * Not in content/ (retains clean published content).
 */
export const twoMetersScenario: ScenarioConfig = {
  ...defaultScenario,
  meters: [
    {
      id: 'nose',
      labelKey: 'hud.sniff',
      icon: 'meter_nose',
      target: 30,
      meterPoints: {
        'go-sniff': 15,
      },
    },
    {
      id: 'connection',
      labelKey: 'hud.cue',
      icon: 'meter_connection',
      target: 20,
      meterPoints: {
        'check-in-hit': 10,
        'followed-turn': 5,
        'marker-hit': 10,
      },
    },
  ],
};
