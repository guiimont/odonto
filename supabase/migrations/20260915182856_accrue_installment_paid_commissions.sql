-- Accrue installment-paid commissions proportionally across approved budget items.
create unique index if not exists commissions_installment_rule_once_idx
  on public.commissions (payment_settlement_id, commission_rule_id)
  where trigger_event = 'installment_paid' and deleted_at is null;

alter table public.commission_rules
  drop constraint if exists commission_rules_installment_percentage_chk;

alter table public.commission_rules
  add constraint commission_rules_installment_percentage_chk check (
    trigger_event <> 'installment_paid' or calculation_type = 'percentage'
  );

create or replace function private.accrue_installment_paid_commissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text := coalesce(auth.jwt() ->> 'role', '');
begin
  if new.paid_at is null
     or new.status not in ('captured', 'awaiting_settlement', 'settled')
     or new.installment_id is null then
    return new;
  end if;

  if actor_role <> 'service_role'
     and (actor_id is null or not private.has_clinic_role(
       new.clinic_id,
       array['owner','admin','financial','secretary']::public.clinic_role[]
     )) then
    raise exception 'not authorized to accrue installment commission'
      using errcode = '42501';
  end if;

  insert into public.commissions (
    clinic_id, professional_profile_id, commission_rule_id, installment_id,
    payment_settlement_id, status, trigger_event, calculation_type,
    calculation_basis, basis_amount, rule_value, commission_amount,
    accrued_at, source_payload
  )
  with installment_context as (
    select
      i.budget_id,
      (
        select sum(all_items.net_amount)
        from public.budget_items all_items
        where all_items.clinic_id = i.clinic_id
          and all_items.budget_id = i.budget_id
          and all_items.approved
          and all_items.cancelled_at is null
          and all_items.deleted_at is null
          and all_items.net_amount > 0
      ) as total_net_amount
    from public.installments i
    where i.id = new.installment_id
      and i.clinic_id = new.clinic_id
      and i.deleted_at is null
  ),
  eligible_items as (
    select
      bi.id, bi.professional_profile_id, bi.treatment_catalog_id,
      bi.dental_plan_id, bi.net_amount, tc.category as treatment_category,
      ic.total_net_amount
    from installment_context ic
    join public.budget_items bi
      on bi.clinic_id = new.clinic_id
     and bi.budget_id = ic.budget_id
     and bi.approved
     and bi.cancelled_at is null
     and bi.deleted_at is null
     and bi.professional_profile_id is not null
     and bi.net_amount > 0
    left join public.treatments_catalog tc
      on tc.clinic_id = bi.clinic_id
     and tc.id = bi.treatment_catalog_id
  ),
  item_rules as (
    select
      item.*,
      rule.id as rule_id,
      rule.calculation_type,
      rule.calculation_basis,
      rule.value as rule_value
    from eligible_items item
    join lateral (
      select cr.*
      from public.commission_rules cr
      where cr.clinic_id = new.clinic_id
        and cr.professional_profile_id = item.professional_profile_id
        and cr.trigger_event = 'installment_paid'
        and cr.calculation_type = 'percentage'
        and cr.calculation_basis in ('installment_gross', 'payment_net')
        and cr.active
        and cr.deleted_at is null
        and cr.effective_from <= new.paid_at
        and (cr.effective_until is null or cr.effective_until >= new.paid_at)
        and (cr.treatment_catalog_id is null or cr.treatment_catalog_id = item.treatment_catalog_id)
        and (cr.dental_plan_id is null or cr.dental_plan_id = item.dental_plan_id)
        and (cr.treatment_category is null or cr.treatment_category = item.treatment_category)
      order by
        ((cr.treatment_catalog_id is not null)::int * 8
          + (cr.treatment_category is not null)::int * 4
          + (cr.dental_plan_id is not null)::int * 2) desc,
        cr.effective_from desc,
        cr.id desc
      limit 1
    ) rule on true
    where item.total_net_amount > 0
  ),
  grouped_rules as (
    select
      professional_profile_id, rule_id, calculation_type, calculation_basis,
      rule_value,
      round(sum(
        (case calculation_basis
          when 'installment_gross' then new.gross_amount
          else new.net_amount
        end) * net_amount / total_net_amount
      ), 2) as allocated_basis,
      jsonb_agg(jsonb_build_object(
        'budget_item_id', id,
        'item_net_amount', net_amount,
        'allocation_ratio', round(net_amount / total_net_amount, 8)
      ) order by id) as item_allocations
    from item_rules
    group by professional_profile_id, rule_id, calculation_type, calculation_basis, rule_value
  )
  select
    new.clinic_id, grouped.professional_profile_id, grouped.rule_id,
    new.installment_id, new.id, 'open', 'installment_paid',
    grouped.calculation_type, grouped.calculation_basis, grouped.allocated_basis,
    grouped.rule_value,
    round(grouped.allocated_basis * grouped.rule_value / 100, 2),
    new.paid_at,
    jsonb_build_object(
      'origin', 'installment_payment',
      'allocation_method', 'budget_item_net_proportion',
      'original_basis_amount', grouped.allocated_basis,
      'items', grouped.item_allocations
    )
  from grouped_rules grouped
  where grouped.allocated_basis > 0
  on conflict (payment_settlement_id, commission_rule_id)
    where trigger_event = 'installment_paid' and deleted_at is null
  do nothing;

  return new;
