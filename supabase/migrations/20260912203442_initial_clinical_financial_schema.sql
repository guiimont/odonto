-- Novo SaaS odontologico - schema consolidado da auditoria Codental
-- PostgreSQL 15+ / Supabase
-- Valores monetarios sao NUMERIC(14,2); timestamps sao TIMESTAMPTZ.
-- IDs internos sequenciais favorecem indices; public_id evita expor sequencias.

begin;

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists citext;

create schema if not exists private;
create schema if not exists audit;
revoke all on schema private from public, anon, authenticated;
revoke all on schema audit from public, anon, authenticated;

create type public.clinic_role as enum
  ('owner', 'admin', 'dentist', 'assistant', 'secretary', 'financial', 'auditor');
create type public.membership_status as enum ('invited', 'active', 'suspended', 'revoked');
create type public.appointment_status as enum
  ('scheduled', 'confirmed', 'waiting_room', 'in_service', 'completed', 'no_show', 'cancelled');
create type public.reminder_preference as enum ('whatsapp', 'sms', 'email', 'none');
create type public.anamnesis_answer_selection as enum ('yes', 'no', 'unknown');
create type public.budget_status as enum ('draft', 'pending', 'partially_approved', 'approved', 'cancelled');
create type public.discount_type as enum ('fixed_amount', 'percentage');
create type public.tooth_set as enum ('permanent', 'deciduous');
create type public.odontogram_region as enum ('tooth', 'upper_arch', 'lower_arch', 'full_mouth');
create type public.odontogram_surface as enum
  ('mesial', 'occlusal_incisal', 'distal', 'vestibular', 'lingual_palatal', 'cervical', 'all');
create type public.clinical_procedure_status as enum ('planned', 'in_progress', 'completed', 'cancelled');
create type public.odontogram_entry_kind as enum ('diagnosis', 'condition', 'planned_procedure', 'executed_procedure');
create type public.evolution_status as enum ('draft', 'final', 'signed', 'voided');
create type public.transaction_direction as enum ('income', 'expense');
create type public.transaction_status as enum ('draft', 'open', 'partially_paid', 'paid', 'cancelled', 'reversed');
create type public.installment_status as enum
  ('open', 'partially_paid', 'paid', 'awaiting_settlement', 'settled', 'cancelled', 'reversed');
create type public.payment_method_kind as enum
  ('cash', 'credit_card', 'debit_card', 'boleto', 'check', 'pix', 'ted', 'other');
create type public.payment_status as enum
  ('pending', 'captured', 'awaiting_settlement', 'settled', 'cancelled', 'reversed', 'refunded', 'failed');
create type public.commission_trigger as enum ('treatment_completed', 'installment_paid');
create type public.commission_calculation as enum ('percentage', 'fixed_amount');
create type public.commission_basis as enum
  ('procedure_gross', 'procedure_net_after_discount', 'installment_gross', 'payment_net');
create type public.commission_status as enum ('open', 'approved', 'paid', 'cancelled', 'reversed');

create table public.clinics (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  legal_name text,
  trade_name text not null,
  document_digits text,
  phone_e164 text,
  email citext,
  timezone text not null default 'America/Sao_Paulo',
  currency char(3) not null default 'BRL',
  source_system text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint clinics_document_digits_chk check (
    document_digits is null or document_digits ~ '^[0-9]{11,14}$'
  ),
  constraint clinics_phone_e164_chk check (
    phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
  ),
  unique (source_system, legacy_id)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null,
  email citext,
  phone_e164 text,
  avatar_path text,
  cro_number text,
  cro_state char(2),
  specialty text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint profiles_phone_e164_chk check (
    phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
  )
);

create table public.clinic_memberships (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null references public.clinics(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  role public.clinic_role not null,
  status public.membership_status not null default 'invited',
  source_system text,
  legacy_id text,
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, profile_id),
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id)
);

create table public.dental_plans (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null references public.clinics(id) on delete restrict,
  name text not null,
  is_private_pay boolean not null default false,
  active boolean not null default true,
  source_system text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id)
);

create table public.chairs (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null references public.clinics(id) on delete restrict,
  name text not null,
  active boolean not null default true,
  source_system text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id)
);

create table public.patients (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null references public.clinics(id) on delete restrict,
  code text,
  full_name text not null,
  social_name text,
  birth_date date,
  gender text,
  cpf_digits text,
  phone_e164 text,
  whatsapp_e164 text,
  email citext,
  reminder_preference public.reminder_preference,
  address_line1 text,
  address_line2 text,
  neighborhood text,
  city text,
  state char(2),
  postal_code_digits text,
  dental_plan_id bigint,
  emergency_contact_name text,
  emergency_contact_phone_e164 text,
  notes text,
  source_system text,
  legacy_id text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, dental_plan_id)
    references public.dental_plans(clinic_id, id) on delete restrict,
  constraint patients_cpf_digits_chk check (cpf_digits is null or cpf_digits ~ '^[0-9]{11}$'),
  constraint patients_phone_e164_chk check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  constraint patients_whatsapp_e164_chk check (whatsapp_e164 is null or whatsapp_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  constraint patients_postal_code_chk check (postal_code_digits is null or postal_code_digits ~ '^[0-9]{8}$')
);

