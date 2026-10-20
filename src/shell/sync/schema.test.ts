import { readFileSync } from 'fs';
import { join } from 'path';

const sql = readFileSync(join(__dirname, '..', '..', '..', 'supabase', 'migrations', '20261020000000_dogs_and_level_configs.sql'), 'utf8');

/** A static check of the migration; the behavioral policy test is `supabase/tests/rls.test.sql` (`supabase test db`). */
describe('Supabase schema', () => {
  it('turns on row-level security for both tables', () => {
    expect(sql).toMatch(/alter table public\.dogs enable row level security/);
    expect(sql).toMatch(/alter table public\.level_configs enable row level security/);
  });

  it.each(['select', 'insert', 'update', 'delete'])('limits %s on dogs to the owner', (op) => {
    const policy = sql.split('\n\n').find((block) => new RegExp(`create policy "dogs_${op}_own"`).test(block));
    expect(policy).toBeDefined();
    expect(policy).toMatch(/user_id = auth\.uid\(\)/);
    expect(policy).not.toMatch(/to anon/);
  });

  it('keys dogs by user and dog and removes them with the account', () => {
    expect(sql).toMatch(/primary key \(user_id, dog_id\)/);
    expect(sql).toMatch(/references auth\.users \(id\) on delete cascade/);
  });

  it('lets clients read published level configs and never write them', () => {
    expect(sql).toMatch(/level_configs_read_published[\s\S]*for select/);
    expect(sql).not.toMatch(/on public\.level_configs for (insert|update|delete|all)/);
  });
});
