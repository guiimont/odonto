-- Clinical execution lifecycle: treatment, signed evolution, odontogram and commission.
create unique index if not exists odontogram_executed_procedure_once_idx
  on public.odontogram_entries (clinical_procedure_id, tooth_set, tooth_code, surfaces)
  where entry_kind = 'executed_procedure' and deleted_at is null;

create unique index if not exists commissions_treatment_rule_once_idx
  on public.commissions (clinical_procedure_id, commission_rule_id)
  where trigger_event = 'treatment_completed' and deleted_at is null;

create or replace function private.accrue_completed_procedure_commission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text := coalesce(auth.role(), '');
  matched_rule public.commission_rules%rowtype;
  v_treatment_category text;
  calculated_amount numeric(14,2);
begin
  if new.status <> 'completed' or old.status = 'completed' then
    return new;
  end if;

  if actor_role <> 'service_role'
     and (actor_id is null or not private.has_clinic_role(
       new.clinic_id,
       array['owner','admin','dentist','assistant']::public.clinic_role[]
     )) then
    raise exception 'not authorized to accrue clinical commission'
      using errcode = '42501';
  end if;

  if new.professional_profile_id is null then
    return new;
  end if;

  select tc.category
    into v_treatment_category
  from public.treatments_catalog tc
  where tc.id = new.treatment_catalog_id
    and tc.clinic_id = new.clinic_id;

  select cr.*
    into matched_rule
  from public.commission_rules cr
  where cr.clinic_id = new.clinic_id
    and cr.professional_profile_id = new.professional_profile_id
    and cr.trigger_event = 'treatment_completed'
    and cr.calculation_basis in ('procedure_gross', 'procedure_net_after_discount')
    and cr.active
    and cr.deleted_at is null
    and cr.effective_from <= coalesce(new.completed_at, now())
    and (cr.effective_until is null or cr.effective_until >= coalesce(new.completed_at, now()))
    and (cr.treatment_catalog_id is null or cr.treatment_catalog_id = new.treatment_catalog_id)
    and (cr.dental_plan_id is null or cr.dental_plan_id = new.dental_plan_id)
    and (cr.treatment_category is null or cr.treatment_category = v_treatment_category)
  order by
    ((cr.treatment_catalog_id is not null)::int * 8
      + (cr.treatment_category is not null)::int * 4
      + (cr.dental_plan_id is not null)::int * 2) desc,
    cr.effective_from desc,
    cr.id desc
  limit 1;

  if matched_rule.id is null then
    return new;
  end if;

  calculated_amount := case matched_rule.calculation_type
    when 'percentage' then round(new.charged_amount * matched_rule.value / 100, 2)
    else round(matched_rule.value, 2)
  end;

  insert into public.commissions (
    clinic_id,
    professional_profile_id,
    commission_rule_id,
    clinical_procedure_id,
    status,
    trigger_event,
    calculation_type,
    calculation_basis,
    basis_amount,
    rule_value,
    commission_amount,
    accrued_at,
    source_payload
  ) values (
    new.clinic_id,
    new.professional_profile_id,
    matched_rule.id,
    new.id,
    'open',
    'treatment_completed',
    matched_rule.calculation_type,
    matched_rule.calculation_basis,
    new.charged_amount,
    matched_rule.value,
    calculated_amount,
    coalesce(new.completed_at, now()),
    jsonb_build_object('origin', 'clinical_procedure_completion')
  )
  on conflict (clinical_procedure_id, commission_rule_id)
    where trigger_event = 'treatment_completed' and deleted_at is null
  do nothing;

  return new;
end;
$$;

revoke all on function private.accrue_completed_procedure_commission() from public, anon, authenticated;

drop trigger if exists accrue_completed_procedure_commission on public.clinical_procedures;
create trigger accrue_completed_procedure_commission
after update of status on public.clinical_procedures
for each row
when (new.status = 'completed' and old.status is distinct from new.status)
execute function private.accrue_completed_procedure_commission();

