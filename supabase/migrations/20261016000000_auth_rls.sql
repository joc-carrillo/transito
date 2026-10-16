-- Solo usuarios autenticados pueden leer y escribir.

drop policy if exists "anon_all_owners" on public.owners;
drop policy if exists "anon_all_vehicles" on public.vehicles;
drop policy if exists "anon_all_access_logs" on public.access_logs;

create policy "auth_all_owners" on public.owners
  for all to authenticated using (true) with check (true);
create policy "auth_all_vehicles" on public.vehicles
  for all to authenticated using (true) with check (true);
create policy "auth_all_access_logs" on public.access_logs
  for all to authenticated using (true) with check (true);

revoke select on public.vehicle_status from anon;
grant select on public.vehicle_status to authenticated;

-- Storage: lectura pública (las fotos se muestran por URL), escritura solo autenticados.
drop policy if exists "anon_upload_owner_photos" on storage.objects;
drop policy if exists "anon_update_owner_photos" on storage.objects;

create policy "auth_upload_owner_photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'owner-photos');
create policy "auth_update_owner_photos" on storage.objects
  for update to authenticated using (bucket_id = 'owner-photos');
create policy "auth_delete_owner_photos" on storage.objects
  for delete to authenticated using (bucket_id = 'owner-photos');
