-- Public bucket for Content Packs:
-- <channel>/latest.json, <channel>/packs/<version>/manifest.json, <channel>/files/<sha256>.<ext>
-- Public read access; uploads restricted to service-role key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content',
  'content',
  true,
  10485760, -- 10 MB per file limit
  array['application/json', 'text/yaml', 'application/x-yaml', 'text/plain', 'text/markdown', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
