begin;

alter table public.budget_items
  add column if not exists source_odontogram_entry_id bigint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'budget_items_clinic_id_source_odontogram_entry_id_fkey'
      and conrelid = 'public.budget_items'::regclass
  ) then
    alter table public.budget_items
      add constraint budget_items_clinic_id_source_odontogram_entry_id_fkey
      foreign key (clinic_id, source_odontogram_entry_id)
      references public.odontogram_entries(clinic_id, id)
      on delete restrict;
  end if;
end $$;

create index if not exists idx_budget_items_source_odontogram_entry
  on public.budget_items (clinic_id, source_odontogram_entry_id)
  where source_odontogram_entry_id is not null and deleted_at is null;

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
  source_entry public.odontogram_entries%rowtype;
  source_entry_id bigint;
  item_id bigint;
  item_position integer := 0;
  item_name text;
  item_quantity numeric(10,2);
  item_unit_price numeric(14,2);
  item_tooth_code smallint;
  item_tooth_set public.tooth_set;
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
    source_entry_id := null;

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
    item_tooth_set := coalesce(nullif(item_data->>'tooth_set', '')::public.tooth_set, 'permanent');
    item_surfaces := '{}'::public.odontogram_surface[];

    if nullif(item_data->>'source_odontogram_public_id', '') is not null then
      select * into source_entry
      from public.odontogram_entries
      where public_id = (item_data->>'source_odontogram_public_id')::uuid
        and clinic_id = patient_row.clinic_id
        and patient_id = patient_row.id
        and entry_kind = 'planned_procedure'
        and deleted_at is null;

      if source_entry.id is null then
        raise exception 'Origem clínica inválida no item %.', item_position;
      end if;

      source_entry_id := source_entry.id;
      item_tooth_code := source_entry.tooth_code;
      item_tooth_set := source_entry.tooth_set;
      item_surfaces := source_entry.surfaces;
    elsif item_tooth_code is not null then
      select coalesce(array_agg(value::public.odontogram_surface), '{}'::public.odontogram_surface[])
      into item_surfaces
      from jsonb_array_elements_text(coalesce(item_data->'surfaces', '[]'::jsonb)) surface(value)
      where value in ('mesial','occlusal_incisal','distal','vestibular','lingual_palatal','cervical','all');
    end if;

    if item_name is null or item_quantity <= 0 or item_quantity > 100 or item_unit_price is null or item_unit_price < 0 then
      raise exception 'Item % do orçamento é inválido.', item_position;
    end if;

    if item_tooth_code is not null and not (
      (item_tooth_set = 'permanent' and item_tooth_code::text ~ '^[1-4][1-8]$')
      or (item_tooth_set = 'deciduous' and item_tooth_code::text ~ '^[5-8][1-5]$')
    ) then
      raise exception 'Dente FDI inválido no item %.', item_position;
    end if;

    insert into public.budget_items (
      clinic_id, budget_id, treatment_catalog_id, dental_plan_id,
      source_odontogram_entry_id, position, treatment_name_snapshot, quantity, unit_price
    ) values (
      patient_row.clinic_id, budget_row.id, catalog_row.id, catalog_row.dental_plan_id,
      source_entry_id, item_position, left(item_name, 240), round(item_quantity, 2), round(item_unit_price, 2)
    ) returning id into item_id;

    if item_tooth_code is not null then
      insert into public.budget_item_targets (
        clinic_id, budget_item_id, tooth_set, region, tooth_code, surfaces
      ) values (
        patient_row.clinic_id, item_id, item_tooth_set, 'tooth', item_tooth_code, item_surfaces
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

create or replace function private.materialize_approved_budget_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  patient_id_value bigint;
  procedure_id bigint;
begin
  if not new.approved or old.approved then
    return new;
  end if;

  if not private.has_clinic_role(
    new.clinic_id,
    array['owner','admin','dentist','secretary','financial']::public.clinic_role[]
  ) then
    raise exception 'Perfil sem permissão para materializar procedimento clínico.';
  end if;

  select patient_id into patient_id_value
  from public.budgets
  where clinic_id = new.clinic_id and id = new.budget_id and deleted_at is null;

  if patient_id_value is null then
    raise exception 'Paciente do orçamento não encontrado.';
  end if;

  insert into public.clinical_procedures (
    clinic_id, patient_id, budget_item_id, treatment_catalog_id, dental_plan_id,
    professional_profile_id, treatment_name_snapshot, charged_amount, status,
    planned_at, source_payload
  ) values (
    new.clinic_id, patient_id_value, new.id, new.treatment_catalog_id, new.dental_plan_id,
    new.professional_profile_id, new.treatment_name_snapshot, new.net_amount, 'planned',
    now(), jsonb_build_object('origin', 'approved_budget_item')
  )
  on conflict (budget_item_id) do nothing
  returning id into procedure_id;

  if procedure_id is null then
    select id into procedure_id
    from public.clinical_procedures
    where budget_item_id = new.id and deleted_at is null;
  end if;

  if new.source_odontogram_entry_id is not null then
    update public.odontogram_entries
    set clinical_procedure_id = procedure_id,
        status = 'planned'
    where clinic_id = new.clinic_id
      and id = new.source_odontogram_entry_id
      and patient_id = patient_id_value
      and entry_kind = 'planned_procedure'
      and (clinical_procedure_id is null or clinical_procedure_id = procedure_id)
      and deleted_at is null;
  end if;

  return new;
end;
$$;

revoke all on function private.materialize_approved_budget_item() from public, anon, authenticated;

drop trigger if exists trg_materialize_approved_budget_item on public.budget_items;
create trigger trg_materialize_approved_budget_item
after update of approved on public.budget_items
for each row
when (new.approved = true and old.approved = false)
execute function private.materialize_approved_budget_item();

commit;
