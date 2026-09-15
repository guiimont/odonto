drop policy if exists treatments_catalog_staff_insert on public.treatments_catalog;
drop policy if exists treatments_catalog_staff_update on public.treatments_catalog;

create policy treatments_catalog_admin_insert
on public.treatments_catalog
for insert
to authenticated
with check (
  (select private.has_clinic_role(
    clinic_id,
    array['owner', 'admin']::public.clinic_role[]
  ))
);

create policy treatments_catalog_admin_update
on public.treatments_catalog
for update
to authenticated
using (
  (select private.has_clinic_role(
    clinic_id,
    array['owner', 'admin']::public.clinic_role[]
  ))
)
with check (
  (select private.has_clinic_role(
    clinic_id,
    array['owner', 'admin']::public.clinic_role[]
  ))
);
