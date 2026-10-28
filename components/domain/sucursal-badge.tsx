import { cn } from "@/lib/utils";
import type { Sucursal } from "@/lib/types/database";

const CONFIG: Record<Sucursal, { label: string; classes: string }> = {
  ushuaia: {
    label: "Ushuaia",
    // Violeta suave
    classes: "bg-violet-50 text-violet-700 border-violet-200",
  },
  rio_grande: {
    label: "Río Grande",
    // Cyan suave
    classes: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  austral: {
    label: "Austral",
    // Ámbar suave (multimarca)
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  legacy_pendiente: {
    label: "Sin asignar",
    classes: "bg-destructive-muted text-destructive border-transparent",
  },
};

export function SucursalBadge({ sucursal }: { sucursal: Sucursal }) {
  const cfg = CONFIG[sucursal];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        cfg.classes,
      )}
    >
      {cfg.label}
    </span>
  );
}

export const SUCURSAL_LABELS = Object.fromEntries(
  Object.entries(CONFIG).map(([k, v]) => [k, v.label]),
) as Record<Sucursal, string>;
