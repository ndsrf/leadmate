-- One Dog per account in the UI, keyed by (user_id, dog_id). The record is the app's versioned DogRecord as jsonb;
-- last-write-wins is decided by the app using updated_at (ADR 0006).
create table public.dogs (
  user_id uuid not null references auth.users (id) on delete cascade,
  dog_id uuid not null default gen_random_uuid(),
  record jsonb not null,
  updated_at timestamptz not null,
  primary key (user_id, dog_id)
);

alter table public.dogs enable row level security;

create policy "dogs_select_own" on public.dogs for select to authenticated using (user_id = auth.uid());
create policy "dogs_insert_own" on public.dogs for insert to authenticated with check (user_id = auth.uid());
create policy "dogs_update_own" on public.dogs for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "dogs_delete_own" on public.dogs for delete to authenticated using (user_id = auth.uid());

-- Remote level configs: readable by everyone, writable by no client (published from the dashboard or a service role).
create table public.level_configs (
  id text not null,
  version integer not null,
  config jsonb not null,
  published boolean not null default false,
  primary key (id, version)
);

alter table public.level_configs enable row level security;

create policy "level_configs_read_published" on public.level_configs for select to anon, authenticated using (published);
