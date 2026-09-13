create table private.clinic_invitations (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null references public.clinics(id) on delete restrict,
  email citext not null,
  role public.clinic_role not null default 'auditor',
  token uuid not null default gen_random_uuid() unique,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_by uuid references public.profiles(id) on delete restrict,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint clinic_invitations_role_chk check (role <> 'owner'),
  constraint clinic_invitations_acceptance_chk check (
    (accepted_at is null and accepted_by is null)
    or (accepted_at is not null and accepted_by is not null)
  )
);

create unique index clinic_invitations_pending_email_idx
  on private.clinic_invitations (clinic_id, lower(email::text))
  where accepted_at is null and revoked_at is null and deleted_at is null;

create index clinic_invitations_token_idx
  on private.clinic_invitations (token)
  where accepted_at is null and revoked_at is null and deleted_at is null;

revoke all on table private.clinic_invitations from public, anon, authenticated;

create trigger clinic_invitations_set_updated_at
before update on private.clinic_invitations
for each row execute function private.set_updated_at();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_name text;
  requested_clinic_name text;
  requested_invite_token uuid;
  invitation private.clinic_invitations%rowtype;
  created_clinic_id bigint;
begin
  resolved_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  requested_clinic_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'clinic_name', '')), '');

  begin
    requested_invite_token := nullif(new.raw_user_meta_data ->> 'invite_token', '')::uuid;
  exception when invalid_text_representation then
    requested_invite_token := null;
  end;

  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(resolved_name, split_part(coalesce(new.email, 'Novo usuário'), '@', 1)), new.email)
  on conflict (id) do update
    set full_name = coalesce(resolved_name, public.profiles.full_name),
        email = excluded.email,
        updated_at = now();

  if new.email_confirmed_at is not null
     and not exists (
       select 1 from public.clinic_memberships membership
       where membership.profile_id = new.id
         and membership.status = 'active'
         and membership.deleted_at is null
     )
  then
    if requested_invite_token is not null then
      select *
        into invitation
      from private.clinic_invitations candidate
      where candidate.token = requested_invite_token
        and lower(candidate.email::text) = lower(coalesce(new.email, ''))
        and candidate.expires_at > now()
        and candidate.accepted_at is null
        and candidate.revoked_at is null
        and candidate.deleted_at is null
      for update;
    end if;

    if invitation.id is not null then
      insert into public.clinic_memberships (clinic_id, profile_id, role, status, invited_at, accepted_at)
      values (invitation.clinic_id, new.id, invitation.role, 'active', invitation.created_at, now())
      on conflict (clinic_id, profile_id) do update
        set role = excluded.role,
            status = 'active',
            accepted_at = now(),
            deleted_at = null,
            updated_at = now();

      update private.clinic_invitations
      set accepted_by = new.id,
          accepted_at = now()
      where id = invitation.id;
    elsif requested_clinic_name is not null
       and char_length(requested_clinic_name) between 2 and 120
    then
      insert into public.clinics (trade_name)
      values (requested_clinic_name)
      returning id into created_clinic_id;

      insert into public.clinic_memberships (clinic_id, profile_id, role, status, invited_at, accepted_at)
      values (created_clinic_id, new.id, 'owner', 'active', now(), now());

      insert into public.chairs (clinic_id, name)
      values (created_clinic_id, 'Consultório 1');

      insert into public.dental_plans (clinic_id, name, is_private_pay)
      values (created_clinic_id, 'Particular', true);
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
