begin;

drop index if exists public.patient_files_patient_created_idx;

create index patient_files_clinic_patient_created_idx
  on public.patient_files (clinic_id, patient_id, created_at desc)
  where deleted_at is null;

create index patient_files_uploaded_by_idx
  on public.patient_files (uploaded_by);

create index clinic_invitations_accepted_by_idx
  on private.clinic_invitations (accepted_by)
  where accepted_by is not null;

create index clinic_invitations_created_by_idx
  on private.clinic_invitations (created_by)
  where created_by is not null;

commit;
