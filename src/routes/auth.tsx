import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import heroAsset from "@/assets/hero02-main.webp";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Ponto & Rodízio" },
      { name: "description", content: "Acesse sua conta para registrar o ponto e ver seu espelho de horas." },
      { property: "og:title", content: "Entrar — Ponto & Rodízio" },
      { property: "og:description", content: "Acesse sua conta para registrar o ponto e ver seu espelho de horas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/ponto", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        navigate({ to: "/ponto", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name.trim() },
          },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/ponto", replace: true });
        else toast.success("Conta criada. Confirme o e-mail para entrar.");
      }
    } catch (err) {
      toast.error(traduzirErro(err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <img src={heroAsset} alt="" className="absolute inset-0 size-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--color-background)_76%)]" />
      <div className="absolute inset-0 bg-background/45" />
      <div className="surface relative w-full max-w-md p-7 sm:p-9">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
        <div className="flex size-11 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
          <Clock3 className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">
          {mode === "login" ? "Entrar na sua conta" : "Criar conta"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login" ? "Acesse para registrar e acompanhar sua jornada." : "Use seu e-mail e uma senha forte para começar."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}
          </Button>
        </form>

        <Button variant="link" className="mt-4 h-auto px-0" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Ainda não tenho conta" : "Já tenho uma conta"}
        </Button>
      </div>
    </div>
  );
}

function traduzirErro(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("weak") || m.includes("easy to guess")) return "Essa senha é muito comum e fácil de adivinhar. Escolha outra, misturando letras, números e símbolos.";
  if (m.includes("at least") && m.includes("characters")) return "A senha precisa ter pelo menos 8 caracteres.";
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (m.includes("already registered")) return "Esse e-mail já tem conta. Use \"Já tenho uma conta\".";
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
  return msg || "Não foi possível concluir.";
}
