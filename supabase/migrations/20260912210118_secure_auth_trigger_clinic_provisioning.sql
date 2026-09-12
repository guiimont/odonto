drop function if exists public.bootstrap_clinic(text, text);

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_name text;
  requested_clinic_name text;
  created_clinic_id bigint;
begin
  resolved_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  requested_clinic_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'clinic_name', '')), '');

  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(resolved_name, split_part(coalesce(new.email, 'Novo usuário'), '@', 1)), new.email)
  on conflict (id) do update
    set full_name = coalesce(resolved_name, public.profiles.full_name),
        email = excluded.email,
        updated_at = now();

  if requested_clinic_name is not null
     and char_length(requested_clinic_name) between 2 and 120
     and not exists (
       select 1 from public.clinic_memberships membership
       where membership.profile_id = new.id
         and membership.status = 'active'
         and membership.deleted_at is null
     )
  then
    insert into public.clinics (trade_name) values (requested_clinic_name) returning id into created_clinic_id;
    insert into public.clinic_memberships (clinic_id, profile_id, role, status, invited_at, accepted_at)
    values (created_clinic_id, new.id, 'owner', 'active', now(), now());
    insert into public.chairs (clinic_id, name) values (created_clinic_id, 'Consultório 1');
    insert into public.dental_plans (clinic_id, name, is_private_pay) values (created_clinic_id, 'Particular', true);
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
