create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_name text;
begin
  resolved_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(resolved_name, split_part(coalesce(new.email, 'Novo usuário'), '@', 1)),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function private.handle_new_auth_user();

create or replace function public.bootstrap_clinic(
  p_trade_name text,
  p_legal_name text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  clinic_name text := nullif(btrim(p_trade_name), '');
  created_clinic_id bigint;
begin
  if actor_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if clinic_name is null or char_length(clinic_name) < 2 or char_length(clinic_name) > 120 then
    raise exception 'invalid_clinic_name' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.clinic_memberships membership
    where membership.profile_id = actor_id
      and membership.status = 'active'
      and membership.deleted_at is null
  ) then
    raise exception 'active_membership_already_exists' using errcode = '23505';
  end if;

  insert into public.profiles (id, full_name, email)
  select auth_user.id,
    coalesce(nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(auth_user.email, 'Novo usuário'), '@', 1)),
    auth_user.email
  from auth.users auth_user where auth_user.id = actor_id
  on conflict (id) do nothing;

  insert into public.clinics (trade_name, legal_name)
  values (clinic_name, nullif(btrim(p_legal_name), ''))
  returning id into created_clinic_id;

  insert into public.clinic_memberships (clinic_id, profile_id, role, status, invited_at, accepted_at)
  values (created_clinic_id, actor_id, 'owner', 'active', now(), now());

  insert into public.chairs (clinic_id, name) values (created_clinic_id, 'Consultório 1');
  insert into public.dental_plans (clinic_id, name, is_private_pay) values (created_clinic_id, 'Particular', true);

  return created_clinic_id;
end;
$$;

revoke all on function public.bootstrap_clinic(text, text) from public, anon;
grant execute on function public.bootstrap_clinic(text, text) to authenticated;
