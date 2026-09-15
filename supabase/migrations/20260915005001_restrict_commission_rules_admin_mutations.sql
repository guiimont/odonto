drop policy if exists commission_rules_finance_insert on public.commission_rules;
drop policy if exists commission_rules_finance_update on public.commission_rules;

create policy commission_rules_admin_insert
on public.commission_rules
for insert
to authenticated
with check (
  (select private.has_clinic_role(
    clinic_id,
    array['owner', 'admin']::public.clinic_role[]
  ))
);

create policy commission_rules_admin_update
on public.commission_rules
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
