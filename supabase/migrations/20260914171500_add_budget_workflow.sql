begin;

create or replace function public.create_patient_budget(
  p_patient_public_id uuid,
  p_description text,
  p_discount_type public.discount_type,
  p_discount_value numeric,
  p_entry_amount numeric,
  p_remaining_installments_count integer,
  p_first_due_date date,
  p_items jsonb,
  p_observations text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  patient_row public.patients%rowtype;
  budget_row public.budgets%rowtype;
  item_data jsonb;
  catalog_row public.treatments_catalog%rowtype;
  item_id bigint;
  item_position integer := 0;
  item_name text;
  item_quantity numeric(10,2);
  item_unit_price numeric(14,2);
  item_tooth_code smallint;
  item_surfaces public.odontogram_surface[];
begin
  select * into patient_row
  from public.patients
  where public_id = p_patient_public_id and deleted_at is null;

  if patient_row.id is null then
    raise exception 'Paciente não encontrado.';
  end if;

  if not private.has_clinic_role(
    patient_row.clinic_id,
    array['owner','admin','dentist','assistant','secretary']::public.clinic_role[]
  ) then
    raise exception 'Perfil sem permissão para criar orçamento.';
  end if;

  if nullif(btrim(p_description), '') is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50
     or p_discount_value < 0
     or (p_discount_type = 'percentage' and p_discount_value > 100)
     or p_entry_amount < 0
     or p_remaining_installments_count < 0
     or p_remaining_installments_count > 60
     or (p_remaining_installments_count > 0 and p_first_due_date is null) then
    raise exception 'Dados do orçamento inválidos.';
  end if;

  insert into public.budgets (
    clinic_id, patient_id, description, issued_at, status,
    discount_type, discount_value, entry_amount,
    remaining_installments_count, has_installments, observations
  ) values (
    patient_row.clinic_id, patient_row.id, left(btrim(p_description), 200), current_date, 'pending',
    p_discount_type, round(p_discount_value, 4), 0,
    p_remaining_installments_count, p_remaining_installments_count > 0, left(nullif(btrim(p_observations), ''), 4000)
  ) returning * into budget_row;

  for item_data in select value from jsonb_array_elements(p_items)
  loop
    item_position := item_position + 1;
    catalog_row := null;

    if nullif(item_data->>'catalog_public_id', '') is not null then
      select * into catalog_row
      from public.treatments_catalog
      where public_id = (item_data->>'catalog_public_id')::uuid
        and clinic_id = patient_row.clinic_id
        and active = true
        and deleted_at is null;
    end if;

    item_name := coalesce(nullif(btrim(item_data->>'name'), ''), catalog_row.name);
    item_quantity := coalesce(nullif(item_data->>'quantity', '')::numeric, 1);
    item_unit_price := coalesce(nullif(item_data->>'unit_price', '')::numeric, catalog_row.base_price);
    item_tooth_code := nullif(item_data->>'tooth_code', '')::smallint;

    if item_name is null or item_quantity <= 0 or item_quantity > 100 or item_unit_price is null or item_unit_price < 0 then
      raise exception 'Item % do orçamento é inválido.', item_position;
    end if;

    if item_tooth_code is not null and item_tooth_code::text !~ '^[1-4][1-8]$' then
      raise exception 'Dente FDI inválido no item %.', item_position;
    end if;

    insert into public.budget_items (
      clinic_id, budget_id, treatment_catalog_id, dental_plan_id,
      position, treatment_name_snapshot, quantity, unit_price
    ) values (
      patient_row.clinic_id, budget_row.id, catalog_row.id, catalog_row.dental_plan_id,
      item_position, left(item_name, 240), round(item_quantity, 2), round(item_unit_price, 2)
    ) returning id into item_id;

    if item_tooth_code is not null then
      select coalesce(array_agg(value::public.odontogram_surface), '{}'::public.odontogram_surface[])
      into item_surfaces
      from jsonb_array_elements_text(coalesce(item_data->'surfaces', '[]'::jsonb)) surface(value)
      where value in ('mesial','occlusal_incisal','distal','vestibular','lingual_palatal','cervical','all');

      insert into public.budget_item_targets (
        clinic_id, budget_item_id, tooth_set, region, tooth_code, surfaces
      ) values (
        patient_row.clinic_id, item_id, 'permanent', 'tooth', item_tooth_code, item_surfaces
      );
    end if;
  end loop;

  select * into budget_row from public.budgets where id = budget_row.id for update;
  if p_entry_amount > budget_row.total_amount then
    raise exception 'A entrada não pode superar o total do orçamento.';
  end if;

  update public.budgets
  set entry_amount = round(p_entry_amount, 2),
      source_payload = jsonb_build_object('first_due_date', p_first_due_date)
  where id = budget_row.id;

  return budget_row.public_id;
end;
$$;

revoke all on function public.create_patient_budget(uuid, text, public.discount_type, numeric, numeric, integer, date, jsonb, text) from public, anon;
grant execute on function public.create_patient_budget(uuid, text, public.discount_type, numeric, numeric, integer, date, jsonb, text) to authenticated;

create or replace function public.approve_patient_budget(p_budget_public_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  budget_row public.budgets%rowtype;
  transaction_row public.financial_transactions%rowtype;
  remaining_amount numeric(14,2);
  part_amount numeric(14,2);
  last_amount numeric(14,2);
  first_due_date date;
  remaining_count integer;
  total_count integer;
  sequence_offset integer;
  installment_index integer;
begin
  select * into budget_row
  from public.budgets
  where public_id = p_budget_public_id and deleted_at is null
  for update;

  if budget_row.id is null then
    raise exception 'Orçamento não encontrado.';
  end if;

  if not private.has_clinic_role(
    budget_row.clinic_id,
    array['owner','admin','dentist','secretary','financial']::public.clinic_role[]
  ) then
    raise exception 'Perfil sem permissão para aprovar orçamento.';
  end if;

  select * into transaction_row
  from public.financial_transactions
  where clinic_id = budget_row.clinic_id
    and budget_id = budget_row.id
    and direction = 'income'
    and deleted_at is null
    and status <> 'cancelled'
  order by id
  limit 1;

  if transaction_row.id is not null then
    return transaction_row.public_id;
  end if;

  if budget_row.status not in ('draft', 'pending', 'partially_approved') or budget_row.total_amount <= 0 then
    raise exception 'Orçamento não está disponível para aprovação.';
  end if;

  first_due_date := coalesce((budget_row.source_payload->>'first_due_date')::date, current_date);
  remaining_count := budget_row.remaining_installments_count;
  remaining_amount := round(budget_row.total_amount - budget_row.entry_amount, 2);
  if remaining_amount > 0 and remaining_count = 0 then
    remaining_count := 1;
  end if;
  total_count := remaining_count + case when budget_row.entry_amount > 0 then 1 else 0 end;
  sequence_offset := case when budget_row.entry_amount > 0 then 1 else 0 end;

  update public.budgets
  set status = 'approved', approved_at = now(), approved_by = (select auth.uid()),
      remaining_installments_count = remaining_count,
      has_installments = total_count > 1
  where id = budget_row.id;

  update public.budget_items
  set approved = true, approved_at = now()
  where clinic_id = budget_row.clinic_id and budget_id = budget_row.id
    and deleted_at is null and cancelled_at is null;

  insert into public.financial_transactions (
    clinic_id, patient_id, budget_id, direction, status, description,
    gross_amount, occurred_at, category
  ) values (
    budget_row.clinic_id, budget_row.patient_id, budget_row.id, 'income', 'open',
    'Plano de tratamento — ' || budget_row.description,
    budget_row.total_amount, now(), 'tratamento_odontologico'
  ) returning * into transaction_row;

  if budget_row.entry_amount > 0 then
    insert into public.installments (
      clinic_id, transaction_id, patient_id, budget_id, sequence_number,
      total_installments, is_entry, due_date, amount
    ) values (
      budget_row.clinic_id, transaction_row.id, budget_row.patient_id, budget_row.id, 1,
      total_count, true, current_date, budget_row.entry_amount
    );
  end if;

  if remaining_count > 0 then
    part_amount := trunc((remaining_amount * 100) / remaining_count) / 100;
    last_amount := remaining_amount - (part_amount * (remaining_count - 1));
    for installment_index in 1..remaining_count loop
      insert into public.installments (
        clinic_id, transaction_id, patient_id, budget_id, sequence_number,
        total_installments, is_entry, due_date, amount
      ) values (
        budget_row.clinic_id, transaction_row.id, budget_row.patient_id, budget_row.id,
        installment_index + sequence_offset, total_count, false,
        (first_due_date + ((installment_index - 1) * interval '1 month'))::date,
        case when installment_index = remaining_count then last_amount else part_amount end
      );
    end loop;
  end if;

  return transaction_row.public_id;
end;
$$;

revoke all on function public.approve_patient_budget(uuid) from public, anon;
grant execute on function public.approve_patient_budget(uuid) to authenticated;

create or replace function private.refresh_financial_transaction(target_transaction_id bigint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  gross numeric(14,2);
  paid numeric(14,2);
begin
  select transaction.gross_amount, coalesce(sum(installment.paid_amount), 0)
  into gross, paid
  from public.financial_transactions transaction
  left join public.installments installment
    on installment.transaction_id = transaction.id and installment.deleted_at is null
  where transaction.id = target_transaction_id
  group by transaction.gross_amount;

  update public.financial_transactions
  set status = case
    when status in ('cancelled', 'reversed') then status
    when paid <= 0 then 'open'::public.transaction_status
    when paid < gross then 'partially_paid'::public.transaction_status
    else 'paid'::public.transaction_status
  end
  where id = target_transaction_id;
end;
$$;

create or replace function private.installment_refresh_transaction_trigger()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform private.refresh_financial_transaction(coalesce(new.transaction_id, old.transaction_id));
  if tg_op = 'UPDATE' and new.transaction_id <> old.transaction_id then
    perform private.refresh_financial_transaction(old.transaction_id);
  end if;
  return coalesce(new, old);
end;
$$;

create trigger installments_refresh_transaction
after insert or update of paid_amount, status or delete on public.installments
for each row execute function private.installment_refresh_transaction_trigger();

create or replace function public.register_installment_payment(
  p_installment_public_id uuid,
  p_payment_method_public_id uuid,
  p_amount numeric,
  p_card_installments integer default 1,
  p_observations text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  installment_row public.installments%rowtype;
  method_row public.payment_methods%rowtype;
  fee_row public.payment_method_fees%rowtype;
  settlement_row public.payment_settlements%rowtype;
  outstanding numeric(14,2);
  fee_amount numeric(14,2);
  settlement_status public.payment_status;
  settlement_at timestamptz;
begin
  select * into installment_row
  from public.installments
  where public_id = p_installment_public_id and deleted_at is null
  for update;

  if installment_row.id is null then
    raise exception 'Parcela não encontrada.';
  end if;

  if not private.has_clinic_role(
    installment_row.clinic_id,
    array['owner','admin','financial','secretary']::public.clinic_role[]
  ) then
    raise exception 'Perfil sem permissão para receber valores.';
  end if;

  select * into method_row
  from public.payment_methods
  where public_id = p_payment_method_public_id
    and clinic_id = installment_row.clinic_id
    and active = true and deleted_at is null;

  outstanding := round(installment_row.amount - installment_row.paid_amount, 2);
  if method_row.id is null or p_amount <= 0 or round(p_amount, 2) > outstanding
     or p_card_installments < 1 or p_card_installments > 24
     or installment_row.status in ('cancelled','reversed','settled') then
    raise exception 'Pagamento inválido ou superior ao saldo da parcela.';
  end if;

  select * into fee_row
  from public.payment_method_fees
  where clinic_id = installment_row.clinic_id
    and payment_method_id = method_row.id
    and installments_count = p_card_installments
    and valid_from <= current_date
    and (valid_until is null or valid_until >= current_date)
    and deleted_at is null
  order by valid_from desc
  limit 1;

  fee_amount := round(round(p_amount, 2) * coalesce(fee_row.fee_percentage, 0) / 100, 2)
                + coalesce(fee_row.fixed_fee_amount, 0);
  fee_amount := least(fee_amount, round(p_amount, 2));
  settlement_status := case
    when method_row.settlement_days = 0 then 'settled'::public.payment_status
    else 'awaiting_settlement'::public.payment_status
  end;
  settlement_at := case when method_row.settlement_days = 0 then now() else null end;

  insert into public.payment_settlements (
    clinic_id, installment_id, payment_method_id, payment_method_fee_id,
    status, card_installments, gross_amount, fee_percentage, fee_amount,
    net_amount, paid_at, expected_settlement_at, settled_at, observations
  ) values (
    installment_row.clinic_id, installment_row.id, method_row.id, fee_row.id,
    settlement_status, p_card_installments, round(p_amount, 2), coalesce(fee_row.fee_percentage, 0), fee_amount,
    round(p_amount, 2) - fee_amount, now(), now() + make_interval(days => method_row.settlement_days),
    settlement_at, left(nullif(btrim(p_observations), ''), 2000)
  ) returning * into settlement_row;

  return settlement_row.public_id;
end;
$$;

revoke all on function public.register_installment_payment(uuid, uuid, numeric, integer, text) from public, anon;
grant execute on function public.register_installment_payment(uuid, uuid, numeric, integer, text) to authenticated;

insert into public.payment_methods (clinic_id, kind, display_name, settlement_days)
select clinic.id, defaults.kind::public.payment_method_kind, defaults.display_name, defaults.settlement_days
from public.clinics clinic
cross join (values
  ('pix', 'PIX', 0),
  ('cash', 'Dinheiro', 0),
  ('debit_card', 'Cartão de débito', 1),
  ('credit_card', 'Cartão de crédito', 30),
  ('boleto', 'Boleto', 2),
  ('check', 'Cheque', 0),
  ('ted', 'Transferência', 0)
) defaults(kind, display_name, settlement_days)
where clinic.deleted_at is null
on conflict (clinic_id, display_name) do nothing;

create or replace function private.seed_clinic_payment_methods()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.payment_methods (clinic_id, kind, display_name, settlement_days)
  values
    (new.id, 'pix', 'PIX', 0),
    (new.id, 'cash', 'Dinheiro', 0),
    (new.id, 'debit_card', 'Cartão de débito', 1),
    (new.id, 'credit_card', 'Cartão de crédito', 30),
    (new.id, 'boleto', 'Boleto', 2),
    (new.id, 'check', 'Cheque', 0),
    (new.id, 'ted', 'Transferência', 0)
  on conflict (clinic_id, display_name) do nothing;
  return new;
end;
$$;

revoke all on function private.seed_clinic_payment_methods() from public, anon, authenticated;
create trigger clinics_seed_payment_methods
after insert on public.clinics
for each row execute function private.seed_clinic_payment_methods();

commit;
