
-- Restrict bucket listing to admins (direct CDN URLs still work for public reads)
drop policy if exists "Public read images" on storage.objects;
drop policy if exists "Public read resources" on storage.objects;

create policy "Admin list images" on storage.objects for select
using (bucket_id = 'images' and public.is_admin());
create policy "Admin list resources" on storage.objects for select
using (bucket_id = 'resources' and public.is_admin());

-- Lock SECURITY DEFINER helpers down: revoke from anon, keep for authenticated (RLS needs it)
revoke execute on function public.is_admin() from anon;
revoke execute on function public.has_role(uuid, app_role) from anon;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.tg_set_updated_at() from anon, authenticated;