create table public.patient_medical_alerts (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  patient_id bigint not null,
  alert_type text not null,
  description text not null,
  severity text not null default 'warning',
  active boolean not null default true,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete restrict,
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

create table public.anamnesis_templates (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null references public.clinics(id) on delete restrict,
  name text not null,
  version integer not null default 1 check (version > 0),
  active boolean not null default true,
  source_system text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id)
);

create table public.anamnesis_questions (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  template_id bigint not null,
  position integer not null check (position >= 0),
  prompt text not null,
  allows_selection boolean not null default true,
  allows_free_text boolean not null default true,
  required boolean not null default false,
  source_system text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (template_id, position),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, template_id)
    references public.anamnesis_templates(clinic_id, id) on delete restrict
);

create table public.patient_anamneses (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  patient_id bigint not null,
  template_id bigint not null,
  template_version integer not null,
  answered_by_patient boolean not null default false,
  answered_by_profile_id uuid references public.profiles(id) on delete restrict,
  completed_at timestamptz,
  signed_at timestamptz,
  source_system text,
  legacy_id text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, patient_id)
    references public.patients(clinic_id, id) on delete restrict,
  foreign key (clinic_id, template_id)
    references public.anamnesis_templates(clinic_id, id) on delete restrict
);

create table public.anamnesis_answers (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  patient_anamnesis_id bigint not null,
  question_id bigint not null,
  question_snapshot text not null,
  selection public.anamnesis_answer_selection,
  answer_text text,
  answered_by_patient boolean not null default false,
  source_system text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (patient_anamnesis_id, question_id),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, patient_anamnesis_id)
    references public.patient_anamneses(clinic_id, id) on delete restrict,
  foreign key (clinic_id, question_id)
    references public.anamnesis_questions(clinic_id, id) on delete restrict,
  constraint anamnesis_answers_has_value_chk check (selection is not null or nullif(btrim(answer_text), '') is not null)
);

create table public.appointments (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  patient_id bigint not null,
  professional_profile_id uuid not null references public.profiles(id) on delete restrict,
  chair_id bigint,
  dental_plan_id bigint,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_minutes integer generated always as ((extract(epoch from (ends_at - starts_at)) / 60)::integer) stored,
  status public.appointment_status not null default 'scheduled',
  first_appointment boolean not null default false,
  reminder_sent_at timestamptz,
  observations text,
  source_system text,
  legacy_id text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, patient_id) references public.patients(clinic_id, id) on delete restrict,
  foreign key (clinic_id, chair_id) references public.chairs(clinic_id, id) on delete restrict,
  foreign key (clinic_id, dental_plan_id) references public.dental_plans(clinic_id, id) on delete restrict,
  constraint appointments_interval_chk check (ends_at > starts_at)
);

create table public.treatments_catalog (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null references public.clinics(id) on delete restrict,
  dental_plan_id bigint,
  code text,
  name text not null,
  category text,
  description text,
  base_price numeric(14,2) not null default 0 check (base_price >= 0),
  cost_amount numeric(14,2) not null default 0 check (cost_amount >= 0),
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  segmented_by_tooth boolean not null default false,
  active boolean not null default true,
  source_system text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, dental_plan_id) references public.dental_plans(clinic_id, id) on delete restrict
);

create table public.budgets (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  patient_id bigint not null,
  description text not null,
  issued_at date not null default current_date,
  status public.budget_status not null default 'draft',
  discount_type public.discount_type not null default 'fixed_amount',
  discount_value numeric(14,4) not null default 0 check (discount_value >= 0),
  subtotal_amount numeric(14,2) not null default 0 check (subtotal_amount >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  currency char(3) not null default 'BRL',
  has_installments boolean not null default false,
  entry_amount numeric(14,2) not null default 0 check (entry_amount >= 0),
  remaining_installments_count integer not null default 0 check (remaining_installments_count >= 0),
  observations text,
  generate_contract boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete restrict,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id) on delete restrict,
  cancelled_reason text,
  original_budget_id bigint,
  legacy_reference text,
  source_system text,
  legacy_id text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, patient_id) references public.patients(clinic_id, id) on delete restrict,
  foreign key (clinic_id, original_budget_id) references public.budgets(clinic_id, id) on delete restrict,
  constraint budgets_percentage_chk check (
    discount_type <> 'percentage' or discount_value between 0 and 100
  ),
  constraint budgets_amount_equation_chk check (
    total_amount = round(subtotal_amount - discount_amount, 2)
    and discount_amount <= subtotal_amount
    and entry_amount <= total_amount
  ),
  constraint budgets_approval_state_chk check (
    (status in ('approved', 'partially_approved') and approved_at is not null)
    or (status not in ('approved', 'partially_approved'))
  ),
  constraint budgets_cancel_state_chk check (
    (status = 'cancelled' and cancelled_at is not null)
    or status <> 'cancelled'
  )
);

