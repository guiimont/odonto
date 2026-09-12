create schema if not exists extensions;
alter extension pg_trgm set schema extensions;
alter extension citext set schema extensions;

drop policy if exists profiles_self_select on public.profiles;
drop policy if exists profiles_clinic_colleague_select on public.profiles;
create policy profiles_visible_to_self_or_colleague
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.shares_active_clinic(id))
);

do $$
declare
  fk record;
begin
  for fk in
    select
      c.conrelid::regclass as table_name,
      c.conname,
      string_agg(quote_ident(a.attname), ', ' order by cols.ordinality) as column_list
    from pg_constraint c
    cross join lateral unnest(c.conkey) with ordinality as cols(attnum, ordinality)
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = cols.attnum
    join pg_namespace n on n.oid = c.connamespace
    where c.contype = 'f'
      and n.nspname = 'public'
      and not exists (
        select 1
        from pg_index i
        where i.indrelid = c.conrelid
          and i.indisvalid
          and (
            string_to_array(trim(i.indkey::text), ' ')::smallint[]
          )[1:cardinality(c.conkey)] = c.conkey
      )
    group by c.conrelid, c.conname
  loop
    execute format(
      'create index if not exists %I on %s (%s)',
      left('fkidx_' || fk.conname, 63),
      fk.table_name,
      fk.column_list
    );
  end loop;
end
$$;
