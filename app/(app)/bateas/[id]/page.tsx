import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SucursalBadge } from "@/components/domain/sucursal-badge";
import { formatARS, formatFecha, formatFechaHora } from "@/lib/utils";
import {
  listarUnidadesBatea,
  listarUnidadesParaBatea,
  obtenerBatea,
} from "@/modules/logistica/data/repo";
import { ORIGEN_LABEL } from "@/modules/logistica/domain/constants";
import { AccionesBatea, UnidadesBatea } from "@/modules/logistica/ui/batea-detalle";
import { EstadoBateaBadge, OrigenBadge } from "@/modules/logistica/ui/badges";

export const dynamic = "force-dynamic";

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-2 border-b border-border/60 py-2 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-sm" : "text-sm"}>
        {value ?? <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}

export default async function BateaPage({ params }: { params: { id: string } }) {
  const batea = await obtenerBatea(params.id);
  if (!batea) notFound();

  const [filas, candidatas] = await Promise.all([
    listarUnidadesBatea(batea.id),
    listarUnidadesParaBatea(),
  ]);

  const pendientes = batea.unidades_total - batea.unidades_inspeccionadas - batea.unidades_faltantes;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={`Batea ${batea.numero}`}
        description={`${ORIGEN_LABEL[batea.origen]} → ${batea.sucursal_destino.replace("_", " ")} · ${batea.empresa_transporte ?? "sin transportista"}`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <EstadoBateaBadge estado={batea.estado} />
        <OrigenBadge origen={batea.origen} />
        {batea.sucursal_origen ? <SucursalBadge sucursal={batea.sucursal_origen} /> : null}
        <span className="text-muted-foreground">→</span>
        <SucursalBadge sucursal={batea.sucursal_destino} />
        {batea.marca ? <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{batea.marca}</span> : null}
      </div>

      <AccionesBatea batea={batea} />

      {batea.estado === "arribada" && pendientes > 0 ? (
        <div className="rounded-lg border border-warning/40 bg-warning-muted/40 px-4 py-3 text-sm text-warning">
          <strong>{pendientes}</strong> unidad{pendientes === 1 ? "" : "es"} sin inspeccionar. No se bajan de la batea sin
          fotos: si el chofer apura, dejá la reserva escrita en el remito.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Viaje</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col">
                <Row label="Transporte" value={batea.empresa_transporte} />
                <Row label="Chofer" value={batea.chofer_nombre ? `${batea.chofer_nombre}${batea.chofer_dni ? ` · DNI ${batea.chofer_dni}` : ""}` : null} />
                <Row label="Teléfono" value={batea.chofer_telefono} mono />
                <Row label="Camión" value={batea.patente_camion} mono />
                <Row label="Batea" value={batea.patente_batea} mono />
                <Row label="Remito" value={batea.nro_remito} mono />
                <Row label="Salida" value={batea.fecha_salida ? formatFecha(batea.fecha_salida) : null} />
                <Row label="Arribo estimado" value={batea.fecha_estimada_arribo ? formatFecha(batea.fecha_estimada_arribo) : null} />
                <Row label="Arribo real" value={batea.fecha_arribo_real ? formatFechaHora(batea.fecha_arribo_real) : null} />
                <Row label="Observaciones" value={batea.observaciones} />
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Resultado</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col">
                <Row label="Unidades" value={`${batea.unidades_inspeccionadas} inspeccionadas / ${batea.unidades_total}`} />
                <Row label="Faltantes" value={batea.unidades_faltantes} />
                <Row label="Daños" value={`${batea.danios_total} (${batea.danios_transporte} atribuidos al transporte)`} />
                <Row label="Estimado" value={formatARS(batea.monto_danios_estimado)} />
                <Row label="Recuperado" value={formatARS(batea.monto_danios_recuperado)} />
              </dl>
            </CardContent>
          </Card>
        </div>

        <UnidadesBatea batea={batea} filas={filas} candidatas={candidatas} />
      </div>
    </section>
  );
}
