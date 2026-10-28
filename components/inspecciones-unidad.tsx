import Link from "next/link";
import { Camera, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFechaHora } from "@/lib/utils";
import {
  TIPO_INSPECCION_LABEL,
  codigoDanio,
  labelArea,
  labelTipo,
} from "@/modules/logistica/domain/constants";
import type { Danio, Inspeccion } from "@/modules/logistica/domain/types";
import { ReclamoBadge, ResponsableBadge, ResultadoBadge } from "@/modules/logistica/ui/badges";
import { NuevaInspeccionButton } from "@/components/nueva-inspeccion-button";

/**
 * Historial de inspecciones y daños de una unidad: quién la recibió,
 * en qué estado, y cada daño con su reclamo. Es la cadena de custodia.
 */
export function InspeccionesUnidad({
  unidadId,
  estadoActual,
  inspecciones,
  danios,
}: {
  unidadId: string;
  estadoActual: string;
  inspecciones: Inspeccion[];
  danios: Danio[];
}) {
  const sinRecepcion =
    (estadoActual === "en_transito" || estadoActual === "compra_0km") &&
    !inspecciones.some((i) => i.tipo === "recepcion_batea" && i.estado === "cerrada");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Inspecciones y daños</CardTitle>
        <NuevaInspeccionButton unidadId={unidadId} estadoActual={estadoActual} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {sinRecepcion ? (
          <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning-muted/40 px-3 py-2 text-xs text-warning">
            <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Esta unidad todavía no tiene inspección de recepción. No va a poder pasar a stock físico hasta inspeccionarla.
          </div>
        ) : null}

        {inspecciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin inspecciones registradas.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {inspecciones.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{TIPO_INSPECCION_LABEL[i.tipo]}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatFechaHora(i.cerrada_at ?? i.abierta_at)}
                    {i.inspector_nombre ? ` · ${i.inspector_nombre}` : ""}
                    {i.km != null ? ` · ${i.km} km` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {i.estado === "abierta" ? (
                    <span className="rounded-full bg-warning-muted px-2 py-0.5 text-xs font-medium text-warning">Abierta</span>
                  ) : (
                    <ResultadoBadge resultado={i.resultado} />
                  )}
                  <Link href={`/inspeccion/${i.id}`} className="text-xs text-primary hover:underline">
                    {i.estado === "abierta" ? "Continuar" : "Ver"}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        {danios.length > 0 ? (
          <div>
            <div className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5" /> Daños ({danios.length})
            </div>
            <ul className="divide-y divide-border rounded-md border border-border">
              {danios.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm">
                      {labelArea(d.zona)} · {labelTipo(d.tipo)}{" "}
                      <span className="font-mono text-xs text-muted-foreground">{codigoDanio(d.zona, d.tipo, d.gravedad)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{formatFechaHora(d.created_at)}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <ResponsableBadge responsable={d.responsable} />
                    <ReclamoBadge estado={d.estado_reclamo} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
