import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'yaml';
import { en, es } from './index';

/** Every `labelKey` of a Stage Meter declared by a Node scenario in content/ must exist in both catalogs. */
describe('Stage Meter label keys', () => {
  const root = path.join(__dirname, '..', '..', 'content');
  const used: [string, string][] = [];
  for (const channel of ['beta', 'stable']) {
    const nodes = path.join(root, channel, 'nodes');
    for (const id of fs.readdirSync(nodes)) {
      const file = path.join(nodes, id, 'node.yaml');
      if (!fs.existsSync(file)) continue;
      const meters = parse(fs.readFileSync(file, 'utf8'))?.simulation?.scenario?.meters;
      for (const m of Array.isArray(meters) ? meters : []) used.push([`${channel}/${id}`, m.labelKey]);
    }
  }

  it('finds the World 6 meters', () => {
    expect(used.length).toBeGreaterThan(0);
  });

  it.each(used)('%s: %s is in the Spanish and English catalogs', (_node, key) => {
    expect((es as Record<string, string>)[key]).toBeTruthy();
    expect((en as Record<string, string>)[key]).toBeTruthy();
  });
});
