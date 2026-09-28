CREATE TABLE public.punch_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind public.punch_kind NOT NULL,
  requested_at timestamptz NOT NULL,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pendente',
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  review_note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.punch_adjustments TO authenticated;
GRANT ALL ON public.punch_adjustments TO service_role;
ALTER TABLE public.punch_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ajuste select" ON public.punch_adjustments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_manage(auth.uid(), user_id));
CREATE POLICY "ajuste insert" ON public.punch_adjustments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pendente' AND reviewed_by IS NULL);
CREATE POLICY "ajuste delete pendente" ON public.punch_adjustments FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'pendente');

CREATE OR REPLACE FUNCTION public.review_adjustment(_id uuid, _approve boolean, _note text DEFAULT '')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare a public.punch_adjustments; existing uuid;
begin
  select * into a from public.punch_adjustments where id = _id for update;
  if not found then raise exception 'Solicitação não encontrada'; end if;
  if a.status <> 'pendente' then raise exception 'Solicitação já analisada'; end if;
  if a.user_id = auth.uid() and not public.has_role(auth.uid(), 'admin') then
    raise exception 'Você não pode aprovar o próprio ajuste';
  end if;
  if not public.can_manage(auth.uid(), a.user_id) then raise exception 'Sem permissão'; end if;

  if _approve then
    select id into existing from public.time_punches
      where user_id = a.user_id and kind = a.kind
        and (punched_at at time zone 'America/Sao_Paulo')::date = (a.requested_at at time zone 'America/Sao_Paulo')::date
      order by punched_at limit 1;
    if existing is not null then
      update public.time_punches set punched_at = a.requested_at, adjusted_by = auth.uid(),
        note = 'Ajuste aprovado: ' || coalesce(a.reason, '') where id = existing;
    else
      insert into public.time_punches (user_id, kind, punched_at, adjusted_by, note)
      values (a.user_id, a.kind, a.requested_at, auth.uid(), 'Ajuste aprovado: ' || coalesce(a.reason, ''));
    end if;
  end if;

  update public.punch_adjustments set status = case when _approve then 'aprovado' else 'recusado' end,
    reviewed_by = auth.uid(), reviewed_at = now(), review_note = coalesce(_note, '') where id = _id;
end $$;
REVOKE ALL ON FUNCTION public.review_adjustment(uuid, boolean, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.review_adjustment(uuid, boolean, text) TO authenticated;