import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EstadoBadge } from "@/components/domain/estado-badge";
import { SucursalBadge } from "@/components/domain/sucursal-badge";
import { InspeccionesUnidad } from "@/components/inspecciones-unidad";
import { createClient } from "@/lib/supabase/server";
import type { UnidadResumen } from "@/lib/types/database";
import { formatFecha } from "@/lib/utils";
import { listarDaniosUnidad, listarInspeccionesUnidad } from "@/modules/logistica/data/repo";

export const dynamic = "force-dynamic";

export default async function UnidadPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("unidades")
    .select("id, stock_interno, sucursal, estado_actual, tipo, marca, descripcion_unidad, chasis, color_descripcion, fecha_arribo, fecha_despacho, created_at")
    .eq("id", params.id)
    .is("deleted_at", null)
    .maybeSingle<UnidadResumen>();
  if (!data) notFound();
  const unidad = data;

  const [inspecciones, danios] = await Promise.all([
    listarInspeccionesUnidad(unidad.id),
    listarDaniosUnidad(unidad.id),
  ]);
  const dms = process.env.NEXT_PUBLIC_DMS_URL;

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title={unidad.descripcion_unidad}
        description={`Stock ${unidad.stock_interno} · ${unidad.chasis || "sin chasis"}${unidad.color_descripcion ? ` · ${unidad.color_descripcion}` : ""}`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/unidades">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
            {dms ? (
              <Button variant="outline" size="sm" asChild>
                <a href={`${dms}/stock/${unidad.id}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Ficha en DMS
                </a>
              </Button>
            ) : null}
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <EstadoBadge estado={unidad.estado_actual} />
        <SucursalBadge sucursal={unidad.sucursal} />
        {unidad.marca ? <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">{unidad.marca}</span> : null}
        {unidad.fecha_despacho ? <span>Despacho {formatFecha(unidad.fecha_despacho)}</span> : null}
        {unidad.fecha_arribo ? <span>Arribo {formatFecha(unidad.fecha_arribo)}</span> : null}
      </div>
      <InspeccionesUnidad
        unidadId={unidad.id}
        estadoActual={unidad.estado_actual}
        inspecciones={inspecciones}
        danios={danios}
      />
    </section>
  );
}
