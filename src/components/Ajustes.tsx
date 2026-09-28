import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PUNCH_LABEL, PUNCH_ORDER, type PunchKind } from "@/lib/ponto";

const STATUS: Record<string, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "bg-secondary text-foreground" },
  aprovado: { label: "Aprovado", cls: "bg-success/15 text-success" },
  recusado: { label: "Recusado", cls: "bg-destructive/15 text-destructive" },
};

function dataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function invalidar(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["ajustes"] });
  void qc.invalidateQueries({ queryKey: ["meu-ponto"] });
  void qc.invalidateQueries({ queryKey: ["ponto-equipe"] });
}

/** Colaborador: pede correção de batida errada ou esquecida. */
export function SolicitarAjuste({ userId }: { userId: string | undefined }) {
  const qc = useQueryClient();
  const [kind, setKind] = useState<PunchKind>("entrada");
  const [quando, setQuando] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  const { data: meus = [] } = useQuery({
    queryKey: ["ajustes", "meus", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("punch_adjustments")
        .select("id,kind,requested_at,reason,status,review_note,created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !quando) return;
    if (!motivo.trim()) return void toast.error("Explique o motivo do ajuste.");
    if (new Date(quando) > new Date()) return void toast.error("Não é possível ajustar um horário no futuro.");
    setEnviando(true);
    const { error } = await supabase.from("punch_adjustments").insert({
      user_id: userId,
      kind,
      requested_at: new Date(quando).toISOString(),
      reason: motivo.trim(),
    });
    setEnviando(false);
    if (error) return void toast.error(error.message);
    toast.success("Pedido enviado ao seu gestor.");
    setQuando("");
    setMotivo("");
    invalidar(qc);
  }

  async function cancelar(id: string) {
    const { error } = await supabase.from("punch_adjustments").delete().eq("id", id);
    if (error) return void toast.error(error.message);
    invalidar(qc);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={enviar} className="surface space-y-4 p-5">
        <div>
          <h2 className="font-semibold">Solicitar ajuste de ponto</h2>
          <p className="text-sm text-muted-foreground">
            Esqueceu de bater ou marcou errado? Informe o horário correto. Se já existir uma batida desse tipo no dia, ela será corrigida; se não, será incluída.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="aj-kind">Marcação</Label>
            <select
              id="aj-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as PunchKind)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {PUNCH_ORDER.map((k) => (
                <option key={k} value={k}>{PUNCH_LABEL[k]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aj-quando">Data e horário corretos</Label>
            <Input id="aj-quando" type="datetime-local" required value={quando} onChange={(e) => setQuando(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aj-motivo">Motivo</Label>
          <Input id="aj-motivo" placeholder="Ex.: esqueci de bater a saída" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
        <Button type="submit" disabled={enviando}>Enviar pedido</Button>
      </form>

      <div className="surface overflow-hidden">
        <h2 className="border-b border-border p-4 font-semibold">Meus pedidos de ajuste</h2>
        <ul className="max-h-[22rem] divide-y divide-border overflow-y-auto text-sm">
          {meus.length === 0 && <li className="px-4 py-6 text-muted-foreground">Nenhum pedido.</li>}
          {meus.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium">{PUNCH_LABEL[a.kind as PunchKind]} • {dataHora(a.requested_at)}</p>
                <p className="text-muted-foreground">{a.reason}</p>
                {a.review_note && <p className="text-xs text-muted-foreground">Gestor: {a.review_note}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[a.status]?.cls ?? ""}`}>
                  {STATUS[a.status]?.label ?? a.status}
                </span>
                {a.status === "pendente" && (
                  <Button variant="ghost" size="sm" onClick={() => cancelar(a.id)}>Cancelar</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Gestor: aprova ou recusa pedidos da equipe. */
export function AjustesPendentes({ selfId }: { selfId: string | undefined }) {
  const qc = useQueryClient();
  const { data: pendentes = [] } = useQuery({
    queryKey: ["ajustes", "pendentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("punch_adjustments")
        .select("id,user_id,kind,requested_at,reason,created_at,profiles!punch_adjustments_user_id_fkey(full_name,email)")
        .eq("status", "pendente")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  async function analisar(id: string, aprovar: boolean) {
    let note = "";
    if (!aprovar) {
      const r = prompt("Motivo da recusa (opcional):");
      if (r === null) return;
      note = r;
    }
    const { error } = await supabase.rpc("review_adjustment", { _id: id, _approve: aprovar, _note: note });
    if (error) return void toast.error(error.message);
    toast.success(aprovar ? "Ajuste aprovado e aplicado ao ponto." : "Ajuste recusado.");
    invalidar(qc);
  }

  const lista = pendentes.filter((p) => p.user_id !== selfId);

  return (
    <section className="surface overflow-hidden">
      <div className="border-b border-border p-4">
        <h2 className="font-semibold">Pedidos de ajuste pendentes {lista.length > 0 && `(${lista.length})`}</h2>
        <p className="text-xs text-muted-foreground">Ao aprovar, a batida é corrigida ou incluída automaticamente no espelho.</p>
      </div>
      <ul className="divide-y divide-border text-sm">
        {lista.length === 0 && <li className="px-4 py-6 text-muted-foreground">Nenhum pedido aguardando.</li>}
        {lista.map((a) => {
          const p = a.profiles as { full_name: string; email: string | null } | null;
          return (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium">{p?.full_name || p?.email || "Colaborador"}</p>
                <p>{PUNCH_LABEL[a.kind as PunchKind]} • {dataHora(a.requested_at)}</p>
                <p className="text-muted-foreground">{a.reason}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => analisar(a.id, true)}>Aprovar</Button>
                <Button size="sm" variant="outline" onClick={() => analisar(a.id, false)}>Recusar</Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
