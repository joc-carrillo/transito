-- Quién marcó cada entrada o salida

alter table public.access_logs
  add column registered_by uuid references public.profiles (id) on delete set null;

create index access_logs_registered_by_idx on public.access_logs (registered_by);

-- Siempre es el usuario de la sesión; el cliente no puede suplantar a otro.
create or replace function public.set_registered_by()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.registered_by := auth.uid();
  return new;
end;
$$;

create trigger access_logs_set_registered_by
  before insert on public.access_logs
  for each row execute function public.set_registered_by();

-- Directorio del personal: solo nombre y foto (sin cédula ni teléfono).
-- Corre con los permisos del dueño para poder leer perfiles ajenos.
create view public.staff as
select p.id, p.first_name, p.last_name, p.photo_url
from public.profiles p;

revoke all on public.staff from anon, public;
grant select on public.staff to authenticated;

-- Estado de vehículos + quién marcó el último movimiento
create or replace view public.vehicle_status
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
  coalesce(l.action = 'entry', false) as is_inside,
  l.registered_by as last_registered_by,
  nullif(trim(coalesce(s.first_name, '') || ' ' || coalesce(s.last_name, '')), '') as last_registered_by_name
from public.vehicles v
join public.owners o on o.id = v.owner_id
left join lateral (
  select al.action, al."timestamp", al.registered_by
  from public.access_logs al
  where al.vehicle_id = v.id
  order by al."timestamp" desc
  limit 1
) l on true
left join public.staff s on s.id = l.registered_by;

notify pgrst, 'reload schema';
