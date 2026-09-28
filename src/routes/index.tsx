import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock3, CalendarDays, PhoneCall, FileClock, TimerReset, UsersRound, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TubesBackground } from "@/components/TubesBackground";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ponto & Rodízio — controle de jornada da equipe" },
      {
        name: "description",
        content:
          "Registre entrada, almoço e saída, acompanhe o espelho de ponto e organize escalas, sobreaviso e chamados da equipe.",
      },
      { property: "og:title", content: "Ponto & Rodízio — controle de jornada da equipe" },
      {
        property: "og:description",
        content:
          "Marcação de ponto com espelho mensal, banco de horas e gestão de escalas, sobreaviso e chamados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6">
          <Link to="/" className="flex items-center gap-3 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
              <Clock3 className="size-5" />
            </span>
            Ponto <span className="text-primary">&</span> Rodízio
          </Link>
          <Button asChild variant="outline" size="sm"><Link to="/auth">Entrar</Link></Button>
        </div>
      </header>

      <section className="landing-hero relative flex min-h-screen items-center overflow-hidden border-b border-border pt-24">
        <TubesBackground />
        <div className="landing-hero-vignette absolute inset-0 z-[1]" />
        <div className="landing-watermark absolute inset-x-0 top-1/2 z-[1] -translate-y-1/2 text-center" aria-hidden="true">P&R</div>
        <div className="hero-glow-line absolute inset-x-0 bottom-0 z-[3] h-px" />
        <div className="relative z-[2] mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6">
          <div className="animate-hero-in mx-auto flex max-w-3xl flex-wrap justify-center gap-2.5">
            <HeroBadge icon={<TimerReset />}>Ponto preciso</HeroBadge>
            <HeroBadge icon={<UsersRound />}>Equipe organizada</HeroBadge>
            <HeroBadge icon={<CalendarClock />}>Escalas claras</HeroBadge>
          </div>
          <h1 className="animate-hero-in animation-delay-150 mx-auto mt-8 max-w-4xl text-4xl font-medium leading-[1.08] sm:text-6xl lg:text-[4rem]">
            Controle a jornada da equipe <span className="landing-title-gradient">em um só lugar</span>
          </h1>
          <p className="animate-hero-in animation-delay-300 mx-auto mt-7 max-w-2xl text-base leading-7 text-foreground/80 sm:text-xl sm:leading-8">
            Entrada, almoço e saída com horário exato, espelho mensal, saldo de horas, escalas, sobreaviso e chamados no mesmo lugar.
          </p>
          <div className="animate-hero-in animation-delay-450 mt-10 flex justify-center">
            <Button asChild size="lg" className="landing-cta"><Link to="/auth">Acessar o sistema <ArrowRight /></Link></Button>
          </div>
          <p className="animate-hero-in animation-delay-600 mt-5 text-sm text-foreground/60">Registre o ponto com rapidez e segurança.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <Feature icon={<Clock3 className="size-5" />} title="Batida de ponto">
          Quatro registros por dia com horário do servidor e histórico auditável.
        </Feature>
        <Feature icon={<FileClock className="size-5" />} title="Espelho mensal">
          Horas trabalhadas por dia, saldo positivo ou negativo e total do mês.
        </Feature>
        <Feature icon={<CalendarDays className="size-5" />} title="Escalas">
          Rodízio da equipe com data, horários e tipo de turno.
        </Feature>
        <Feature icon={<PhoneCall className="size-5" />} title="Sobreaviso e chamados">
          Períodos de sobreaviso e chamados atendidos com tempo gasto.
        </Feature>
      </section>
    </div>
  );
}

function HeroBadge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="landing-badge inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-foreground">
      <span className="text-primary [&_svg]:size-3.5">{icon}</span>
      {children}
    </span>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="surface group p-5 transition-transform duration-200 hover:-translate-y-1">
      <span className="flex size-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
        {icon}
      </span>
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </article>
  );
}
