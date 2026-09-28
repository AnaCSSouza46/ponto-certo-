import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/hooks/useSession";
import { formatDateBR, formatMinutes } from "@/lib/ponto";

export const Route = createFileRoute("/_authenticated/rodizio")({
  head: () => ({
    meta: [
      { title: "Rodízio — escalas, sobreaviso e chamados" },
      { name: "description", content: "Cadastre participantes, escalas, períodos de sobreaviso e chamados atendidos." },
      { property: "og:title", content: "Rodízio — escalas, sobreaviso e chamados" },
      { property: "og:description", content: "Cadastre participantes, escalas, períodos de sobreaviso e chamados atendidos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Rodizio,
});

interface Participant {
  id: string;
  name: string;
  role: string | null;
  status: string;
}

function Rodizio() {
  const { session } = useSession();
  const userId = session?.user.id;
  const qc = useQueryClient();

  const participants = useQuery({
    queryKey: ["participants", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("id,name,role,status")
        .order("name");
      if (error) throw error;
      return data as Participant[];
    },
  });

  const schedules = useQuery({
    queryKey: ["schedules", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedules")
        .select("id,schedule_date,start_time,end_time,kind,participant_id,participants(name)")
        .order("schedule_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const oncall = useQuery({
    queryKey: ["oncall", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("on_call_periods")
        .select("id,on_call_date,start_time,end_time,participant_id,participants(name)")
        .order("on_call_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const tickets = useQuery({
    queryKey: ["tickets", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id,ticket_number,ticket_date,started_at,ended_at,description,participant_id,participants(name)")
        .order("ticket_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function inserir(table: string, values: Record<string, unknown>, key: string) {
    const { error } = await supabase.from(table as never).insert({ ...values, user_id: userId } as never);
    if (error) { toast.error(error.message); return; }
    toast.success("Registro salvo.");
    void qc.invalidateQueries({ queryKey: [key] });
  }

  async function excluir(table: string, id: string, key: string) {
    const { error } = await supabase.from(table as never).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: [key] });
  }

  const pessoas = participants.data ?? [];

  const sobreaviso = useMemo(() => {
    const ts = (tickets.data ?? []) as any[];
    return ((oncall.data ?? []) as any[]).map((o) => {
      const ini = new Date(`${o.on_call_date}T${o.start_time}`);
      const fim = new Date(`${o.on_call_date}T${o.end_time}`);
      if (fim <= ini) fim.setDate(fim.getDate() + 1); // atravessa a meia-noite
      const chamados = ts
        .filter((t) => t.started_at && t.ended_at && o.participant_id && t.participant_id === o.participant_id)
        .map((t) => {
          const a = Math.max(ini.getTime(), new Date(t.started_at).getTime());
          const b = Math.min(fim.getTime(), new Date(t.ended_at).getTime());
          return { ticket_number: t.ticket_number as string, min: Math.max(0, Math.round((b - a) / 60000)) };
        })
        .filter((c) => c.min > 0);
      return {
        id: o.id as string,
        on_call_date: o.on_call_date as string,
        start_time: o.start_time as string,
        end_time: o.end_time as string,
        nome: (o.participants?.name as string) ?? "Sem participante",
        chamados,
        trabalhado: Math.max(0, Math.round((fim.getTime() - ini.getTime()) / 60000)),
      };
    });
  }, [oncall.data, tickets.data]);

  const resumoMes = useMemo(() => {
    const mes = new Date().toISOString().slice(0, 7);
    const m = new Map<string, { nome: string; periodos: number; chamados: number; minutos: number }>();
    for (const o of sobreaviso) {
      if (!o.on_call_date.startsWith(mes)) continue;
      const r = m.get(o.nome) ?? { nome: o.nome, periodos: 0, chamados: 0, minutos: 0 };
      r.periodos += 1;
      r.chamados += o.chamados.length;
      r.minutos += o.trabalhado;
      m.set(o.nome, r);
    }
    return [...m.values()].sort((a, b) => b.minutos - a.minutos);
  }, [sobreaviso]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rodízio</h1>
        <p className="text-sm text-muted-foreground">
          Participantes, escalas, sobreaviso e chamados da equipe.
        </p>
      </div>

      <Tabs defaultValue="participantes">
        <TabsList>
          <TabsTrigger value="participantes">Participantes</TabsTrigger>
          <TabsTrigger value="escalas">Escalas</TabsTrigger>
          <TabsTrigger value="sobreaviso">Sobreaviso</TabsTrigger>
          <TabsTrigger value="chamados">Chamados</TabsTrigger>
        </TabsList>

        <TabsContent value="participantes" className="mt-4 grid gap-6 lg:grid-cols-2">
          <form
            className="surface space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void inserir(
                "participants",
                { name: f.get("name"), role: f.get("role"), status: f.get("status") || "Ativo" },
                "participants",
              );
              e.currentTarget.reset();
            }}
          >
            <h2 className="font-semibold">Novo participante</h2>
            <Field label="Nome" name="name" required />
            <Field label="Função" name="role" />
            <Field label="Status" name="status" placeholder="Ativo" />
            <Button type="submit">Adicionar</Button>
          </form>
          <Lista
            titulo="Participantes"
            itens={pessoas.map((p) => ({
              id: p.id,
              principal: p.name,
              secundario: `${p.role || "Sem função"} • ${p.status}`,
            }))}
            onExcluir={(id) => excluir("participants", id, "participants")}
          />
        </TabsContent>

        <TabsContent value="escalas" className="mt-4 grid gap-6 lg:grid-cols-2">
          <form
            className="surface space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void inserir(
                "schedules",
                {
                  participant_id: f.get("participant_id") || null,
                  schedule_date: f.get("schedule_date"),
                  start_time: f.get("start_time"),
                  end_time: f.get("end_time"),
                  kind: f.get("kind") || "Normal",
                },
                "schedules",
              );
              e.currentTarget.reset();
            }}
          >
            <h2 className="font-semibold">Nova escala</h2>
            <SelectPessoa pessoas={pessoas} />
            <Field label="Data" name="schedule_date" type="date" required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início" name="start_time" type="time" required />
              <Field label="Fim" name="end_time" type="time" required />
            </div>
            <Field label="Tipo" name="kind" placeholder="Normal" />
            <Button type="submit">Adicionar</Button>
          </form>
          <Lista
            titulo="Escalas"
            itens={(schedules.data ?? []).map((s: any) => ({
              id: s.id,
              principal: `${formatDateBR(s.schedule_date)} • ${s.start_time?.slice(0, 5)}–${s.end_time?.slice(0, 5)}`,
              secundario: `${s.participants?.name ?? "Sem participante"} • ${s.kind}`,
            }))}
            onExcluir={(id) => excluir("schedules", id, "schedules")}
          />
        </TabsContent>

        <TabsContent value="sobreaviso" className="mt-4 grid gap-6 lg:grid-cols-2">
          <form
            className="surface space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void inserir(
                "on_call_periods",
                {
                  participant_id: f.get("participant_id") || null,
                  on_call_date: f.get("on_call_date"),
                  start_time: f.get("start_time"),
                  end_time: f.get("end_time"),
                },
                "oncall",
              );
              e.currentTarget.reset();
            }}
          >
            <h2 className="font-semibold">Novo sobreaviso</h2>
            <SelectPessoa pessoas={pessoas} />
            <Field label="Data" name="on_call_date" type="date" required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início" name="start_time" type="time" required />
              <Field label="Fim" name="end_time" type="time" required />
            </div>
            <Button type="submit">Adicionar</Button>
          </form>
          <div className="space-y-6">
            <ResumoSobreaviso resumo={resumoMes} />
            <Lista
              titulo="Períodos de sobreaviso"
              itens={sobreaviso.map((o) => ({
                id: o.id,
                principal: `${formatDateBR(o.on_call_date)} • ${o.start_time?.slice(0, 5)}–${o.end_time?.slice(0, 5)} • ${formatMinutes(o.trabalhado)} trabalhadas`,
                secundario: `${o.nome} • ${o.chamados.length} chamado(s)${o.chamados.length ? `: ${o.chamados.map((c) => `#${c.ticket_number} (${formatMinutes(c.min)})`).join(", ")}` : ""}`,
              }))}
              onExcluir={(id) => excluir("on_call_periods", id, "oncall")}
            />
          </div>
        </TabsContent>

        <TabsContent value="chamados" className="mt-4 grid gap-6 lg:grid-cols-2">
          <form
            className="surface space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (new Date(String(f.get("ended_at"))) <= new Date(String(f.get("started_at")))) {
                toast.error("O fim do atendimento precisa ser depois do início.");
                return;
              }
              void inserir(
                "support_tickets",
                {
                  participant_id: f.get("participant_id") || null,
                  ticket_number: f.get("ticket_number"),
                  ticket_date: String(f.get("started_at") ?? "").slice(0, 10),
                  started_at: new Date(String(f.get("started_at"))).toISOString(),
                  ended_at: new Date(String(f.get("ended_at"))).toISOString(),
                  description: f.get("description"),
                },
                "tickets",
              );
              e.currentTarget.reset();
            }}
          >
            <h2 className="font-semibold">Novo chamado</h2>
            <SelectPessoa pessoas={pessoas} />
            <Field label="Número" name="ticket_number" required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início do atendimento" name="started_at" type="datetime-local" required />
              <Field label="Fim do atendimento" name="ended_at" type="datetime-local" required />
            </div>
            <Field label="Descrição" name="description" />
            <Button type="submit">Adicionar</Button>
          </form>
          <Lista
            titulo="Chamados"
            itens={(tickets.data ?? []).map((t: any) => ({
              id: t.id,
              principal: `#${t.ticket_number} • ${formatDateBR(t.ticket_date)}${t.started_at && t.ended_at ? ` • ${hhmm(t.started_at)}–${hhmm(t.ended_at)} (${formatMinutes(duracao(t.started_at, t.ended_at))})` : ""}`,
              secundario: `${t.participants?.name ?? "Sem participante"}${t.description ? ` • ${t.description}` : ""}`,
            }))}
            onExcluir={(id) => excluir("support_tickets", id, "tickets")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} placeholder={placeholder} />
    </div>
  );
}

