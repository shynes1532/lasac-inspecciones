import { Badge } from "@/components/ui/badge";
import {
  ESTADO_BATEA_LABEL,
  ESTADO_RECLAMO_LABEL,
  ORIGEN_LABEL,
  RESPONSABLE_LABEL,
  RESULTADO_LABEL,
  type EstadoBatea,
  type EstadoReclamo,
  type OrigenBatea,
  type ResponsableDanio,
  type ResultadoInspeccion,
} from "../domain/constants";

const ESTADO_BATEA_VARIANT: Record<EstadoBatea, "info" | "warning" | "success" | "muted" | "destructive"> = {
  programada: "muted",
  en_ruta: "info",
  arribada: "warning",
  cerrada: "success",
  cancelada: "destructive",
};

export function EstadoBateaBadge({ estado }: { estado: EstadoBatea }) {
  return <Badge variant={ESTADO_BATEA_VARIANT[estado]}>{ESTADO_BATEA_LABEL[estado]}</Badge>;
}

export function OrigenBadge({ origen }: { origen: OrigenBatea }) {
  return (
    <Badge variant={origen === "interna" ? "outline" : "default"}>
      {origen === "interna" ? "Interna" : ORIGEN_LABEL[origen]}
    </Badge>
  );
}

const RESULTADO_VARIANT: Record<ResultadoInspeccion, "success" | "destructive" | "warning"> = {
  ok: "success",
  con_danios: "destructive",
  faltantes: "warning",
};

export function ResultadoBadge({ resultado }: { resultado: ResultadoInspeccion | null }) {
  if (!resultado) return <Badge variant="muted">Pendiente</Badge>;
  return <Badge variant={RESULTADO_VARIANT[resultado]}>{RESULTADO_LABEL[resultado]}</Badge>;
}

const RECLAMO_VARIANT: Record<EstadoReclamo, "muted" | "info" | "success" | "destructive" | "warning"> = {
  detectado: "warning",
  reclamado: "info",
  aceptado: "success",
  rechazado: "destructive",
  reparado: "success",
  cerrado: "muted",
};

export function ReclamoBadge({ estado }: { estado: EstadoReclamo }) {
  return <Badge variant={RECLAMO_VARIANT[estado]}>{ESTADO_RECLAMO_LABEL[estado]}</Badge>;
}

export function ResponsableBadge({ responsable }: { responsable: ResponsableDanio }) {
  return (
    <Badge variant={responsable === "transporte" ? "accent" : responsable === "interno" ? "warning" : "outline"}>
      {RESPONSABLE_LABEL[responsable]}
    </Badge>
  );
}
