create extension if not exists btree_gist with schema extensions;

alter table public.appointments
  add column cancelled_at timestamptz,
  add column cancelled_by uuid references public.profiles(id) on delete restrict,
  add column cancellation_reason text,
  add column status_changed_at timestamptz not null default now(),
  add column status_changed_by uuid references public.profiles(id) on delete restrict;

alter table public.appointments
  add constraint appointments_cancellation_state_chk check (
    (status = 'cancelled' and cancelled_at is not null)
    or
    (status <> 'cancelled' and cancelled_at is null and cancelled_by is null)
  );

alter table public.appointments
  add constraint appointments_professional_no_overlap
  exclude using gist (
    clinic_id with =,
    professional_profile_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (deleted_at is null and status not in ('cancelled', 'no_show'));

alter table public.appointments
  add constraint appointments_chair_no_overlap
  exclude using gist (
    clinic_id with =,
    chair_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (deleted_at is null and chair_id is not null and status not in ('cancelled', 'no_show'));

create or replace function private.enforce_appointment_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  transition_allowed boolean;
begin
  if tg_op = 'INSERT' then
    new.status_changed_at := coalesce(new.status_changed_at, now());
    new.status_changed_by := coalesce(new.status_changed_by, auth.uid());
  elsif new.status is distinct from old.status then
    transition_allowed := case old.status
      when 'scheduled' then new.status in ('confirmed', 'waiting_room', 'in_service', 'completed', 'no_show', 'cancelled')
      when 'confirmed' then new.status in ('waiting_room', 'in_service', 'completed', 'no_show', 'cancelled')
      when 'waiting_room' then new.status in ('in_service', 'completed', 'no_show', 'cancelled')
      when 'in_service' then new.status in ('completed', 'cancelled')
      when 'completed' then false
      when 'no_show' then false
      when 'cancelled' then false
      else false
    end;

    if not transition_allowed then
      raise exception 'invalid_appointment_status_transition: % -> %', old.status, new.status
        using errcode = '22023';
    end if;

    new.status_changed_at := now();
    new.status_changed_by := auth.uid();
  end if;

  if new.status = 'cancelled' then
    new.cancelled_at := coalesce(new.cancelled_at, now());
    new.cancelled_by := coalesce(new.cancelled_by, auth.uid());
  elsif tg_op = 'INSERT' or new.status is distinct from old.status then
    new.cancelled_at := null;
    new.cancelled_by := null;
    new.cancellation_reason := null;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_appointment_rules() from public, anon, authenticated;

create trigger appointments_enforce_rules
before insert or update of status on public.appointments
for each row execute function private.enforce_appointment_rules();

create index appointments_status_changed_by_idx on public.appointments(status_changed_by)
where status_changed_by is not null;

create index appointments_cancelled_by_idx on public.appointments(cancelled_by)
where cancelled_by is not null;
