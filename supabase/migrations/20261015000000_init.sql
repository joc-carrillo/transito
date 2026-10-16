-- Sistema de Control de Tránsito y Acceso Vehicular

create extension if not exists "pgcrypto";

-- Enums
create type public.owner_type as enum ('servidor', 'pareja_tios');
create type public.access_action as enum ('entry', 'exit');

-- Owners
create table public.owners (
  id uuid primary key default gen_random_uuid(),
  type public.owner_type not null default 'servidor',
  primary_name text not null check (char_length(trim(primary_name)) > 0),
  secondary_name text,
  photo_url text,
  created_at timestamptz not null default now()
);

-- Vehicles
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners (id) on delete cascade,
  plate text not null unique check (char_length(trim(plate)) > 0),
  model_color text not null default '',
  qr_code_hash text not null unique,
  created_at timestamptz not null default now()
);

create index vehicles_owner_id_idx on public.vehicles (owner_id);

-- Access logs
create table public.access_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  action public.access_action not null,
  "timestamp" timestamptz not null default now()
);

create index access_logs_vehicle_ts_idx on public.access_logs (vehicle_id, "timestamp" desc);
create index access_logs_ts_idx on public.access_logs ("timestamp" desc);

-- Estado actual de cada vehículo (último movimiento)
create view public.vehicle_status
with (security_invoker = true) as
select
  v.id as vehicle_id,
  v.plate,
  v.model_color,
  v.qr_code_hash,
  o.id as owner_id,
  o.type as owner_type,
  o.primary_name,
  o.secondary_name,
  o.photo_url,
  l.action as last_action,
  l."timestamp" as last_timestamp,
  coalesce(l.action = 'entry', false) as is_inside
from public.vehicles v
join public.owners o on o.id = v.owner_id
left join lateral (
  select al.action, al."timestamp"
  from public.access_logs al
  where al.vehicle_id = v.id
  order by al."timestamp" desc
  limit 1
) l on true;

-- RLS: acceso abierto para anon (temporal, sin autenticación por ahora)
alter table public.owners enable row level security;
alter table public.vehicles enable row level security;
alter table public.access_logs enable row level security;

create policy "anon_all_owners" on public.owners
  for all to anon, authenticated using (true) with check (true);
create policy "anon_all_vehicles" on public.vehicles
  for all to anon, authenticated using (true) with check (true);
create policy "anon_all_access_logs" on public.access_logs
  for all to anon, authenticated using (true) with check (true);

grant select on public.vehicle_status to anon, authenticated;

-- Realtime para refrescar el dashboard
alter publication supabase_realtime add table public.access_logs;

-- Storage: fotos de conductores
insert into storage.buckets (id, name, public)
values ('owner-photos', 'owner-photos', true)
on conflict (id) do nothing;

create policy "anon_read_owner_photos" on storage.objects
  for select to anon, authenticated using (bucket_id = 'owner-photos');
create policy "anon_upload_owner_photos" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'owner-photos');
create policy "anon_update_owner_photos" on storage.objects
  for update to anon, authenticated using (bucket_id = 'owner-photos');
