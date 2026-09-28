export type PunchKind = "entrada" | "saida_almoco" | "volta_almoco" | "saida";

export interface Punch {
  id: string;
  user_id: string;
  kind: PunchKind;
  punched_at: string;
  note: string | null;
}

export const PUNCH_LABEL: Record<PunchKind, string> = {
  entrada: "Entrada",
  saida_almoco: "Saída para almoço",
  volta_almoco: "Retorno do almoço",
  saida: "Saída",
};

export const PUNCH_ORDER: PunchKind[] = ["entrada", "saida_almoco", "volta_almoco", "saida"];

/** Jornada padrão herdada do sistema atual: 08:00–17:48 com 1h de almoço = 8h48. */
export const JORNADA_MINUTOS = 8 * 60 + 48;
export const TOLERANCIA_MINUTOS = 10;

export function dayKey(iso: string): string {
  const d = new Date(iso);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function formatTime(iso?: string | null): string {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateBR(key: string): string {
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}

export function formatMinutes(total: number): string {
  const sign = total < 0 ? "-" : "";
  const abs = Math.abs(Math.round(total));
  return `${sign}${Math.floor(abs / 60)}h${`${abs % 60}`.padStart(2, "0")}`;
}

export interface DaySummary {
  date: string;
  punches: Partial<Record<PunchKind, Punch>>;
  workedMinutes: number;
  balanceMinutes: number;
  complete: boolean;
}

export function groupByDay(punches: Punch[], jornada = JORNADA_MINUTOS): DaySummary[] {
  const map = new Map<string, Partial<Record<PunchKind, Punch>>>();
  for (const p of punches) {
    const key = dayKey(p.punched_at);
    const bucket = map.get(key) ?? {};
    bucket[p.kind] = p;
    map.set(key, bucket);
  }

  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, bucket]) => {
      const worked = workedMinutes(bucket);
      const complete = Boolean(bucket.entrada && bucket.saida);
      return {
        date,
        punches: bucket,
        workedMinutes: worked,
        balanceMinutes: complete ? worked - jornada : 0,
        complete,
      };
    });
}

function diff(a?: Punch, b?: Punch): number {
  if (!a || !b) return 0;
  return Math.max(0, (new Date(b.punched_at).getTime() - new Date(a.punched_at).getTime()) / 60000);
}

export function workedMinutes(bucket: Partial<Record<PunchKind, Punch>>): number {
  if (bucket.saida_almoco && bucket.volta_almoco) {
    return diff(bucket.entrada, bucket.saida_almoco) + diff(bucket.volta_almoco, bucket.saida);
  }
  return diff(bucket.entrada, bucket.saida);
}

export function nextKind(bucket: Partial<Record<PunchKind, Punch>>): PunchKind | null {
  for (const k of PUNCH_ORDER) if (!bucket[k]) return k;
  return null;
}

export function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;
}

export function monthRange(key: string): { start: string; end: string } {
  const [y, m] = key.split("-").map(Number);
  const start = new Date(y!, (m ?? 1) - 1, 1, 0, 0, 0);
  const end = new Date(y!, m ?? 1, 1, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}
