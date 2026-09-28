-- Roles
create type public.app_role as enum ('gestor', 'funcionario');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  cargo text default '',
  jornada_minutos int not null default 528, -- 8h48
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "perfil proprio select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'gestor'));
create policy "perfil proprio insert" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "perfil proprio update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'gestor'))
  with check (id = auth.uid() or public.has_role(auth.uid(), 'gestor'));

create policy "roles proprios select" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'gestor'));

-- primeiro usuario vira gestor, demais funcionarios
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email);

  if not exists (select 1 from public.user_roles where role = 'gestor') then
    insert into public.user_roles (user_id, role) values (new.id, 'gestor');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'funcionario');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Marcacao de ponto
create type public.punch_kind as enum ('entrada','saida_almoco','volta_almoco','saida');

create table public.time_punches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.punch_kind not null,
  punched_at timestamptz not null default now(),
  note text default '',
  adjusted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index on public.time_punches (user_id, punched_at desc);
grant select, insert, update, delete on public.time_punches to authenticated;
grant all on public.time_punches to service_role;
alter table public.time_punches enable row level security;

create policy "ponto select" on public.time_punches for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'gestor'));
create policy "ponto insert" on public.time_punches for insert to authenticated
  with check (user_id = auth.uid() or public.has_role(auth.uid(), 'gestor'));
create policy "ponto update" on public.time_punches for update to authenticated
  using (public.has_role(auth.uid(), 'gestor')) with check (public.has_role(auth.uid(), 'gestor'));
create policy "ponto delete" on public.time_punches for delete to authenticated
  using (public.has_role(auth.uid(), 'gestor'));

-- Rodizio
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text default '',
  status text not null default 'Ativo',
  created_at timestamptz not null default now()
);
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete set null,
  schedule_date date not null,
  start_time time not null,
  end_time time not null,
  kind text not null default 'Normal',
  created_at timestamptz not null default now()
);
create table public.on_call_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete set null,
  on_call_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete set null,
  ticket_number text not null,
  ticket_date date not null,
  started_at timestamptz,
  ended_at timestamptz,
  description text default '',
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.participants, public.schedules, public.on_call_periods, public.support_tickets to authenticated;
grant all on public.participants, public.schedules, public.on_call_periods, public.support_tickets to service_role;
alter table public.participants enable row level security;
alter table public.schedules enable row level security;
alter table public.on_call_periods enable row level security;
alter table public.support_tickets enable row level security;

create policy "participants rw" on public.participants for all to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'gestor'))
  with check (user_id = auth.uid() or public.has_role(auth.uid(),'gestor'));
create policy "schedules rw" on public.schedules for all to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'gestor'))
  with check (user_id = auth.uid() or public.has_role(auth.uid(),'gestor'));
create policy "oncall rw" on public.on_call_periods for all to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'gestor'))
  with check (user_id = auth.uid() or public.has_role(auth.uid(),'gestor'));
create policy "tickets rw" on public.support_tickets for all to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'gestor'))
  with check (user_id = auth.uid() or public.has_role(auth.uid(),'gestor'));