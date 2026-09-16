-- Commissions are created by trusted accrual triggers and closed through explicit status transitions.
drop policy if exists commissions_finance_insert on public.commissions;
drop policy if exists commissions_finance_update on public.commissions;

revoke insert, update on table public.commissions from authenticated;
grant update (status) on table public.commissions to authenticated;

create policy commissions_management_update
on public.commissions
for update
to authenticated
using (
  (select private.has_clinic_role(
    clinic_id,
    array['owner', 'admin', 'financial']::public.clinic_role[]
  ))
)
with check (
  (select private.has_clinic_role(
    clinic_id,
    array['owner', 'admin', 'financial']::public.clinic_role[]
  ))
);

create index if not exists commissions_clinic_status_accrued_idx
  on public.commissions (clinic_id, status, accrued_at desc)
  where deleted_at is null;

create or replace function private.validate_commission_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  -- Internal accrual and reversal functions run as the database owner.
  if current_user in ('postgres', 'service_role') then
    return new;
  end if;

  if auth.uid() is null or not private.has_clinic_role(
    old.clinic_id,
    array['owner', 'admin', 'financial']::public.clinic_role[]
  ) then
    raise exception 'Perfil sem permissão para fechar comissões.'
      using errcode = '42501';
  end if;

  if old.status = 'open' and new.status = 'approved' then
    new.approved_at := now();
    new.paid_at := null;
  elsif old.status = 'approved' and new.status = 'open' then
    new.approved_at := null;
    new.paid_at := null;
  elsif old.status = 'approved' and new.status = 'paid' then
    new.approved_at := coalesce(old.approved_at, now());
    new.paid_at := now();
  else
    raise exception 'Transição de comissão inválida: % -> %', old.status, new.status
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_commission_status_transition() from public, anon, authenticated;

drop trigger if exists commissions_validate_status_transition on public.commissions;
create trigger commissions_validate_status_transition
before update of status on public.commissions
for each row execute function private.validate_commission_status_transition();
