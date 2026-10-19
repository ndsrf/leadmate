import { defaultScenario, type ScenarioConfig } from './config';
import { buildPayload, type SimulationDebriefPayload } from './payload';
import { createState, tick, type SimEvent, type SimInput, type SimState } from './sim';

export interface ScriptedStage {
  state: SimState;
  events: SimEvent[];
  payload: SimulationDebriefPayload;
}

/**
 * Runs a Stage without any rendering: `inputs(state)` is asked for the input of every tick
 * until the Stage ends (or `maxSeconds` passes). Same seed and inputs give the same result.
 */
export function runScripted(
  seed: number,
  inputs: (state: SimState) => SimInput,
  config: ScenarioConfig = defaultScenario,
  maxSeconds = 600,
): ScriptedStage {
  const state = createState(seed, config);
  const events: SimEvent[] = [];
  const maxTicks = Math.round(maxSeconds / config.fixedStep);
  for (let i = 0; i < maxTicks && !state.ended; i++) {
    events.push(...tick(state, inputs(state)));
  }
  return { state, events, payload: buildPayload(state) };
}
