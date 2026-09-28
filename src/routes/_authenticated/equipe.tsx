import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExportEspelho } from "@/components/ExportEspelho";
import { AjustesPendentes } from "@/components/Ajustes";
import { useSession } from "@/hooks/useSession";
import {
  JORNADA_MINUTOS,
  PUNCH_LABEL,
  PUNCH_ORDER,
  type Punch,
  type PunchKind,
  formatDateBR,
  formatMinutes,
  formatTime,
  groupByDay,
  monthKey,
  monthRange,
} from "@/lib/ponto";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Equipe — Ponto & Rodízio" },
      { name: "description", content: "Acompanhe e ajuste o ponto da equipe do seu setor, por colaborador e por mês." },
      { property: "og:title", content: "Equipe — Ponto & Rodízio" },
      { property: "og:description", content: "Acompanhe e ajuste o ponto da equipe do seu setor, por colaborador e por mês." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Equipe,
});

interface Colaborador {
  id: string;
  full_name: string;
  email: string | null;
  cargo: string | null;
  jornada_minutos: number;
}

function Equipe() {
  const { isGestor, loading, session } = useSession();
  const queryClient = useQueryClient();
  const [mes, setMes] = useState(monthKey());
  const [selecionado, setSelecionado] = useState<string>("");
  const [novoKind, setNovoKind] = useState<PunchKind>("entrada");
  const [novoQuando, setNovoQuando] = useState("");

  const { data: pessoas = [] } = useQuery({
    queryKey: ["colaboradores"],
    enabled: isGestor,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,email,cargo,jornada_minutos")
        .order("full_name");
      if (error) throw error;
      return data as Colaborador[];
    },
  });

  const pessoaId = selecionado || pessoas[0]?.id || "";
  const pessoa = pessoas.find((p) => p.id === pessoaId);

  const { data: punches = [] } = useQuery({
    queryKey: ["ponto-equipe", pessoaId, mes],
    enabled: Boolean(pessoaId),
    queryFn: async () => {
      const { start, end } = monthRange(mes);
      const { data, error } = await supabase
        .from("time_punches")
        .select("id,user_id,kind,punched_at,note")
        .eq("user_id", pessoaId)
        .gte("punched_at", start)
        .lt("punched_at", end)
        .order("punched_at", { ascending: false });
      if (error) throw error;
      return data as Punch[];
    },
  });

  const dias = useMemo(
    () => groupByDay(punches, pessoa?.jornada_minutos ?? JORNADA_MINUTOS),
    [punches, pessoa],
  );
  const saldo = dias.reduce((a, d) => a + d.balanceMinutes, 0);

  async function adicionarAjuste(e: React.FormEvent) {
    e.preventDefault();
    if (!pessoaId || !novoQuando) return;
    const { data: me } = await supabase.auth.getUser();
    const { error } = await supabase.from("time_punches").insert({
      user_id: pessoaId,
      kind: novoKind,
      punched_at: new Date(novoQuando).toISOString(),
      note: "Ajuste manual do gestor",
      adjusted_by: me.user?.id ?? null,
    });
    if (error) { toast.error(error.message); return; }
    setNovoQuando("");
    toast.success("Marcação incluída.");
    void queryClient.invalidateQueries({ queryKey: ["ponto-equipe"] });
  }

  async function remover(id: string) {
    const { error } = await supabase.from("time_punches").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Marcação removida.");
    void queryClient.invalidateQueries({ queryKey: ["ponto-equipe"] });
  }

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;
  if (!isGestor)
    return (
      <div className="surface p-6">
        <h1 className="font-semibold">Acesso restrito</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Apenas gestores podem ver o ponto de outras pessoas.
        </p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ponto da equipe</h1>
          <p className="text-sm text-muted-foreground">
            Escolha o colaborador, revise as marcações e faça ajustes quando necessário.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={pessoaId}
            onChange={(e) => setSelecionado(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name || p.email}
              </option>
            ))}
          </select>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric titulo="Colaboradores" valor={String(pessoas.length)} />
        <Metric
          titulo="Horas no mês"
          valor={formatMinutes(dias.reduce((a, d) => a + d.workedMinutes, 0))}
        />
        <Metric
          titulo="Saldo do mês"
          valor={formatMinutes(saldo)}
          classe={saldo >= 0 ? "text-success" : "text-destructive"}
        />
      </div>

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <h2 className="font-semibold">Espelho de {pessoa?.full_name ?? "colaborador"}</h2>
          <ExportEspelho
            info={pessoa ? { nome: pessoa.full_name || pessoa.email || "Colaborador", email: pessoa.email, mes, jornadaMinutos: pessoa.jornada_minutos, dias } : null}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Dia</th>
                <th className="px-4 py-2">Entrada</th>
                <th className="px-4 py-2">Almoço</th>
                <th className="px-4 py-2">Retorno</th>
                <th className="px-4 py-2">Saída</th>
                <th className="px-4 py-2">Trabalhado</th>
                <th className="px-4 py-2">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {dias.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-muted-foreground">
                    Nenhuma marcação neste mês.
                  </td>
                </tr>
              )}
              {dias.map((d) => (
                <tr key={d.date} className="tabular border-t border-border">
                  <td className="px-4 py-2 font-medium">{formatDateBR(d.date)}</td>
                  <td className="px-4 py-2">{formatTime(d.punches.entrada?.punched_at)}</td>
                  <td className="px-4 py-2">{formatTime(d.punches.saida_almoco?.punched_at)}</td>
                  <td className="px-4 py-2">{formatTime(d.punches.volta_almoco?.punched_at)}</td>
                  <td className="px-4 py-2">{formatTime(d.punches.saida?.punched_at)}</td>
                  <td className="px-4 py-2">{formatMinutes(d.workedMinutes)}</td>
                  <td
                    className={`px-4 py-2 font-medium ${d.balanceMinutes < 0 ? "text-destructive" : "text-success"}`}
                  >
                    {d.complete ? formatMinutes(d.balanceMinutes) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={adicionarAjuste} className="surface space-y-4 p-5">
          <h2 className="font-semibold">Incluir marcação manual</h2>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <select
              value={novoKind}
              onChange={(e) => setNovoKind(e.target.value as PunchKind)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {PUNCH_ORDER.map((k) => (
                <option key={k} value={k}>
                  {PUNCH_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quando">Data e hora</Label>
            <Input
              id="quando"
              type="datetime-local"
              value={novoQuando}
              onChange={(e) => setNovoQuando(e.target.value)}
              required
            />
          </div>
          <Button type="submit">Salvar marcação</Button>
        </form>

        <div className="surface overflow-hidden">
          <h2 className="border-b border-border p-4 font-semibold">Marcações do mês</h2>
          <ul className="max-h-80 divide-y divide-border overflow-y-auto text-sm">
            {punches.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2">
                <span>
                  <b className="tabular">
                    {new Date(p.punched_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </b>{" "}
                  — {PUNCH_LABEL[p.kind]}
                  {p.note ? <em className="text-muted-foreground"> ({p.note})</em> : null}
                </span>
                <Button variant="ghost" size="sm" onClick={() => remover(p.id)}>
                  Excluir
                </Button>
              </li>
            ))}
            {punches.length === 0 && (
              <li className="px-4 py-6 text-muted-foreground">Sem marcações.</li>
            )}
          </ul>
        </div>
      </section>
      <AjustesPendentes selfId={session?.user.id} />
    </div>
  );
}

function Metric({ titulo, valor, classe }: { titulo: string; valor: string; classe?: string }) {
  return (
    <div className="surface p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className={`tabular mt-2 text-3xl font-bold ${classe ?? ""}`}>{valor}</p>
    </div>
  );
}