create table public.budget_items (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  budget_id bigint not null,
  treatment_catalog_id bigint,
  dental_plan_id bigint,
  professional_profile_id uuid references public.profiles(id) on delete restrict,
  position integer not null default 0 check (position >= 0),
  treatment_name_snapshot text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  gross_amount numeric(14,2) generated always as (round(quantity * unit_price, 2)) stored,
  allocated_discount_amount numeric(14,2) not null default 0 check (allocated_discount_amount >= 0),
  net_amount numeric(14,2) generated always as (round(quantity * unit_price, 2) - allocated_discount_amount) stored,
  multiply_price_by_tooth boolean not null default false,
  approved boolean not null default false,
  approved_at timestamptz,
  cancelled_at timestamptz,
  cancelled_reason text,
  source_system text,
  legacy_id text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (budget_id, position),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, budget_id) references public.budgets(clinic_id, id) on delete restrict,
  foreign key (clinic_id, treatment_catalog_id) references public.treatments_catalog(clinic_id, id) on delete restrict,
  foreign key (clinic_id, dental_plan_id) references public.dental_plans(clinic_id, id) on delete restrict,
  constraint budget_items_net_nonnegative_chk check (allocated_discount_amount <= round(quantity * unit_price, 2))
);

create table public.budget_item_targets (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  budget_item_id bigint not null,
  tooth_set public.tooth_set,
  region public.odontogram_region not null default 'tooth',
  tooth_code smallint,
  surfaces public.odontogram_surface[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique nulls not distinct (budget_item_id, region, tooth_code),
  foreign key (clinic_id, budget_item_id) references public.budget_items(clinic_id, id) on delete restrict,
  constraint budget_item_targets_fdi_chk check (
    (region = 'tooth' and tooth_code is not null and tooth_set is not null and (
      (tooth_set = 'permanent' and tooth_code::text ~ '^[1-4][1-8]$')
      or (tooth_set = 'deciduous' and tooth_code::text ~ '^[5-8][1-5]$')
    ))
    or (region <> 'tooth' and tooth_code is null)
  )
);

create table public.clinical_procedures (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  patient_id bigint not null,
  budget_item_id bigint,
  treatment_catalog_id bigint,
  dental_plan_id bigint,
  professional_profile_id uuid references public.profiles(id) on delete restrict,
  treatment_name_snapshot text not null,
  charged_amount numeric(14,2) not null default 0 check (charged_amount >= 0),
  status public.clinical_procedure_status not null default 'planned',
  planned_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_reason text,
  notes text,
  source_system text,
  legacy_id text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (budget_item_id),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, patient_id) references public.patients(clinic_id, id) on delete restrict,
  foreign key (clinic_id, budget_item_id) references public.budget_items(clinic_id, id) on delete restrict,
  foreign key (clinic_id, treatment_catalog_id) references public.treatments_catalog(clinic_id, id) on delete restrict,
  foreign key (clinic_id, dental_plan_id) references public.dental_plans(clinic_id, id) on delete restrict,
  constraint clinical_procedures_completed_chk check (
    (status = 'completed' and completed_at is not null) or status <> 'completed'
  ),
  constraint clinical_procedures_cancelled_chk check (
    (status = 'cancelled' and cancelled_at is not null) or status <> 'cancelled'
  )
);

create table public.odontogram_entries (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  patient_id bigint not null,
  clinical_procedure_id bigint,
  recorded_by uuid references public.profiles(id) on delete restrict,
  entry_kind public.odontogram_entry_kind not null,
  tooth_set public.tooth_set,
  region public.odontogram_region not null default 'tooth',
  tooth_code smallint,
  surfaces public.odontogram_surface[] not null default '{}',
  diagnosis_code text,
  description text not null,
  status public.clinical_procedure_status not null default 'planned',
  occurred_at timestamptz not null default now(),
  source_system text,
  legacy_id text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, patient_id) references public.patients(clinic_id, id) on delete restrict,
  foreign key (clinic_id, clinical_procedure_id) references public.clinical_procedures(clinic_id, id) on delete restrict,
  constraint odontogram_entries_fdi_chk check (
    (region = 'tooth' and tooth_code is not null and tooth_set is not null and (
      (tooth_set = 'permanent' and tooth_code::text ~ '^[1-4][1-8]$')
      or (tooth_set = 'deciduous' and tooth_code::text ~ '^[5-8][1-5]$')
    ))
    or (region <> 'tooth' and tooth_code is null)
  )
);

create table public.clinical_evolutions (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  patient_id bigint not null,
  professional_profile_id uuid not null references public.profiles(id) on delete restrict,
  status public.evolution_status not null default 'draft',
  description text not null,
  occurred_at timestamptz not null,
  is_automatic boolean not null default false,
  signed_at timestamptz,
  signed_by uuid references public.profiles(id) on delete restrict,
  signature_hash text,
  signature_provider text,
  voided_at timestamptz,
  voided_by uuid references public.profiles(id) on delete restrict,
  void_reason text,
  amendment_of_id bigint,
  source_system text,
  legacy_id text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, patient_id) references public.patients(clinic_id, id) on delete restrict,
  foreign key (clinic_id, amendment_of_id) references public.clinical_evolutions(clinic_id, id) on delete restrict,
  constraint clinical_evolutions_signed_chk check (
    (status = 'signed' and signed_at is not null and signed_by is not null and signature_hash is not null)
    or status <> 'signed'
  ),
  constraint clinical_evolutions_voided_chk check (
    (status = 'voided' and voided_at is not null and voided_by is not null and nullif(btrim(void_reason), '') is not null)
    or status <> 'voided'
  )
);

create table public.clinical_evolution_procedures (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  evolution_id bigint not null,
  clinical_procedure_id bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (evolution_id, clinical_procedure_id),
  foreign key (clinic_id, evolution_id) references public.clinical_evolutions(clinic_id, id) on delete restrict,
  foreign key (clinic_id, clinical_procedure_id) references public.clinical_procedures(clinic_id, id) on delete restrict
);

