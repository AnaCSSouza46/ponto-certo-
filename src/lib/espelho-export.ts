import { type DaySummary, formatDateBR, formatMinutes, formatTime } from "@/lib/ponto";

export interface EspelhoInfo {
  nome: string;
  email?: string | null | undefined;
  mes: string; // YYYY-MM
  jornadaMinutos: number;
  dias: DaySummary[];
}

const HEAD = ["Dia", "Entrada", "Saída almoço", "Retorno", "Saída", "Trabalhado", "Saldo"];

function rows(dias: DaySummary[]): string[][] {
  return [...dias]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((d) => [
      formatDateBR(d.date),
      formatTime(d.punches.entrada?.punched_at),
      formatTime(d.punches.saida_almoco?.punched_at),
      formatTime(d.punches.volta_almoco?.punched_at),
      formatTime(d.punches.saida?.punched_at),
      formatMinutes(d.workedMinutes),
      d.complete ? formatMinutes(d.balanceMinutes) : "Incompleto",
    ]);
}

function totals(dias: DaySummary[]) {
  return {
    trabalhado: dias.reduce((a, d) => a + d.workedMinutes, 0),
    saldo: dias.reduce((a, d) => a + d.balanceMinutes, 0),
  };
}

function mesLabel(mes: string) {
  const [y = 2000, m = 1] = mes.split("-").map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fileBase(info: EspelhoInfo) {
  const slug = info.nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `espelho-ponto-${slug || "colaborador"}-${info.mes}`;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportarCSV(info: EspelhoInfo) {
  const esc = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const t = totals(info.dias);
  const lines = [
    ["Colaborador", info.nome],
    ["Mês", mesLabel(info.mes)],
    ["Jornada diária", formatMinutes(info.jornadaMinutos)],
    [],
    HEAD,
    ...rows(info.dias),
    [],
    ["Total trabalhado", formatMinutes(t.trabalhado)],
    ["Saldo do mês", formatMinutes(t.saldo)],
  ];
  // BOM + ";" para abrir corretamente no Excel em português
  const csv = "\uFEFF" + lines.map((l) => l.map(esc).join(";")).join("\r\n");
  download(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${fileBase(info)}.csv`);
}

export async function exportarPDF(info: EspelhoInfo) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const t = totals(info.dias);
  const w = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.text("Espelho de ponto", 40, 50);
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Colaborador: ${info.nome}${info.email ? ` (${info.email})` : ""}`, 40, 70);
  doc.text(`Período: ${mesLabel(info.mes)}   ·   Jornada diária: ${formatMinutes(info.jornadaMinutos)}`, 40, 85);

  autoTable(doc, {
    startY: 100,
    head: [HEAD],
    body: rows(info.dias),
    foot: [["Totais", "", "", "", "", formatMinutes(t.trabalhado), formatMinutes(t.saldo)]],
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [30, 90, 140] },
    footStyles: { fillColor: [230, 236, 242], textColor: 20, fontStyle: "bold" },
    margin: { left: 40, right: 40 },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;
  const y = Math.min(finalY + 70, doc.internal.pageSize.getHeight() - 60);
  doc.setTextColor(40);
  doc.line(40, y, w / 2 - 20, y);
  doc.line(w / 2 + 20, y, w - 40, y);
  doc.text("Assinatura do colaborador", 40, y + 14);
  doc.text("Assinatura do gestor", w / 2 + 20, y + 14);
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 40, doc.internal.pageSize.getHeight() - 25);

  doc.save(`${fileBase(info)}.pdf`);
}
