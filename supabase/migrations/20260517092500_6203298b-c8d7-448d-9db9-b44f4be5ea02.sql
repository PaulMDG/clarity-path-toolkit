
-- Storage buckets for images (featured images, inline editor uploads) and downloadable resources
insert into storage.buckets (id, name, public)
values ('images', 'images', true), ('resources', 'resources', true)
on conflict (id) do nothing;

-- Public can read both buckets
create policy "Public read images"
on storage.objects for select
using (bucket_id = 'images');

create policy "Public read resources"
on storage.objects for select
using (bucket_id = 'resources');

-- Admins can upload/update/delete in both buckets
create policy "Admin write images"
on storage.objects for insert
with check (bucket_id = 'images' and public.is_admin());

create policy "Admin update images"
on storage.objects for update
using (bucket_id = 'images' and public.is_admin());

create policy "Admin delete images"
on storage.objects for delete
using (bucket_id = 'images' and public.is_admin());

create policy "Admin write resources"
on storage.objects for insert
with check (bucket_id = 'resources' and public.is_admin());

create policy "Admin update resources"
on storage.objects for update
using (bucket_id = 'resources' and public.is_admin());

create policy "Admin delete resources"
on storage.objects for delete
using (bucket_id = 'resources' and public.is_admin());

-- Ensure a profile row is created for every new auth user (function already exists)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at helper + triggers for tables that have updated_at
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

do $$ declare t text;
begin
  for t in select unnest(array['services','blog_posts','pages','resources','site_settings','faqs']) loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.tg_set_updated_at()', t);
  end loop;
end $$;