create table public.payment_methods (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null references public.clinics(id) on delete restrict,
  kind public.payment_method_kind not null,
  display_name text not null,
  provider_name text,
  active boolean not null default true,
  settlement_days integer not null default 0 check (settlement_days >= 0),
  source_system text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, display_name),
  unique (clinic_id, source_system, legacy_id)
);

create table public.payment_method_fees (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  payment_method_id bigint not null,
  installments_count integer not null default 1 check (installments_count > 0),
  fee_percentage numeric(7,4) not null default 0 check (fee_percentage between 0 and 100),
  fixed_fee_amount numeric(14,2) not null default 0 check (fixed_fee_amount >= 0),
  valid_from date not null,
  valid_until date,
  source_system text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (payment_method_id, installments_count, valid_from),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, payment_method_id) references public.payment_methods(clinic_id, id) on delete restrict,
  constraint payment_method_fees_validity_chk check (valid_until is null or valid_until >= valid_from)
);

create table public.financial_transactions (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  patient_id bigint,
  budget_id bigint,
  clinical_procedure_id bigint,
  direction public.transaction_direction not null,
  status public.transaction_status not null default 'open',
  description text not null,
  gross_amount numeric(14,2) not null check (gross_amount >= 0),
  currency char(3) not null default 'BRL',
  occurred_at timestamptz not null default now(),
  category text,
  observations text,
  source_system text,
  legacy_id text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, patient_id) references public.patients(clinic_id, id) on delete restrict,
  foreign key (clinic_id, budget_id) references public.budgets(clinic_id, id) on delete restrict,
  foreign key (clinic_id, clinical_procedure_id) references public.clinical_procedures(clinic_id, id) on delete restrict
);

create table public.installments (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  transaction_id bigint not null,
  patient_id bigint,
  budget_id bigint,
  sequence_number integer not null check (sequence_number > 0),
  total_installments integer not null check (total_installments > 0),
  is_entry boolean not null default false,
  due_date date not null,
  amount numeric(14,2) not null check (amount >= 0),
  paid_amount numeric(14,2) not null default 0 check (paid_amount >= 0),
  settled_amount numeric(14,2) not null default 0 check (settled_amount >= 0),
  status public.installment_status not null default 'open',
  cancelled_at timestamptz,
  cancelled_reason text,
  source_system text,
  legacy_id text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (transaction_id, sequence_number),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, transaction_id) references public.financial_transactions(clinic_id, id) on delete restrict,
  foreign key (clinic_id, patient_id) references public.patients(clinic_id, id) on delete restrict,
  foreign key (clinic_id, budget_id) references public.budgets(clinic_id, id) on delete restrict,
  constraint installments_sequence_chk check (sequence_number <= total_installments),
  constraint installments_amounts_chk check (paid_amount <= amount and settled_amount <= paid_amount),
  constraint installments_cancelled_chk check (
    (status = 'cancelled' and cancelled_at is not null) or status <> 'cancelled'
  )
);

create table public.payment_settlements (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  installment_id bigint not null,
  payment_method_id bigint not null,
  payment_method_fee_id bigint,
  status public.payment_status not null default 'pending',
  provider_reference text,
  provider_name text,
  card_installments integer not null default 1 check (card_installments > 0),
  gross_amount numeric(14,2) not null check (gross_amount >= 0),
  fee_percentage numeric(7,4) not null default 0 check (fee_percentage between 0 and 100),
  fee_amount numeric(14,2) not null default 0 check (fee_amount >= 0),
  net_amount numeric(14,2) not null check (net_amount >= 0),
  paid_at timestamptz,
  expected_settlement_at timestamptz,
  settled_at timestamptz,
  receipt_issued_at timestamptz,
  receipt_reference text,
  observations text,
  source_system text,
  legacy_id text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, installment_id) references public.installments(clinic_id, id) on delete restrict,
  foreign key (clinic_id, payment_method_id) references public.payment_methods(clinic_id, id) on delete restrict,
  foreign key (clinic_id, payment_method_fee_id) references public.payment_method_fees(clinic_id, id) on delete restrict,
  constraint payment_settlements_equation_chk check (net_amount = round(gross_amount - fee_amount, 2)),
  constraint payment_settlements_paid_chk check (
    status in ('pending', 'failed') or paid_at is not null
  ),
  constraint payment_settlements_settled_chk check (
    status <> 'settled' or settled_at is not null
  )
);

create table public.payment_reversals (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  payment_settlement_id bigint not null,
  reversed_by uuid references public.profiles(id) on delete restrict,
  reversal_type public.payment_status not null,
  amount numeric(14,2) not null check (amount > 0),
  reason text not null,
  provider_reference text,
  occurred_at timestamptz not null default now(),
  source_system text,
  legacy_id text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, payment_settlement_id) references public.payment_settlements(clinic_id, id) on delete restrict,
  constraint payment_reversals_type_chk check (reversal_type in ('cancelled', 'reversed', 'refunded'))
);