function SelectPessoa({ pessoas }: { pessoas: Participant[] }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="participant_id">Participante</Label>
      <select
        id="participant_id"
        name="participant_id"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">Selecione</option>
        {pessoas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Lista({
  titulo,
  itens,
  onExcluir,
}: {
  titulo: string;
  itens: { id: string; principal: string; secundario: string }[];
  onExcluir: (id: string) => void;
}) {
  return (
    <div className="surface overflow-hidden">
      <h2 className="border-b border-border p-4 font-semibold">{titulo}</h2>
      <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto text-sm">
        {itens.length === 0 && <li className="px-4 py-6 text-muted-foreground">Nenhum registro.</li>}
        {itens.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span>
              <b>{i.principal}</b>
              <span className="block text-muted-foreground">{i.secundario}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => onExcluir(i.id)}>
              Excluir
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function hhmm(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function duracao(a: string, b: string) {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000));
}

function ResumoSobreaviso({ resumo }: { resumo: { nome: string; periodos: number; chamados: number; minutos: number }[] }) {
  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-border p-4">
        <h2 className="font-semibold">Horas de sobreaviso (mês atual)</h2>
        <p className="text-xs text-muted-foreground">Soma da duração completa dos períodos de sobreaviso.</p>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2">Pessoa</th>
            <th className="px-4 py-2">Períodos</th>
            <th className="px-4 py-2">Chamados</th>
            <th className="px-4 py-2">Horas</th>
          </tr>
        </thead>
        <tbody>
          {resumo.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-6 text-muted-foreground">Nenhum sobreaviso neste mês.</td></tr>
          )}
          {resumo.map((r) => (
            <tr key={r.nome} className="border-t border-border">
              <td className="px-4 py-2 font-medium">{r.nome}</td>
              <td className="px-4 py-2 tabular">{r.periodos}</td>
              <td className="px-4 py-2 tabular">{r.chamados}</td>
              <td className="px-4 py-2 tabular font-semibold">{formatMinutes(r.minutos)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
