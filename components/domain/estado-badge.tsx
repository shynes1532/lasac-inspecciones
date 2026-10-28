import { Badge } from "@/components/ui/badge";
import type { EstadoUnidad } from "@/lib/types/database";

const CONFIG: Record<
  EstadoUnidad,
  { label: string; variant: "info" | "success" | "warning" | "destructive" | "muted" | "default" | "accent" }
> = {
  compra_0km: { label: "Compra 0KM", variant: "info" },
  en_transito: { label: "En tránsito", variant: "info" },
  stock_fisico: { label: "Stock físico", variant: "success" },
  boleto: { label: "Boleto", variant: "warning" },
  facturada_sin_registro: {
    label: "Facturada · pdte. registro",
    variant: "warning",
  },
  en_registro: { label: "En registro", variant: "warning" },
  dominio_sin_entrega: { label: "Dominio · sin entrega", variant: "warning" },
  entregada: { label: "Entregada", variant: "muted" },
  anulada: { label: "Anulada", variant: "destructive" },
};

export function EstadoBadge({ estado }: { estado: EstadoUnidad }) {
  const cfg = CONFIG[estado];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export const ESTADO_LABELS = Object.fromEntries(
  Object.entries(CONFIG).map(([k, v]) => [k, v.label]),
) as Record<EstadoUnidad, string>;
