import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { readShopDirectory } from './parser';
import { parseYaml, type LessonYaml, type MissionYaml, type NodeYaml, type PackYaml, type WorldYaml } from './schema';
import type { ContentPack } from './validator';

/**
 * Loads a ContentPack from a directory on disk (e.g. content/beta or content/stable).
 */
export function loadPackFromDisk(packDir: string): ContentPack {
  const packFile = join(packDir, 'pack.yaml');
  if (!existsSync(packFile)) {
    throw new Error(`pack.yaml not found at ${packFile}`);
  }
  const packYaml = parseYaml<PackYaml>(readFileSync(packFile, 'utf8'));

  const result: ContentPack = {
    rootPath: packDir,
    pack: packYaml,
    worlds: {},
    lessons: {},
    nodes: {},
    missions: {},
  };

  // 1. Worlds
  const worldsDir = join(packDir, 'worlds');
  if (existsSync(worldsDir)) {
    const entries = readdirSync(worldsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
        const id = basename(entry.name, extname(entry.name));
        const config = parseYaml<WorldYaml>(readFileSync(join(worldsDir, entry.name), 'utf8'));
        const text: Record<string, string> = {};

        // Check for text files in worlds/<id>/<lang>.md or worlds/<id>.<lang>.md
        const subDir = join(worldsDir, id);
        if (existsSync(subDir) && readdirSync(subDir).length > 0) {
          for (const f of readdirSync(subDir)) {
            if (f.endsWith('.md')) {
              const lang = basename(f, '.md');
              text[lang] = readFileSync(join(subDir, f), 'utf8');
            }
          }
        } else {
          // Check sibling worlds/<id>.<lang>.md
          for (const f of readdirSync(worldsDir)) {
            if (f.startsWith(`${id}.`) && f.endsWith('.md')) {
              const lang = f.slice(id.length + 1, -3);
              text[lang] = readFileSync(join(worldsDir, f), 'utf8');
            }
          }
        }
        result.worlds[id] = { config, text };
      } else if (entry.isDirectory()) {
        const id = entry.name;
        const subDir = join(worldsDir, id);
        const configFile = existsSync(join(subDir, 'world.yaml'))
          ? join(subDir, 'world.yaml')
          : existsSync(join(subDir, `${id}.yaml`))
            ? join(subDir, `${id}.yaml`)
            : null;
        if (configFile) {
          const config = parseYaml<WorldYaml>(readFileSync(configFile, 'utf8'));
          const text: Record<string, string> = {};
          for (const f of readdirSync(subDir)) {
            if (f.endsWith('.md')) {
              const lang = basename(f, '.md');
              text[lang] = readFileSync(join(subDir, f), 'utf8');
            }
          }
          result.worlds[id] = { config, text };
        }
      }
    }
  }

  // Helper for item directories (lessons, nodes, missions)
  function loadItems<T>(
    dirName: string,
    configFileName: string,
    target: Record<string, { config: T; text?: Record<string, any>; files?: string[] }>,
  ) {
    const parentDir = join(packDir, dirName);
    if (!existsSync(parentDir)) return;
    const entries = readdirSync(parentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const id = entry.name;
      const itemDir = join(parentDir, id);
      const cfgPath = join(itemDir, configFileName);
      if (!existsSync(cfgPath)) continue;

      const config = parseYaml<T>(readFileSync(cfgPath, 'utf8'));
      const text: Record<string, string> = {};
      const files: string[] = [];

      for (const f of readdirSync(itemDir, { withFileTypes: true })) {
        if (f.isFile() && f.name.endsWith('.md')) {
          const lang = basename(f.name, '.md');
          text[lang] = readFileSync(join(itemDir, f.name), 'utf8');
        } else if (f.isDirectory() && f.name === 'media') {
          const mediaDir = join(itemDir, 'media');
          for (const m of readdirSync(mediaDir)) {
            files.push(`media/${m}`);
          }
        }
      }

      target[id] = { config, text, files };
    }
  }

  loadItems<LessonYaml>('lessons', 'lesson.yaml', result.lessons);
  loadItems<NodeYaml>('nodes', 'node.yaml', result.nodes);
  loadItems<MissionYaml>('missions', 'mission.yaml', result.missions);

  const shopDir = join(packDir, 'shop');
  if (existsSync(shopDir)) {
    result.shop = readShopDirectory(shopDir);
  }

  return result;
}
