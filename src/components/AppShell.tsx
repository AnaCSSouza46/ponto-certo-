import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Clock3, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, isGestor, isAdmin } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background/75">
      <header className="sticky top-0 z-20 border-b border-border bg-background/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/ponto" className="flex items-center gap-3 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary shadow-[0_0_24px_-10px_var(--color-primary)]">
              <Clock3 className="size-5" />
            </span>
            <span className="hidden sm:inline">Ponto <span className="text-primary">&</span> Rodízio</span>
          </Link>
          <nav className="flex flex-1 flex-wrap items-center gap-1 text-sm">
            <NavItem to="/ponto">Meu ponto</NavItem>
            <NavItem to="/rodizio">Rodízio</NavItem>
            {isGestor && <NavItem to="/equipe">Equipe</NavItem>}
            {isAdmin && <NavItem to="/setores">Setores</NavItem>}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{profile?.full_name ?? ""}</p>
              <p className="text-xs text-muted-foreground">{isAdmin ? "Administrador" : isGestor ? "Gestor" : "Funcionário"}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={sair} aria-label="Sair">
              <LogOut />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      activeProps={{ className: "rounded-full px-3 py-1.5 bg-primary/15 text-primary font-medium" }}
    >
      {children}
    </Link>
  );
}