create or replace function public.advance_clinical_procedure(
  p_patient_public_id uuid,
  p_procedure_public_id uuid,
  p_action text,
  p_occurred_at timestamptz default null,
  p_evolution_description text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  procedure_record public.clinical_procedures%rowtype;
  patient_record public.patients%rowtype;
  created_evolution_id bigint;
  normalized_description text := nullif(btrim(p_evolution_description), '');
  event_time timestamptz := coalesce(p_occurred_at, now());
  signature_value text;
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select cp.*
    into procedure_record
  from public.clinical_procedures cp
  join public.patients p
    on p.clinic_id = cp.clinic_id and p.id = cp.patient_id
  where cp.public_id = p_procedure_public_id
    and p.public_id = p_patient_public_id
    and cp.deleted_at is null
    and p.deleted_at is null
  for update of cp;

  if procedure_record.id is null then
    raise exception 'clinical procedure not found' using errcode = 'P0002';
  end if;

  if not private.has_clinic_role(
    procedure_record.clinic_id,
    array['owner','admin','dentist','assistant']::public.clinic_role[]
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if p_action = 'start' then
    if procedure_record.status = 'in_progress' then
      return procedure_record.public_id;
    end if;
    if procedure_record.status <> 'planned' then
      raise exception 'invalid procedure transition';
    end if;

    update public.clinical_procedures
    set status = 'in_progress',
        professional_profile_id = coalesce(professional_profile_id, actor_id),
        started_at = coalesce(started_at, event_time)
    where id = procedure_record.id;

    update public.odontogram_entries
    set status = 'in_progress'
    where clinic_id = procedure_record.clinic_id
      and clinical_procedure_id = procedure_record.id
      and entry_kind = 'planned_procedure'
      and deleted_at is null;

    return procedure_record.public_id;
  end if;

  if p_action <> 'complete' then
    raise exception 'unsupported clinical action';
  end if;

  if procedure_record.status = 'completed' then
    return procedure_record.public_id;
  end if;
  if procedure_record.status not in ('planned', 'in_progress') then
    raise exception 'invalid procedure transition';
  end if;
  if normalized_description is null or char_length(normalized_description) < 3 then
    raise exception 'clinical evolution is required';
  end if;
  if event_time > now() + interval '5 minutes' then
    raise exception 'clinical occurrence cannot be in the future';
  end if;

  signature_value := encode(
    extensions.digest(
      convert_to(
        procedure_record.clinic_id::text || ':' ||
        procedure_record.patient_id::text || ':' ||
        procedure_record.id::text || ':' ||
        actor_id::text || ':' ||
        event_time::text || ':' ||
        normalized_description,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  insert into public.clinical_evolutions (
    clinic_id,
    patient_id,
    professional_profile_id,
    status,
    description,
    occurred_at,
    is_automatic,
    signed_at,
    signed_by,
    signature_hash,
    signature_provider,
    source_payload
  ) values (
    procedure_record.clinic_id,
    procedure_record.patient_id,
    actor_id,
    'signed',
    normalized_description,
    event_time,
    false,
    now(),
    actor_id,
    signature_value,
    'sha256-v1',
    jsonb_build_object(
      'origin', 'clinical_procedure_completion',
      'clinical_procedure_public_id', procedure_record.public_id
    )
  )
  returning id into created_evolution_id;

  insert into public.clinical_evolution_procedures (
    clinic_id,
    evolution_id,
    clinical_procedure_id
  ) values (
    procedure_record.clinic_id,
    created_evolution_id,
    procedure_record.id
  )
  on conflict (evolution_id, clinical_procedure_id) do nothing;

  update public.clinical_procedures
  set status = 'completed',
      professional_profile_id = coalesce(professional_profile_id, actor_id),
      started_at = coalesce(started_at, event_time),
      completed_at = event_time
  where id = procedure_record.id;

  update public.odontogram_entries
  set status = 'completed'
  where clinic_id = procedure_record.clinic_id
    and clinical_procedure_id = procedure_record.id
    and entry_kind = 'planned_procedure'
    and deleted_at is null;

  insert into public.odontogram_entries (
    clinic_id,
    patient_id,
    clinical_procedure_id,
    recorded_by,
    entry_kind,
    tooth_set,
    region,
    tooth_code,
    surfaces,
    diagnosis_code,
    description,
    status,
    occurred_at,
    source_payload
  )
  select
    oe.clinic_id,
    oe.patient_id,
    oe.clinical_procedure_id,
    actor_id,
    'executed_procedure',
    oe.tooth_set,
    oe.region,
    oe.tooth_code,
    oe.surfaces,
    oe.diagnosis_code,
    'Executado: ' || procedure_record.treatment_name_snapshot,
    'completed',
    event_time,
    jsonb_build_object(
      'origin', 'clinical_procedure_completion',
      'source_odontogram_public_id', oe.public_id
    )
  from public.odontogram_entries oe
  where oe.clinic_id = procedure_record.clinic_id
    and oe.clinical_procedure_id = procedure_record.id
    and oe.entry_kind = 'planned_procedure'
    and oe.deleted_at is null
  on conflict (clinical_procedure_id, tooth_set, tooth_code, surfaces)
    where entry_kind = 'executed_procedure' and deleted_at is null
  do nothing;

  return procedure_record.public_id;
end;
$$;

revoke all on function public.advance_clinical_procedure(uuid, uuid, text, timestamptz, text) from public, anon;
grant execute on function public.advance_clinical_procedure(uuid, uuid, text, timestamptz, text) to authenticated;
