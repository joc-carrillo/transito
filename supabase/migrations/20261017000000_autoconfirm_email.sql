-- El panel de Supabase sigue con "Confirm email" activo y la API de gestión
-- no tiene permiso para apagarlo. Estas cuentas entran igual: el correo queda
-- confirmado al crearse la fila, antes de que la app inicie sesión.

create or replace function public.confirm_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists users_autoconfirm_email on auth.users;
create trigger users_autoconfirm_email
  before insert on auth.users
  for each row execute function public.confirm_user_email();

create or replace function public.confirm_identity_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.provider = 'email' then
    new.identity_data := jsonb_set(
      coalesce(new.identity_data, '{}'::jsonb),
      '{email_verified}',
      'true'::jsonb,
      true
    );
  end if;
  return new;
end;
$$;

drop trigger if exists identities_autoconfirm_email on auth.identities;
create trigger identities_autoconfirm_email
  before insert on auth.identities
  for each row execute function public.confirm_identity_email();

update auth.users
set email_confirmed_at = now()
where email_confirmed_at is null;

update auth.identities
set identity_data = jsonb_set(
  coalesce(identity_data, '{}'::jsonb),
  '{email_verified}',
  'true'::jsonb,
  true
)
where provider = 'email'
  and coalesce(identity_data ->> 'email_verified', 'false') is distinct from 'true';
