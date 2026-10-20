import type { SupabaseClient } from '@supabase/supabase-js';
import { defaultScenario, type ScenarioConfig } from '../../sim/config';
import { validateScenario } from '../../sim/scenery';
import type { KeyValueStore } from '../dogRecord';

export const CONFIGS_KEY = 'leadmate.configs';

/** A published level config: overrides on the default scenario, for the Node or Stage with this id. */
export interface RemoteConfig {
  id: string;
  version: number;
  config: Partial<ScenarioConfig>;
}

/** The configs the device last fetched and found valid, by id. */
export type ConfigCache = Record<string, RemoteConfig>;

export interface ConfigSource {
  fetchLevelConfigs(): Promise<{ id: string; version: number; config: unknown; published: boolean }[]>;
}

/** A config is valid when it passes the same scenario validation as the bundled ones. Anything odd counts as invalid. */
export function isValidConfig(config: unknown): config is Partial<ScenarioConfig> {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return false;
  try {
    return validateScenario({ ...defaultScenario, ...(config as Partial<ScenarioConfig>) }).length === 0;
  } catch {
    return false;
  }
}

function readCache(raw: unknown): ConfigCache {
  const cache: ConfigCache = {};
  if (!raw || typeof raw !== 'object') return cache;
  for (const [id, entry] of Object.entries(raw)) {
    const e = entry as Partial<RemoteConfig> | null;
    if (e && typeof e.version === 'number' && isValidConfig(e.config)) cache[id] = { id, version: e.version, config: e.config };
  }
  return cache;
}

export async function loadConfigCache(store: KeyValueStore): Promise<ConfigCache> {
  try {
    const raw = await store.getItem(CONFIGS_KEY);
    return raw ? readCache(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

/**
 * Fetches the published configs, keeps the newest valid one per id and caches them. Unreachable or invalid input never
 * shows an error: the previous cache (or nothing) stays, and Stages fall back to the bundled configs.
 */
export async function fetchLevelConfigs(source: ConfigSource | null, store: KeyValueStore): Promise<ConfigCache> {
  const previous = await loadConfigCache(store);
  if (!source) return previous;
  try {
    const rows = await source.fetchLevelConfigs();
    const cache: ConfigCache = {};
    for (const row of rows) {
      if (!row.published || typeof row.id !== 'string' || typeof row.version !== 'number' || !isValidConfig(row.config)) continue;
      if (!cache[row.id] || cache[row.id].version < row.version) cache[row.id] = { id: row.id, version: row.version, config: row.config };
    }
    await store.setItem(CONFIGS_KEY, JSON.stringify(cache));
    return cache;
  } catch {
    return previous;
  }
}

export interface ResolvedScenario {
  scenario: Partial<ScenarioConfig>;
  configVersion: string;
}

/** The scenario for a Node's Stage: the cached remote config when there is a valid one, else the bundled one. */
export function resolveScenario(id: string, bundled: Partial<ScenarioConfig>, cache: ConfigCache): ResolvedScenario {
  const remote = cache[id];
  if (remote && isValidConfig(remote.config)) return { scenario: { ...remote.config, configVersion: String(remote.version) }, configVersion: String(remote.version) };
  return { scenario: { ...bundled, configVersion: 'bundled' }, configVersion: 'bundled' };
}

export function supabaseConfigs(client: SupabaseClient): ConfigSource {
  return {
    async fetchLevelConfigs() {
      const { data, error } = await client.from('level_configs').select('id, version, config, published').eq('published', true);
      if (error) throw error;
      return data ?? [];
    },
  };
}