create table public.commission_rules (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  professional_profile_id uuid not null references public.profiles(id) on delete restrict,
  trigger_event public.commission_trigger not null,
  calculation_type public.commission_calculation not null,
  calculation_basis public.commission_basis not null,
  value numeric(14,4) not null check (value > 0),
  dental_plan_id bigint,
  treatment_category text,
  treatment_catalog_id bigint,
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  active boolean not null default true,
  source_system text,
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, dental_plan_id) references public.dental_plans(clinic_id, id) on delete restrict,
  foreign key (clinic_id, treatment_catalog_id) references public.treatments_catalog(clinic_id, id) on delete restrict,
  constraint commission_rules_value_chk check (
    (calculation_type = 'percentage' and value <= 100)
    or calculation_type = 'fixed_amount'
  ),
  constraint commission_rules_fixed_scope_chk check (
    calculation_type <> 'fixed_amount' or treatment_catalog_id is not null
  ),
  constraint commission_rules_validity_chk check (effective_until is null or effective_until >= effective_from)
);

create table public.commissions (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  clinic_id bigint not null,
  professional_profile_id uuid not null references public.profiles(id) on delete restrict,
  commission_rule_id bigint,
  clinical_procedure_id bigint,
  installment_id bigint,
  payment_settlement_id bigint,
  status public.commission_status not null default 'open',
  trigger_event public.commission_trigger not null,
  calculation_type public.commission_calculation not null,
  calculation_basis public.commission_basis not null,
  basis_amount numeric(14,2) not null check (basis_amount >= 0),
  rule_value numeric(14,4) not null check (rule_value > 0),
  commission_amount numeric(14,2) not null check (commission_amount >= 0),
  accrued_at timestamptz not null,
  approved_at timestamptz,
  paid_at timestamptz,
  reversed_at timestamptz,
  reversal_reason text,
  source_system text,
  legacy_id text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, id),
  unique (clinic_id, source_system, legacy_id),
  foreign key (clinic_id, commission_rule_id) references public.commission_rules(clinic_id, id) on delete restrict,
  foreign key (clinic_id, clinical_procedure_id) references public.clinical_procedures(clinic_id, id) on delete restrict,
  foreign key (clinic_id, installment_id) references public.installments(clinic_id, id) on delete restrict,
  foreign key (clinic_id, payment_settlement_id) references public.payment_settlements(clinic_id, id) on delete restrict,
  constraint commissions_source_chk check (
    (trigger_event = 'treatment_completed' and clinical_procedure_id is not null)
    or (trigger_event = 'installment_paid' and installment_id is not null)
  ),
  constraint commissions_equation_chk check (
    commission_amount = case
      when calculation_type = 'percentage' then round(basis_amount * rule_value / 100, 2)
      else round(rule_value, 2)
    end
  )
);

create table public.legacy_id_map (
  id bigint generated always as identity primary key,
  clinic_id bigint not null references public.clinics(id) on delete restrict,
  source_system text not null,
  entity_type text not null,
  legacy_id text not null,
  target_table regclass not null,
  target_id text not null,
  payload_sha256 text not null,
  imported_at timestamptz not null default now(),
  import_run_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, source_system, entity_type, legacy_id)
);

create table audit.change_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  transaction_id bigint not null default txid_current(),
  actor_id uuid,
  clinic_id bigint,
  schema_name text not null,
  table_name text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  row_id text,
  old_data jsonb,
  new_data jsonb
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb;
  new_row jsonb;
  row_json jsonb;
  tenant_id bigint;
