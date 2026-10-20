-- Run with `supabase test db` (needs Docker). One user cannot read or write another user's rows.
begin;
select plan(8);

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@example.com'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@example.com');

insert into public.dogs (user_id, dog_id, record, updated_at) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000d0a1', '{"version":3}', now()),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-00000000d0b2', '{"version":3}', now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

select is((select count(*)::int from public.dogs), 1, 'a user sees only their own Dog');
select is((select count(*)::int from public.dogs where user_id = '00000000-0000-0000-0000-0000000000b2'), 0, 'another user''s Dog returns no rows');

update public.dogs set record = '{"version":99}' where user_id = '00000000-0000-0000-0000-0000000000b2';
delete from public.dogs where user_id = '00000000-0000-0000-0000-0000000000b2';
select throws_ok(
  $$insert into public.dogs (user_id, record, updated_at) values ('00000000-0000-0000-0000-0000000000b2', '{}', now())$$,
  '42501', null, 'a user cannot insert a Dog for someone else');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
select is((select record ->> 'version' from public.dogs), '3', 'the other user''s Dog was not changed');
select is((select count(*)::int from public.dogs), 1, 'the other user''s Dog was not deleted');

select throws_ok($$insert into public.level_configs (id, version, config) values ('x', 1, '{}')$$, '42501', null, 'no client can write level configs');
reset role;
insert into public.level_configs (id, version, config, published) values ('hall', 1, '{}', true), ('hall', 2, '{}', false);
set local role anon;
select is((select count(*)::int from public.level_configs), 1, 'everyone reads published level configs only');
select is((select count(*)::int from public.dogs), 0, 'anonymous users see no Dogs');

select * from finish();
rollback;
