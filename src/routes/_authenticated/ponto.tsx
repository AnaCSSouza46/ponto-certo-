import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ExportEspelho } from "@/components/ExportEspelho";
import { SolicitarAjuste } from "@/components/Ajustes";
import { useSession } from "@/hooks/useSession";
import {
  JORNADA_MINUTOS,
  PUNCH_LABEL,
  PUNCH_ORDER,
  type Punch,
  type PunchKind,
  dayKey,
  formatDateBR,
  formatMinutes,
  formatTime,
  groupByDay,
  monthKey,
  monthRange,
  nextKind,
} from "@/lib/ponto";

export const Route = createFileRoute("/_authenticated/ponto")({
  head: () => ({
    meta: [
      { title: "Meu ponto — Ponto & Rodízio" },
      { name: "description", content: "Registre entrada, almoço e saída e acompanhe seu espelho mensal de horas." },
      { property: "og:title", content: "Meu ponto — Ponto & Rodízio" },
      { property: "og:description", content: "Registre entrada, almoço e saída e acompanhe seu espelho mensal de horas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MeuPonto,
});

function MeuPonto() {
  const { session, profile } = useSession();
  const userId = session?.user.id;
  const jornada = profile?.jornada_minutos ?? JORNADA_MINUTOS;
  const [mes, setMes] = useState(monthKey());
  const [agora, setAgora] = useState(new Date());
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: punches = [], isLoading } = useQuery({
    queryKey: ["meu-ponto", userId, mes],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { start, end } = monthRange(mes);
      const { data, error } = await supabase
        .from("time_punches")
        .select("id,user_id,kind,punched_at,note")
        .eq("user_id", userId!)
        .gte("punched_at", start)
        .lt("punched_at", end)
        .order("punched_at", { ascending: false });
      if (error) throw error;
      return data as Punch[];
    },
  });

  const dias = useMemo(() => groupByDay(punches, jornada), [punches, jornada]);
  const hojeKey = dayKey(new Date().toISOString());
  const hoje = dias.find((d) => d.date === hojeKey);
  const proximo = nextKind(hoje?.punches ?? {});
  const saldoMes = dias.reduce((acc, d) => acc + d.balanceMinutes, 0);
  const totalMes = dias.reduce((acc, d) => acc + d.workedMinutes, 0);

  async function bater(kind: PunchKind) {
    const { error } = await supabase.from("time_punches").insert({ user_id: userId!, kind });
    if (error) { toast.error("Não foi possível registrar: " + error.message); return; }
    toast.success(`${PUNCH_LABEL[kind]} registrada às ${formatTime(new Date().toISOString())}`);
    void queryClient.invalidateQueries({ queryKey: ["meu-ponto"] });
  }

  return (
    <div className="space-y-8">
      <section className="surface hero-gradient text-primary-foreground p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.2em] opacity-80">REGISTRO DE HOJE</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="tabular text-5xl font-bold">
              {agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="mt-1 text-sm opacity-90">
              {agora.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </p>
          </div>
          <div className="text-right text-sm opacity-90">
            <p>Jornada diária: {formatMinutes(jornada)}</p>
            <p>Trabalhado hoje: {formatMinutes(hoje?.workedMinutes ?? 0)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {PUNCH_ORDER.map((kind) => {
            const registrado = hoje?.punches[kind];
            return (
              <button
                key={kind}
                type="button"
                disabled={Boolean(registrado) || proximo !== kind}
                onClick={() => bater(kind)}
                className="rounded-xl border border-white/25 bg-white/10 p-4 text-left transition enabled:hover:bg-white/20 disabled:opacity-60"
              >
                <span className="block text-xs uppercase tracking-wide opacity-80">
                  {PUNCH_LABEL[kind]}
                </span>
                <span className="tabular mt-1 block text-2xl font-semibold">
                  {registrado ? formatTime(registrado.punched_at) : proximo === kind ? "Bater" : "--:--"}
                </span>
              </button>
            );
          })}
        </div>
        {!proximo && <p className="mt-4 text-sm opacity-90">Jornada de hoje concluída.</p>}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card titulo="Horas no mês" valor={formatMinutes(totalMes)} />
        <Card
          titulo="Saldo do mês"
          valor={formatMinutes(saldoMes)}
          destaque={saldoMes >= 0 ? "text-success" : "text-destructive"}
        />
        <Card titulo="Dias com registro" valor={String(dias.length)} />
      </section>

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <h2 className="font-semibold">Espelho de ponto</h2>
          <div className="flex flex-wrap items-center gap-2">
            <ExportEspelho
              info={{ nome: profile?.full_name || session?.user.email || "Colaborador", email: profile?.email, mes, jornadaMinutos: jornada, dias }}
            />
            <input
              type="month"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            />
          </div>
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
              {isLoading && (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                    Carregando...
                  </td>
                </tr>
              )}
              {!isLoading && dias.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                    Nenhum registro neste mês.
                  </td>
                </tr>
              )}
              {dias.map((d) => (
                <tr key={d.date} className="border-t border-border tabular">
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
      <SolicitarAjuste userId={userId} />
    </div>
  );
}

function Card({ titulo, valor, destaque }: { titulo: string; valor: string; destaque?: string }) {
  return (
    <div className="surface p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className={`tabular mt-2 text-3xl font-bold ${destaque ?? ""}`}>{valor}</p>
    </div>
  );
}
