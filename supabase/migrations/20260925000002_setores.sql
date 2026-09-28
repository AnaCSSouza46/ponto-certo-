CREATE TABLE public.sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sectors TO authenticated;
GRANT ALL ON public.sectors TO service_role;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ADD COLUMN sector_id uuid REFERENCES public.sectors(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.can_manage(_manager uuid, _target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select public.has_role(_manager, 'admin')
    or (public.has_role(_manager, 'gestor') and exists (
      select 1 from public.profiles m join public.profiles t on t.sector_id = m.sector_id
      where m.id = _manager and t.id = _target and m.sector_id is not null))
$$;

CREATE POLICY "setores leitura" ON public.sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "setores admin" ON public.sectors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- profiles
DROP POLICY IF EXISTS "perfil proprio select" ON public.profiles;
DROP POLICY IF EXISTS "perfil proprio update" ON public.profiles;
CREATE POLICY "perfil proprio select" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.can_manage(auth.uid(), id));
CREATE POLICY "perfil proprio update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.can_manage(auth.uid(), id))
  WITH CHECK (id = auth.uid() OR public.can_manage(auth.uid(), id));

CREATE OR REPLACE FUNCTION public.protect_profile_sector()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if new.sector_id is distinct from old.sector_id
     and auth.uid() is not null and not public.has_role(auth.uid(), 'admin') then
    raise exception 'Apenas o administrador pode alterar o setor';
  end if;
  return new;
end $$;
CREATE TRIGGER profiles_protect_sector BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_sector();

-- roles
DROP POLICY IF EXISTS "roles proprios select" ON public.user_roles;
CREATE POLICY "roles proprios select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_manage(auth.uid(), user_id));

CREATE OR REPLACE FUNCTION public.set_user_role(_user uuid, _role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Apenas o administrador'; end if;
  if _role = 'admin' then raise exception 'Papel inválido'; end if;
  delete from public.user_roles where user_id = _user and role in ('gestor','funcionario');
  insert into public.user_roles (user_id, role) values (_user, _role);
end $$;
REVOKE ALL ON FUNCTION public.set_user_role(uuid, public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role) TO authenticated;

-- punches
DROP POLICY IF EXISTS "ponto select" ON public.time_punches;
DROP POLICY IF EXISTS "ponto insert" ON public.time_punches;
DROP POLICY IF EXISTS "ponto update" ON public.time_punches;
DROP POLICY IF EXISTS "ponto delete" ON public.time_punches;
CREATE POLICY "ponto select" ON public.time_punches FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_manage(auth.uid(), user_id));
CREATE POLICY "ponto insert" ON public.time_punches FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.can_manage(auth.uid(), user_id));
CREATE POLICY "ponto update" ON public.time_punches FOR UPDATE TO authenticated
  USING (public.can_manage(auth.uid(), user_id)) WITH CHECK (public.can_manage(auth.uid(), user_id));
CREATE POLICY "ponto delete" ON public.time_punches FOR DELETE TO authenticated
  USING (public.can_manage(auth.uid(), user_id));

-- rodizio
DROP POLICY IF EXISTS "participants rw" ON public.participants;
CREATE POLICY "participants rw" ON public.participants FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.can_manage(auth.uid(), user_id))
  WITH CHECK (user_id = auth.uid() OR public.can_manage(auth.uid(), user_id));
DROP POLICY IF EXISTS "schedules rw" ON public.schedules;
CREATE POLICY "schedules rw" ON public.schedules FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.can_manage(auth.uid(), user_id))
  WITH CHECK (user_id = auth.uid() OR public.can_manage(auth.uid(), user_id));
DROP POLICY IF EXISTS "oncall rw" ON public.on_call_periods;
CREATE POLICY "oncall rw" ON public.on_call_periods FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.can_manage(auth.uid(), user_id))
  WITH CHECK (user_id = auth.uid() OR public.can_manage(auth.uid(), user_id));
DROP POLICY IF EXISTS "tickets rw" ON public.support_tickets;
CREATE POLICY "tickets rw" ON public.support_tickets FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.can_manage(auth.uid(), user_id))
  WITH CHECK (user_id = auth.uid() OR public.can_manage(auth.uid(), user_id));

-- first user = admin + gestor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email);
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin'), (new.id, 'gestor');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'funcionario');
  end if;
  return new;
end $$;

-- backfill: earliest gestor becomes admin
INSERT INTO public.user_roles (user_id, role)
SELECT r.user_id, 'admin' FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
WHERE r.role = 'gestor' AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
ORDER BY p.created_at LIMIT 1;