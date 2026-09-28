import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/_authenticated/setores")({
  head: () => ({
    meta: [
      { title: "Setores — Ponto & Rodízio" },
      { name: "description", content: "Organize setores, defina gestores e distribua colaboradores." },
      { property: "og:title", content: "Setores — Ponto & Rodízio" },
      { property: "og:description", content: "Organize setores, defina gestores e distribua colaboradores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Setores,
});

type Papel = "gestor" | "funcionario";

function Setores() {
  const { isAdmin, loading, session } = useSession();
  const qc = useQueryClient();
  const [nome, setNome] = useState("");

  const { data: setores = [] } = useQuery({
    queryKey: ["setores"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("sectors").select("id,name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: pessoas = [] } = useQuery({
    queryKey: ["pessoas-setores"],
    enabled: isAdmin,
    queryFn: async () => {
      const [{ data: ps, error }, { data: rs, error: e2 }] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,sector_id").order("full_name"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (error) throw error;
      if (e2) throw e2;
      return (ps ?? []).map((p) => {
        const roles = (rs ?? []).filter((r) => r.user_id === p.id).map((r) => r.role);
        return { ...p, admin: roles.includes("admin"), papel: (roles.includes("gestor") ? "gestor" : "funcionario") as Papel };
      });
    },
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["setores"] });
    void qc.invalidateQueries({ queryKey: ["pessoas-setores"] });
    void qc.invalidateQueries({ queryKey: ["colaboradores"] });
  };

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    const { error } = await supabase.from("sectors").insert({ name: nome.trim() });
    if (error) return void toast.error(error.message);
    setNome("");
    toast.success("Setor criado");
    refresh();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este setor? As pessoas ficarão sem setor.")) return;
    const { error } = await supabase.from("sectors").delete().eq("id", id);
    if (error) return void toast.error(error.message);
    refresh();
  }

  async function mudarSetor(userId: string, sectorId: string) {
    const { error } = await supabase.from("profiles").update({ sector_id: sectorId || null }).eq("id", userId);
    if (error) return void toast.error(error.message);
    toast.success("Setor atualizado");
    refresh();
  }

  async function mudarPapel(userId: string, papel: Papel) {
    const { error } = await supabase.rpc("set_user_role", { _user: userId, _role: papel });
    if (error) return void toast.error(error.message);
    toast.success("Papel atualizado");
    refresh();
  }

  if (loading) return null;
  if (!isAdmin) {
    return (
      <div className="surface rounded-xl p-8 text-center">
        <h1 className="font-semibold">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground">Somente o administrador organiza os setores.</p>
      </div>
    );
  }

  const selectCls = "h-9 rounded-md border border-input bg-background px-2 text-sm";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Setores</h1>
        <p className="text-sm text-muted-foreground">
          Cada gestor vê e ajusta apenas o ponto das pessoas do mesmo setor.
        </p>
      </div>

      <section className="surface space-y-4 rounded-xl p-5">
        <form onSubmit={criar} className="flex gap-2">
          <Input placeholder="Nome do setor (ex.: Suporte)" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Button type="submit">Criar setor</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {setores.length === 0 && <p className="text-sm text-muted-foreground">Nenhum setor criado ainda.</p>}
          {setores.map((s) => (
            <span key={s.id} className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm">
              {s.name}
              <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => excluir(s.id)} aria-label={`Excluir ${s.name}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      </section>

      <section className="surface overflow-x-auto rounded-xl">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b border-border">
              <th className="p-3">Pessoa</th>
              <th className="p-3">Setor</th>
              <th className="p-3">Papel</th>
            </tr>
          </thead>
          <tbody>
            {pessoas.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <p className="font-medium">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                </td>
                <td className="p-3">
                  <select className={selectCls} value={p.sector_id ?? ""} onChange={(e) => mudarSetor(p.id, e.target.value)}>
                    <option value="">Sem setor</option>
                    {setores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  {p.admin ? (
                    <span className="text-muted-foreground">Administrador{p.id === session?.user.id ? " (você)" : ""}</span>
                  ) : (
                    <select className={selectCls} value={p.papel} onChange={(e) => mudarPapel(p.id, e.target.value as Papel)}>
                      <option value="funcionario">Funcionário</option>
                      <option value="gestor">Gestor</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