end;
$$;

revoke all on function private.accrue_installment_paid_commissions() from public, anon, authenticated;

drop trigger if exists accrue_installment_paid_commissions on public.payment_settlements;
create trigger accrue_installment_paid_commissions
after insert on public.payment_settlements
for each row
when (
  new.paid_at is not null
  and new.status in ('captured', 'awaiting_settlement', 'settled')
)
execute function private.accrue_installment_paid_commissions();

-- The former AFTER INSERT trigger counted NEW twice because it is already visible.
create or replace function private.apply_payment_reversal()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  settlement_row public.payment_settlements%rowtype;
  reversed_total numeric(14,2);
begin
  select * into strict settlement_row
  from public.payment_settlements
  where id = new.payment_settlement_id
    and clinic_id = new.clinic_id
  for update;

  select coalesce(sum(reversal.amount), 0)
  into reversed_total
  from public.payment_reversals reversal
  where reversal.payment_settlement_id = new.payment_settlement_id
    and reversal.deleted_at is null;

  if reversed_total > settlement_row.gross_amount then
    raise exception 'Cumulative reversal amount (%) exceeds payment gross amount (%)',
      reversed_total, settlement_row.gross_amount;
  end if;

  if reversed_total = settlement_row.gross_amount then
    update public.payment_settlements
    set status = new.reversal_type
    where id = new.payment_settlement_id;
  else
    perform private.refresh_installment_totals(settlement_row.installment_id);
  end if;

  return new;
end;
$$;

create or replace function private.reconcile_reversed_payment_commissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  settlement_row public.payment_settlements%rowtype;
  reversed_total numeric(14,2);
  remaining_ratio numeric;
begin
  select * into strict settlement_row
  from public.payment_settlements
  where id = new.payment_settlement_id
    and clinic_id = new.clinic_id;

  select coalesce(sum(reversal.amount), 0)
  into reversed_total
  from public.payment_reversals reversal
  where reversal.payment_settlement_id = new.payment_settlement_id
    and reversal.deleted_at is null;

  remaining_ratio := greatest(settlement_row.gross_amount - reversed_total, 0)
                     / nullif(settlement_row.gross_amount, 0);

  update public.commissions commission
  set
    status = case
      when remaining_ratio = 0 or commission.status = 'paid'
        then 'reversed'::public.commission_status
      else commission.status
    end,
    basis_amount = case
      when remaining_ratio = 0 or commission.status = 'paid'
        then commission.basis_amount
      else round((commission.source_payload ->> 'original_basis_amount')::numeric * remaining_ratio, 2)
    end,
    commission_amount = case
      when remaining_ratio = 0 or commission.status = 'paid'
        then commission.commission_amount
      else round(
        round((commission.source_payload ->> 'original_basis_amount')::numeric * remaining_ratio, 2)
        * commission.rule_value / 100,
        2
      )
    end,
    reversed_at = case
      when remaining_ratio = 0 or commission.status = 'paid' then now()
      else commission.reversed_at
    end,
    reversal_reason = case
      when remaining_ratio = 0 then left(new.reason, 2000)
      when commission.status = 'paid' then 'Estorno parcial após pagamento da comissão; conciliação manual necessária.'
      else commission.reversal_reason
    end,
    source_payload = commission.source_payload || jsonb_build_object(
      'reversed_payment_amount', reversed_total,
      'remaining_payment_ratio', round(remaining_ratio, 8),
      'last_reversal_id', new.id
    )
  where commission.clinic_id = new.clinic_id
    and commission.payment_settlement_id = new.payment_settlement_id
    and commission.trigger_event = 'installment_paid'
    and commission.deleted_at is null
    and commission.status <> 'reversed';

  return new;
end;
$$;

revoke all on function private.reconcile_reversed_payment_commissions() from public, anon, authenticated;

drop trigger if exists zz_reconcile_reversed_payment_commissions on public.payment_reversals;
create trigger zz_reconcile_reversed_payment_commissions
after insert on public.payment_reversals
for each row execute function private.reconcile_reversed_payment_commissions();
