begin;

create table public.patient_files (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  patient_id bigint not null,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 15728640),
  category text not null default 'document' check (
    category in ('intraoral_photo', 'radiograph', 'exam', 'document', 'other')
  ),
  description text,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  source_system text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, patient_id)
    references public.patients(clinic_id, id) on delete restrict
);

create index patient_files_patient_created_idx
  on public.patient_files (patient_id, created_at desc)
  where deleted_at is null;

create trigger patient_files_set_updated_at
before update on public.patient_files
for each row execute function private.set_updated_at();

create trigger patient_files_audit
after insert or update or delete on public.patient_files
for each row execute function private.audit_row_change();

alter table public.patient_files enable row level security;
revoke all on table public.patient_files from anon, authenticated;
grant select, insert, update on table public.patient_files to authenticated;

create policy patient_files_member_select on public.patient_files
for select to authenticated
using ((select private.is_clinic_member(clinic_id)));

create policy patient_files_clinical_insert on public.patient_files
for insert to authenticated
with check ((select private.has_clinic_role(
  clinic_id,
  array['owner','admin','dentist','assistant']::public.clinic_role[]
)));

create policy patient_files_clinical_update on public.patient_files
for update to authenticated
using ((select private.has_clinic_role(
  clinic_id,
  array['owner','admin','dentist','assistant']::public.clinic_role[]
)))
with check ((select private.has_clinic_role(
  clinic_id,
  array['owner','admin','dentist','assistant']::public.clinic_role[]
)));

grant usage, select on sequence public.patient_files_id_seq to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinical-files',
  'clinical-files',
  false,
  15728640,
  array['image/jpeg','image/png','image/webp','image/heic','application/pdf','application/dicom']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy clinical_files_member_select on storage.objects
for select to authenticated
using (
  bucket_id = 'clinical-files'
  and (storage.foldername(name))[1] ~ '^[0-9]+$'
  and (select private.is_clinic_member(((storage.foldername(name))[1])::bigint))
);

create policy clinical_files_clinical_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'clinical-files'
  and (storage.foldername(name))[1] ~ '^[0-9]+$'
  and (select private.has_clinic_role(
    ((storage.foldername(name))[1])::bigint,
    array['owner','admin','dentist','assistant']::public.clinic_role[]
  ))
);