begin
  old_row := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  new_row := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  row_json := coalesce(new_row, old_row);
  tenant_id := nullif(row_json ->> 'clinic_id', '')::bigint;
  if tg_table_name = 'clinics' then
    tenant_id := nullif(row_json ->> 'id', '')::bigint;
  end if;

  insert into audit.change_log (
    actor_id, clinic_id, schema_name, table_name, operation, row_id, old_data, new_data
  ) values (
    auth.uid(), tenant_id, tg_table_schema, tg_table_name, tg_op,
    coalesce(row_json ->> 'id', row_json ->> 'public_id'), old_row, new_row
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function private.is_clinic_member(target_clinic_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.clinic_memberships membership
    where membership.clinic_id = target_clinic_id
      and membership.profile_id = (select auth.uid())
      and membership.status = 'active'
      and membership.deleted_at is null
  );
$$;

create or replace function private.shares_active_clinic(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.clinic_memberships mine
    join public.clinic_memberships colleague
      on colleague.clinic_id = mine.clinic_id
    where mine.profile_id = (select auth.uid())
      and colleague.profile_id = target_profile_id
      and mine.status = 'active'
      and colleague.status = 'active'
      and mine.deleted_at is null
      and colleague.deleted_at is null
  );
$$;

create or replace function private.has_clinic_role(
  target_clinic_id bigint,
  allowed_roles public.clinic_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.clinic_memberships membership
    where membership.clinic_id = target_clinic_id
      and membership.profile_id = (select auth.uid())
      and membership.status = 'active'
      and membership.deleted_at is null
      and membership.role = any(allowed_roles)
  );
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.audit_row_change() from public, anon, authenticated;
revoke all on function private.is_clinic_member(bigint) from public, anon;
revoke all on function private.has_clinic_role(bigint, public.clinic_role[]) from public, anon;
revoke all on function private.shares_active_clinic(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_clinic_member(bigint) to authenticated;
grant execute on function private.has_clinic_role(bigint, public.clinic_role[]) to authenticated;
grant execute on function private.shares_active_clinic(uuid) to authenticated;

create or replace function private.recalculate_budget(target_budget_id bigint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  subtotal numeric(14,2);
  discount numeric(14,2);
  budget_row public.budgets%rowtype;
begin
  select * into strict budget_row from public.budgets where id = target_budget_id for update;
  select coalesce(sum(item.gross_amount), 0)::numeric(14,2)
    into subtotal
  from public.budget_items item
  where item.budget_id = target_budget_id and item.deleted_at is null and item.cancelled_at is null;

  discount := case budget_row.discount_type
    when 'percentage' then round(subtotal * budget_row.discount_value / 100, 2)
    else least(round(budget_row.discount_value, 2), subtotal)
  end;

  update public.budgets
  set subtotal_amount = subtotal,
      discount_amount = discount,
      total_amount = round(subtotal - discount, 2)
  where id = target_budget_id;
end;
$$;

create or replace function private.calculate_budget_amounts()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.discount_amount := case new.discount_type
    when 'percentage' then round(new.subtotal_amount * new.discount_value / 100, 2)
    else least(round(new.discount_value, 2), new.subtotal_amount)
  end;
  new.total_amount := round(new.subtotal_amount - new.discount_amount, 2);
  return new;
end;
$$;

create or replace function private.budget_item_recalculate_trigger()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform private.recalculate_budget(coalesce(new.budget_id, old.budget_id));
  if tg_op = 'UPDATE' and new.budget_id <> old.budget_id then
    perform private.recalculate_budget(old.budget_id);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function private.refresh_installment_totals(target_installment_id bigint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  paid numeric(14,2);
  settled numeric(14,2);
  installment_row public.installments%rowtype;
begin
  select * into strict installment_row
  from public.installments where id = target_installment_id for update;

  select
    coalesce(sum(greatest(s.gross_amount - coalesce(r.reversed_amount, 0), 0))
      filter (where s.status in ('captured', 'awaiting_settlement', 'settled', 'refunded')), 0),
    coalesce(sum(greatest(s.gross_amount - coalesce(r.reversed_amount, 0), 0))
      filter (where s.status = 'settled'), 0)
  into paid, settled
  from public.payment_settlements s
  left join lateral (
    select sum(reversal.amount)::numeric(14,2) as reversed_amount
    from public.payment_reversals reversal
    where reversal.payment_settlement_id = s.id
      and reversal.deleted_at is null
  ) r on true
  where s.installment_id = target_installment_id and s.deleted_at is null;

  update public.installments
  set paid_amount = least(paid, amount),
      settled_amount = least(settled, paid, amount),
      status = case
        when status in ('cancelled', 'reversed') then status
        when paid = 0 then 'open'::public.installment_status
        when paid < amount then 'partially_paid'::public.installment_status
        when settled >= paid then 'settled'::public.installment_status
        when exists (
          select 1 from public.payment_settlements s
          where s.installment_id = target_installment_id and s.status = 'awaiting_settlement'
        ) then 'awaiting_settlement'::public.installment_status
        else 'paid'::public.installment_status
      end
  where id = target_installment_id;
end;
$$;

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

  select coalesce(sum(reversal.amount), 0) + new.amount
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

create or replace function private.payment_refresh_installment_trigger()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform private.refresh_installment_totals(coalesce(new.installment_id, old.installment_id));
  if tg_op = 'UPDATE' and new.installment_id <> old.installment_id then
    perform private.refresh_installment_totals(old.installment_id);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function private.protect_historical_row()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Physical deletion is forbidden for historical table %. Use cancellation, reversal or soft delete.', tg_table_name;
end;
$$;

create or replace function private.protect_signed_evolution()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'signed' and (
    new.description is distinct from old.description
    or new.occurred_at is distinct from old.occurred_at
    or new.patient_id is distinct from old.patient_id
    or new.professional_profile_id is distinct from old.professional_profile_id
    or new.is_automatic is distinct from old.is_automatic
    or new.signed_at is distinct from old.signed_at
    or new.signed_by is distinct from old.signed_by
    or new.signature_hash is distinct from old.signature_hash
    or new.signature_provider is distinct from old.signature_provider
    or new.amendment_of_id is distinct from old.amendment_of_id
  ) then
    raise exception 'Signed clinical evolution is immutable; create an amendment.';
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'clinics','profiles','clinic_memberships','dental_plans','chairs','patients',
    'patient_medical_alerts','anamnesis_templates','anamnesis_questions','patient_anamneses',
    'anamnesis_answers','appointments','treatments_catalog','budgets','budget_items',
    'budget_item_targets','clinical_procedures','odontogram_entries','clinical_evolutions',
    'clinical_evolution_procedures',
    'payment_methods','payment_method_fees','financial_transactions','installments',
    'payment_settlements','payment_reversals','commission_rules','commissions','legacy_id_map'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function private.set_updated_at()',
      table_name, table_name
    );
    execute format(
      'create trigger %I_audit after insert or update or delete on public.%I for each row execute function private.audit_row_change()',
      table_name, table_name
    );
  end loop;
end $$;

create trigger budget_items_recalculate
after insert or update or delete on public.budget_items
for each row execute function private.budget_item_recalculate_trigger();

create trigger budgets_calculate_amounts
before insert or update of discount_type, discount_value, subtotal_amount on public.budgets
for each row execute function private.calculate_budget_amounts();

create trigger payment_settlements_refresh_installment
after insert or update or delete on public.payment_settlements
for each row execute function private.payment_refresh_installment_trigger();

create trigger payment_reversals_apply
after insert on public.payment_reversals
for each row execute function private.apply_payment_reversal();

create trigger clinical_evolutions_protect_signed
before update on public.clinical_evolutions
for each row execute function private.protect_signed_evolution();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'patient_anamneses','anamnesis_answers','clinical_procedures','odontogram_entries',
    'clinical_evolutions','financial_transactions','installments','payment_settlements',
    'payment_reversals','commissions'
  ] loop
    execute format(
      'create trigger %I_no_physical_delete before delete on public.%I for each row execute function private.protect_historical_row()',
      table_name, table_name
    );
  end loop;
end $$;

-- Search, agenda, clinical timeline and financial hot paths.
create unique index patients_active_cpf_uidx on public.patients (clinic_id, cpf_digits)
  where cpf_digits is not null and deleted_at is null;
create index patients_active_phone_idx on public.patients (clinic_id, phone_e164)
  where phone_e164 is not null and deleted_at is null;
create index patients_active_name_trgm_idx on public.patients using gin (full_name gin_trgm_ops)
  where deleted_at is null;
create index appointments_clinic_start_idx on public.appointments (clinic_id, starts_at)
  where deleted_at is null;
create index appointments_professional_start_idx on public.appointments (professional_profile_id, starts_at)
  where deleted_at is null;
create index appointments_patient_start_idx on public.appointments (patient_id, starts_at desc)
  where deleted_at is null;
create index appointments_chair_start_idx on public.appointments (chair_id, starts_at)
  where chair_id is not null and deleted_at is null;
create index anamnesis_patient_idx on public.patient_anamneses (patient_id, completed_at desc)
  where deleted_at is null;
create index budget_patient_issued_idx on public.budgets (patient_id, issued_at desc)
  where deleted_at is null;
create index budget_status_idx on public.budgets (clinic_id, status, issued_at desc)
  where deleted_at is null;
create index budget_items_budget_idx on public.budget_items (budget_id) where deleted_at is null;
create index budget_item_targets_item_idx on public.budget_item_targets (budget_item_id) where deleted_at is null;
create index budget_item_targets_tooth_idx on public.budget_item_targets (clinic_id, tooth_code)
  where tooth_code is not null and deleted_at is null;
create index procedures_patient_status_idx on public.clinical_procedures (patient_id, status, created_at desc)
  where deleted_at is null;
create index odontogram_patient_tooth_idx on public.odontogram_entries (patient_id, tooth_set, tooth_code, occurred_at desc)
  where deleted_at is null;
create index odontogram_surfaces_gin_idx on public.odontogram_entries using gin (surfaces)
  where deleted_at is null;
create index evolutions_patient_occurred_idx on public.clinical_evolutions (patient_id, occurred_at desc)
  where deleted_at is null;
create index transactions_clinic_occurred_idx on public.financial_transactions (clinic_id, occurred_at desc)
  where deleted_at is null;
create index transactions_patient_idx on public.financial_transactions (patient_id, occurred_at desc)
  where patient_id is not null and deleted_at is null;
create index installments_due_open_idx on public.installments (clinic_id, due_date)
  where status in ('open', 'partially_paid') and deleted_at is null;
create index installments_patient_due_idx on public.installments (patient_id, due_date desc)
  where patient_id is not null and deleted_at is null;
create index settlements_paid_idx on public.payment_settlements (clinic_id, paid_at desc)
  where paid_at is not null and deleted_at is null;
create index settlements_expected_idx on public.payment_settlements (clinic_id, expected_settlement_at)
  where status = 'awaiting_settlement' and deleted_at is null;
create index commission_rules_professional_idx on public.commission_rules (professional_profile_id, effective_from desc)
  where active and deleted_at is null;
create index commissions_professional_status_idx on public.commissions (professional_profile_id, status, accrued_at desc)
  where deleted_at is null;
create index memberships_profile_idx on public.clinic_memberships (profile_id, clinic_id)
  where status = 'active' and deleted_at is null;
create index legacy_map_lookup_idx on public.legacy_id_map (source_system, entity_type, legacy_id);
create index audit_change_log_clinic_time_idx on audit.change_log (clinic_id, occurred_at desc);
create index audit_change_log_row_idx on audit.change_log (table_name, row_id, occurred_at desc);

create or replace view public.patient_ledger
with (security_invoker = true)
as
select
  ft.clinic_id,
  ft.patient_id,
  ft.id as transaction_id,
  installment.id as installment_id,
  ft.description,
  installment.sequence_number,
  installment.total_installments,
  installment.is_entry,
  installment.due_date,
  installment.amount as gross_amount,
  installment.paid_amount,
  installment.settled_amount,
  case
    when installment.status in ('open', 'partially_paid') and installment.due_date < current_date then 'overdue'
    else installment.status::text
  end as display_status,
  settlement.id as payment_settlement_id,
  method.kind as payment_method,
  method.display_name as payment_method_name,
  settlement.provider_name,
  settlement.fee_percentage,
  settlement.fee_amount,
  settlement.net_amount,
  settlement.paid_at,
  settlement.expected_settlement_at,
  settlement.settled_at,
  settlement.receipt_issued_at
from public.financial_transactions ft
join public.installments installment
  on installment.clinic_id = ft.clinic_id
 and installment.transaction_id = ft.id
 and installment.deleted_at is null
left join public.payment_settlements settlement
  on settlement.clinic_id = installment.clinic_id
 and settlement.installment_id = installment.id
 and settlement.deleted_at is null
left join public.payment_methods method
  on method.clinic_id = settlement.clinic_id
 and method.id = settlement.payment_method_id
where ft.deleted_at is null;

-- RLS: no anonymous access. Members read their clinic; authorized roles write.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'clinic_memberships','dental_plans','chairs','patients','patient_medical_alerts',
    'anamnesis_templates','anamnesis_questions','patient_anamneses','anamnesis_answers',
    'appointments','treatments_catalog','budgets','budget_items','budget_item_targets',
    'clinical_procedures','odontogram_entries','clinical_evolutions','clinical_evolution_procedures',
    'payment_methods','payment_method_fees','financial_transactions','installments',
    'payment_settlements','payment_reversals','commission_rules','commissions','legacy_id_map'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update on table public.%I to authenticated', table_name);
    execute format(
      'create policy %I_member_select on public.%I for select to authenticated using ((select private.is_clinic_member(clinic_id)))',
      table_name, table_name
    );
    execute format(
      'create policy %I_staff_insert on public.%I for insert to authenticated with check ((select private.has_clinic_role(clinic_id, array[''owner'',''admin'',''dentist'',''assistant'',''secretary'',''financial'']::public.clinic_role[])))',
      table_name, table_name
    );
    execute format(
      'create policy %I_staff_update on public.%I for update to authenticated using ((select private.has_clinic_role(clinic_id, array[''owner'',''admin'',''dentist'',''assistant'',''secretary'',''financial'']::public.clinic_role[]))) with check ((select private.has_clinic_role(clinic_id, array[''owner'',''admin'',''dentist'',''assistant'',''secretary'',''financial'']::public.clinic_role[])))',
      table_name, table_name
    );
  end loop;
end $$;

-- Membership changes are privileged BFF operations. Browser sessions can only read them.
drop policy clinic_memberships_staff_insert on public.clinic_memberships;
drop policy clinic_memberships_staff_update on public.clinic_memberships;
revoke insert, update on public.clinic_memberships from authenticated;

-- Clinical records exclude secretary/financial roles from direct browser writes.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'patient_medical_alerts','anamnesis_templates','anamnesis_questions',
    'patient_anamneses','anamnesis_answers','clinical_procedures',
    'odontogram_entries','clinical_evolutions','clinical_evolution_procedures'
  ] loop
    execute format('drop policy %I_staff_insert on public.%I', table_name, table_name);
    execute format('drop policy %I_staff_update on public.%I', table_name, table_name);
    execute format(
      'create policy %I_clinical_insert on public.%I for insert to authenticated with check ((select private.has_clinic_role(clinic_id, array[''owner'',''admin'',''dentist'',''assistant'']::public.clinic_role[])))',
      table_name, table_name
    );
    execute format(
      'create policy %I_clinical_update on public.%I for update to authenticated using ((select private.has_clinic_role(clinic_id, array[''owner'',''admin'',''dentist'',''assistant'']::public.clinic_role[]))) with check ((select private.has_clinic_role(clinic_id, array[''owner'',''admin'',''dentist'',''assistant'']::public.clinic_role[])))',
      table_name, table_name
    );
  end loop;
end $$;

alter table public.clinics enable row level security;
revoke all on table public.clinics from anon, authenticated;
grant select, update on table public.clinics to authenticated;
create policy clinics_member_select on public.clinics for select to authenticated
  using ((select private.is_clinic_member(id)));
create policy clinics_admin_update on public.clinics for update to authenticated
  using ((select private.has_clinic_role(id, array['owner','admin']::public.clinic_role[])))
  with check ((select private.has_clinic_role(id, array['owner','admin']::public.clinic_role[])));

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;
grant select, update on table public.profiles to authenticated;
create policy profiles_self_select on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_clinic_colleague_select on public.profiles for select to authenticated
  using ((select private.shares_active_clinic(id)));
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Replace the overly broad clinic INSERT/UPDATE policies for financially sensitive tables.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'payment_methods','payment_method_fees','financial_transactions','installments',
    'payment_settlements','payment_reversals','commission_rules','commissions'
  ] loop
    execute format('drop policy %I_staff_insert on public.%I', table_name, table_name);
    execute format('drop policy %I_staff_update on public.%I', table_name, table_name);
    execute format(
      'create policy %I_finance_insert on public.%I for insert to authenticated with check ((select private.has_clinic_role(clinic_id, array[''owner'',''admin'',''financial'',''secretary'']::public.clinic_role[])))',
      table_name, table_name
    );
    execute format(
      'create policy %I_finance_update on public.%I for update to authenticated using ((select private.has_clinic_role(clinic_id, array[''owner'',''admin'',''financial'',''secretary'']::public.clinic_role[]))) with check ((select private.has_clinic_role(clinic_id, array[''owner'',''admin'',''financial'',''secretary'']::public.clinic_role[])))',
      table_name, table_name
    );
  end loop;
end $$;

-- Reversals are append-only. Corrections require a compensating event.
drop policy payment_reversals_finance_update on public.payment_reversals;
revoke update on public.payment_reversals from authenticated;

-- Profiles are provisioned by a trusted auth hook/server action, not by the browser.
-- The service_role bypasses RLS; never expose it to the Next.js client.
grant select on public.patient_ledger to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on audit.change_log from public, anon, authenticated;

commit;
