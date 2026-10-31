-- Public bucket for Lesson Animations (ADR 0016): animations/<key>.mp4 and its timeline animations/<key>.json.
-- Anyone can read through the public URL; uploads are done by hand from the dashboard or with the service role,
-- so no insert/update policies are granted. Clips are at most 5 MB (lesson-animations spec).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lesson-media', 'lesson-media', true, 5242880, array['video/mp4', 'application/json'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
