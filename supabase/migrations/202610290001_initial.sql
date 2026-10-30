-- Aplicar a un proyecto nuevo. Ninguna cuenta obtiene permisos por registrarse.
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null default '' check (length(description) <= 10000),
  tags text[] not null default '{}' check (cardinality(tags) <= 12),
  video_path text not null,
  poster_path text not null,
  duration double precision check (duration >= 0 and duration < 'Infinity'::float8),
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'draft') or published_at is not null)
);
create index videos_publication on public.videos(status, published_at desc, id);
create table public.video_links (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  label text not null check (length(trim(label)) between 1 and 100),
  url text not null check (url ~ '^https?://[^[:space:]]+$' and length(url) <= 2048)
);
create index video_links_parent on public.video_links(video_id);

alter table public.videos enable row level security;
alter table public.video_links enable row level security;
create policy "Read published or own admin content" on public.videos for select to anon, authenticated
using (status = 'published' or (select public.is_admin()));
create policy "Admin inserts drafts" on public.videos for insert to authenticated
with check ((select public.is_admin()) and status = 'draft');
create policy "Admin edits metadata" on public.videos for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Read links of visible videos" on public.video_links for select to anon, authenticated
using (exists(select 1 from public.videos v where v.id = video_id));
create policy "Admin manages links" on public.video_links for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
revoke all on public.videos, public.video_links from anon, authenticated;
grant select on public.videos, public.video_links to anon, authenticated;
grant insert, update on public.videos to authenticated;
grant insert, update, delete on public.video_links to authenticated;
revoke delete on public.videos from anon, authenticated;

create or replace function public.guard_video_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.role() is distinct from 'service_role' then
    if TG_OP = 'UPDATE' and (new.status is distinct from old.status or new.published_at is distinct from old.published_at) then
      raise exception 'Use manage-video to publish or withdraw a video';
    end if;
    if TG_OP = 'UPDATE' and old.status = 'published' and (new.video_path <> old.video_path or new.poster_path <> old.poster_path) then
      raise exception 'Withdraw the publication before changing files';
    end if;
    if split_part(new.video_path, '/', 1) <> auth.uid()::text or split_part(new.poster_path, '/', 1) <> auth.uid()::text
       or split_part(new.video_path, '/', 2) <> new.id::text or split_part(new.poster_path, '/', 2) <> new.id::text then
      raise exception 'Invalid storage paths';
    end if;
  end if;
  if exists(select 1 from unnest(new.tags) t where length(t) not between 1 and 40) then raise exception 'Invalid tags'; end if;
  new.updated_at = clock_timestamp();
  return new;
end;
$$;
create trigger guard_video before insert or update on public.videos for each row execute function public.guard_video_update();

create or replace function public.save_video(p_id uuid, p_data jsonb, p_links jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if jsonb_typeof(p_links) <> 'array' or jsonb_array_length(p_links) > 20 then raise exception 'Invalid links'; end if;
  insert into public.videos(id, title, description, tags, video_path, poster_path, duration)
  values (p_id, p_data->>'title', coalesce(p_data->>'description', ''),
    array(select jsonb_array_elements_text(p_data->'tags')),
    p_data->>'video_path', p_data->>'poster_path', (p_data->>'duration')::double precision)
  on conflict(id) do update set title = excluded.title, description = excluded.description,
    tags = excluded.tags, video_path = excluded.video_path, poster_path = excluded.poster_path, duration = excluded.duration;
  delete from public.video_links where video_id = p_id;
  insert into public.video_links(video_id, label, url)
  select p_id, item->>'label', item->>'url' from jsonb_array_elements(p_links) item;
end;
$$;
revoke all on function public.save_video(uuid,jsonb,jsonb) from public;
grant execute on function public.save_video(uuid,jsonb,jsonb) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types) values
('drafts','drafts',false,41943040,array['video/webm','image/jpeg','image/png','image/webp']),
('published','published',true,41943040,array['video/webm','image/jpeg','image/png','image/webp']);
create policy "Admin reads drafts" on storage.objects for select to authenticated
using (bucket_id = 'drafts' and (select public.is_admin()) and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Admin uploads drafts" on storage.objects for insert to authenticated
with check (bucket_id = 'drafts' and (select public.is_admin()) and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Admin deletes drafts" on storage.objects for delete to authenticated
using (bucket_id = 'drafts' and (select public.is_admin()) and (storage.foldername(name))[1] = (select auth.uid())::text);
-- El bucket público solo lo escribe la Edge Function. No hay políticas de carga pública.
