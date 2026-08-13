-- Run this migration manually in the Supabase SQL Editor.
-- It is additive: no status rows or hallway history are removed.
begin;

alter table public.student_status add column if not exists destination text;
alter table public.hallway_events add column if not exists destination text;

-- Give any pass that was already open when this migration ran a valid broad
-- category. Historical closed rows remain NULL rather than inventing a reason.
update public.student_status
set destination = 'OTHER'
where status = 'OUT' and destination is null;

alter table public.student_status drop constraint if exists student_status_destination_valid;
alter table public.student_status add constraint student_status_destination_valid check (
  (status = 'IN' and destination is null)
  or
  (status = 'OUT' and destination in ('RESTROOM','NURSE','FRONT_OFFICE','SERVICES','WATER','ADMINISTRATOR','OTHER'))
);

alter table public.hallway_events drop constraint if exists hallway_events_destination_valid;
alter table public.hallway_events add constraint hallway_events_destination_valid check (
  destination is null or destination in ('RESTROOM','NURSE','FRONT_OFFICE','SERVICES','WATER','ADMINISTRATOR','OTHER')
);

-- Remove prior overloads so PostgREST exposes one unambiguous RPC signature.
do $migration$
declare function_signature text;
begin
  for function_signature in
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'set_student_hallway_status'
  loop
    execute 'drop function ' || function_signature;
  end loop;
end
$migration$;

create function public.set_student_hallway_status(
  p_student_id text,
  p_status text,
  p_student_name text,
  p_grade text,
  p_section text default null,
  p_destination text default null
) returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_now timestamptz := clock_timestamp();
  v_current_status text;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;
  if p_status not in ('IN', 'OUT') then
    raise exception 'Invalid hallway status';
  end if;
  if p_status = 'OUT' and p_destination not in ('RESTROOM','NURSE','FRONT_OFFICE','SERVICES','WATER','ADMINISTRATOR','OTHER') then
    raise exception 'A valid destination is required when marking a student OUT';
  end if;
  if p_status = 'IN' and p_destination is not null then
    raise exception 'Destination must be NULL when marking a student IN';
  end if;

  -- A transaction-scoped lock serializes updates even before a student's first
  -- student_status row exists. The existing partial unique index remains a
  -- second layer of one-open-event protection.
  perform pg_advisory_xact_lock(hashtextextended(p_student_id, 0));
  select status into v_current_status
  from public.student_status
  where student_id = p_student_id
  for update;

  if p_status = 'OUT' then
    if v_current_status = 'OUT' then
      return;
    end if;
    insert into public.hallway_events
      (student_id, student_name, grade, section, destination, out_at)
    values
      (p_student_id, p_student_name, p_grade, p_section, p_destination, v_now);

    insert into public.student_status
      (student_id, student_name, grade, section, status, destination, out_at, updated_at)
    values
      (p_student_id, p_student_name, p_grade, p_section, 'OUT', p_destination, v_now, v_now)
    on conflict (student_id) do update set
      student_name = excluded.student_name,
      grade = excluded.grade,
      section = excluded.section,
      status = 'OUT',
      destination = excluded.destination,
      out_at = excluded.out_at,
      updated_at = excluded.updated_at;
  else
    if coalesce(v_current_status, 'IN') = 'IN' then
      return;
    end if;
    update public.hallway_events
    set in_at = v_now,
        duration_seconds = greatest(0, floor(extract(epoch from (v_now - out_at)))::integer)
    where student_id = p_student_id and in_at is null;
    if not found then
      raise exception 'No open hallway event exists';
    end if;

    update public.student_status
    set student_name = p_student_name,
        grade = p_grade,
        section = p_section,
        status = 'IN',
        destination = null,
        out_at = null,
        updated_at = v_now
    where student_id = p_student_id;
  end if;
end
$function$;

revoke all on function public.set_student_hallway_status(text,text,text,text,text,text) from public;
grant execute on function public.set_student_hallway_status(text,text,text,text,text,text) to authenticated;

commit;