create or replace function private.seed_default_anamnesis_template(target_clinic_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_template_id bigint;
begin
  if exists (
    select 1 from public.anamnesis_templates
    where clinic_id = target_clinic_id
      and active
      and deleted_at is null
  ) then
    return;
  end if;

  insert into public.anamnesis_templates (clinic_id, name, version)
  values (target_clinic_id, 'Anamnese clínica inicial', 1)
  returning id into created_template_id;

  insert into public.anamnesis_questions (
    clinic_id, template_id, position, prompt, allows_selection, allows_free_text, required
  ) values
    (target_clinic_id, created_template_id, 1, 'Está atualmente em tratamento médico?', true, true, true),
    (target_clinic_id, created_template_id, 2, 'Usa algum medicamento continuamente?', true, true, true),
    (target_clinic_id, created_template_id, 3, 'Possui alergia a medicamentos, materiais ou alimentos?', true, true, true),
    (target_clinic_id, created_template_id, 4, 'Já apresentou sangramento prolongado ou alteração de coagulação?', true, true, true),
    (target_clinic_id, created_template_id, 5, 'Possui doença cardíaca ou utiliza marca-passo?', true, true, true),
    (target_clinic_id, created_template_id, 6, 'Possui hipertensão arterial?', true, true, true),
    (target_clinic_id, created_template_id, 7, 'Possui diabetes?', true, true, true),
    (target_clinic_id, created_template_id, 8, 'Possui ou já teve doença infectocontagiosa relevante?', true, true, true),
    (target_clinic_id, created_template_id, 9, 'Está gestante ou amamentando?', true, true, false),
    (target_clinic_id, created_template_id, 10, 'Fuma ou utiliza produtos com nicotina?', true, true, true),
    (target_clinic_id, created_template_id, 11, 'Já teve reação adversa a anestesia?', true, true, true),
    (target_clinic_id, created_template_id, 12, 'Existe outra condição importante para o atendimento odontológico?', true, true, false);
end;
$$;

revoke all on function private.seed_default_anamnesis_template(bigint)
from public, anon, authenticated;

create or replace function private.seed_default_anamnesis_after_clinic()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.seed_default_anamnesis_template(new.id);
  return new;
end;
$$;

revoke all on function private.seed_default_anamnesis_after_clinic()
from public, anon, authenticated;

create trigger clinics_seed_default_anamnesis
after insert on public.clinics
for each row execute function private.seed_default_anamnesis_after_clinic();

do $$
declare
  clinic_record record;
begin
  for clinic_record in select id from public.clinics loop
    perform private.seed_default_anamnesis_template(clinic_record.id);
  end loop;
end;
$$;

create or replace function public.submit_patient_anamnesis(
  p_patient_public_id uuid,
  p_answers jsonb,
  p_answered_by_patient boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_patient public.patients%rowtype;
  target_template public.anamnesis_templates%rowtype;
  created_anamnesis_id bigint;
  created_public_id uuid;
  invalid_count integer;
begin
  if actor_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if jsonb_typeof(p_answers) <> 'array' then
    raise exception 'answers_must_be_an_array' using errcode = '22023';
  end if;

  select * into target_patient
  from public.patients
  where public_id = p_patient_public_id
    and deleted_at is null;

  if target_patient.id is null then
    raise exception 'patient_not_found' using errcode = 'P0002';
  end if;

  if not private.has_clinic_role(
    target_patient.clinic_id,
    array['owner','admin','dentist','assistant']::public.clinic_role[]
  ) then
    raise exception 'clinical_write_forbidden' using errcode = '42501';
  end if;

  select * into target_template
  from public.anamnesis_templates
  where clinic_id = target_patient.clinic_id
    and active
    and deleted_at is null
  order by version desc, id desc
  limit 1;

  if target_template.id is null then
    raise exception 'active_anamnesis_template_not_found' using errcode = 'P0002';
  end if;

  with supplied as (
    select
      nullif(answer ->> 'question_public_id', '')::uuid as question_public_id,
      nullif(answer ->> 'selection', '') as selection,
      nullif(btrim(answer ->> 'answer_text'), '') as answer_text
    from jsonb_array_elements(p_answers) answer
  )
  select count(*) into invalid_count
  from supplied
  left join public.anamnesis_questions question
    on question.public_id = supplied.question_public_id
   and question.template_id = target_template.id
   and question.deleted_at is null
  where question.id is null
     or supplied.selection not in ('yes', 'no', 'unknown')
     or (supplied.selection is null and supplied.answer_text is null);

  if invalid_count > 0 then
    raise exception 'invalid_anamnesis_answer' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.anamnesis_questions required_question
    where required_question.template_id = target_template.id
      and required_question.required
      and required_question.deleted_at is null
      and not exists (
        select 1
        from jsonb_array_elements(p_answers) answer
        where nullif(answer ->> 'question_public_id', '')::uuid = required_question.public_id
          and (
            nullif(answer ->> 'selection', '') in ('yes', 'no', 'unknown')
            or nullif(btrim(answer ->> 'answer_text'), '') is not null
          )
      )
  ) then
    raise exception 'required_anamnesis_answer_missing' using errcode = '23514';
  end if;

  insert into public.patient_anamneses (
    clinic_id, patient_id, template_id, template_version,
    answered_by_patient, answered_by_profile_id, completed_at
  ) values (
    target_patient.clinic_id, target_patient.id, target_template.id, target_template.version,
    p_answered_by_patient, actor_id, now()
  ) returning id, public_id into created_anamnesis_id, created_public_id;

  insert into public.anamnesis_answers (
    clinic_id, patient_anamnesis_id, question_id, question_snapshot,
    selection, answer_text, answered_by_patient
  )
  select
    target_patient.clinic_id,
    created_anamnesis_id,
    question.id,
    question.prompt,
    nullif(answer ->> 'selection', '')::public.anamnesis_answer_selection,
    nullif(btrim(answer ->> 'answer_text'), ''),
    p_answered_by_patient
  from jsonb_array_elements(p_answers) answer
  join public.anamnesis_questions question
    on question.public_id = nullif(answer ->> 'question_public_id', '')::uuid
   and question.template_id = target_template.id
   and question.deleted_at is null;

  return created_public_id;
end;
$$;

revoke all on function public.submit_patient_anamnesis(uuid, jsonb, boolean)
from public, anon;
grant execute on function public.submit_patient_anamnesis(uuid, jsonb, boolean)
to authenticated;

commit;
