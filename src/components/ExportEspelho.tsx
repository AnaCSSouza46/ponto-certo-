import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { type EspelhoInfo, exportarCSV, exportarPDF } from "@/lib/espelho-export";

export function ExportEspelho({ info }: { info: EspelhoInfo | null }) {
  const [busy, setBusy] = useState(false);
  const disabled = !info || info.dias.length === 0 || busy;

  async function pdf() {
    if (!info) return;
    setBusy(true);
    try {
      await exportarPDF(info);
    } catch {
      toast.error("Não foi possível gerar o PDF");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" disabled={disabled} onClick={pdf}>
        <Download className="size-4" /> PDF
      </Button>
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => info && exportarCSV(info)}>
        <Download className="size-4" /> CSV
      </Button>
    </div>
  );
}
