create extension if not exists pgcrypto;
create type public.staff_role as enum ('STAFF','ADMIN');
create type public.student_presence as enum ('IN','OUT');
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, role public.staff_role not null default 'STAFF', created_at timestamptz not null default now());
create table public.students (id uuid primary key default gen_random_uuid(), first_name text not null check(length(trim(first_name))>0), last_name text not null check(length(trim(last_name))>0), grade text not null check(grade in ('PK','K','1','2','3','4','5','6','7','8','9','10','11','12')), section text not null default '', active boolean not null default true, created_at timestamptz not null default now());
create table public.student_status (student_id uuid primary key references public.students(id) on delete restrict, status public.student_presence not null default 'IN', out_since timestamptz, updated_at timestamptz not null default now(), updated_by uuid references auth.users(id), constraint status_timestamp_consistent check ((status='IN' and out_since is null) or (status='OUT' and out_since is not null)));
create table public.bathroom_visits (id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete restrict, out_at timestamptz not null, in_at timestamptz, duration_minutes integer check(duration_minutes>=0), marked_out_by uuid not null references auth.users(id), marked_in_by uuid references auth.users(id), created_at timestamptz not null default now(), constraint visit_close_consistent check ((in_at is null and duration_minutes is null and marked_in_by is null) or (in_at is not null and duration_minutes is not null and marked_in_by is not null)), constraint return_after_out check(in_at is null or in_at>=out_at));
create unique index bathroom_visits_one_open_per_student on public.bathroom_visits(student_id) where in_at is null;
create index students_active_grade_section_name on public.students(active,grade,section,last_name,first_name);
create index bathroom_visits_student_out_at on public.bathroom_visits(student_id,out_at desc);
create index bathroom_visits_out_at on public.bathroom_visits(out_at desc);
create index student_status_currently_out on public.student_status(out_since) where status='OUT';
create function public.initialize_student_status() returns trigger language plpgsql security definer set search_path=public as $$begin insert into public.student_status(student_id) values(new.id);return new;end$$;
create trigger initialize_status after insert on public.students for each row execute function public.initialize_student_status();
create function public.current_user_role() returns public.staff_role language sql stable security definer set search_path=public as $$select role from public.profiles where id=auth.uid()$$;
revoke all on function public.current_user_role() from public;grant execute on function public.current_user_role() to authenticated;
create function public.set_student_bathroom_status(p_student_id uuid,p_status public.student_presence) returns public.student_status language plpgsql security definer set search_path=public as $$
declare v_now timestamptz:=clock_timestamp();v_current public.student_status;v_result public.student_status;
begin
 if auth.uid() is null or public.current_user_role() is null then raise exception 'Unauthorized';end if;
 perform 1 from public.students where id=p_student_id and active for update;if not found then raise exception 'Student not found or inactive';end if;
 select * into v_current from public.student_status where student_id=p_student_id for update;
 if v_current.status=p_status then return v_current;end if;
 if p_status='OUT' then
  insert into public.bathroom_visits(student_id,out_at,marked_out_by) values(p_student_id,v_now,auth.uid());
  update public.student_status set status='OUT',out_since=v_now,updated_at=v_now,updated_by=auth.uid() where student_id=p_student_id returning * into v_result;
 else
  update public.bathroom_visits set in_at=v_now,duration_minutes=greatest(0,floor(extract(epoch from(v_now-out_at))/60)::integer),marked_in_by=auth.uid() where student_id=p_student_id and in_at is null;
  if not found then raise exception 'No open visit exists';end if;
  update public.student_status set status='IN',out_since=null,updated_at=v_now,updated_by=auth.uid() where student_id=p_student_id returning * into v_result;
 end if;return v_result;
end$$;
revoke all on function public.set_student_bathroom_status(uuid,public.student_presence) from public;grant execute on function public.set_student_bathroom_status(uuid,public.student_presence) to authenticated;
alter table public.profiles enable row level security;alter table public.students enable row level security;alter table public.student_status enable row level security;alter table public.bathroom_visits enable row level security;
create policy "staff read own profile" on public.profiles for select to authenticated using(id=auth.uid());
create policy "authorized staff read students" on public.students for select to authenticated using(public.current_user_role() is not null);
create policy "admins insert students" on public.students for insert to authenticated with check(public.current_user_role()='ADMIN');
create policy "admins update students" on public.students for update to authenticated using(public.current_user_role()='ADMIN') with check(public.current_user_role()='ADMIN');
create policy "authorized staff read status" on public.student_status for select to authenticated using(public.current_user_role() is not null);
create policy "admins read visits" on public.bathroom_visits for select to authenticated using(public.current_user_role()='ADMIN');
-- Status and visit mutations are available only through the atomic security-definer RPC.
alter publication supabase_realtime add table public.student_status;
