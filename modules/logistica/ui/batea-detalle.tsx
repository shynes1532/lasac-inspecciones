"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, Loader2, PackageSearch, Plus, Trash2, Truck, XCircle, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EstadoBadge } from "@/components/domain/estado-badge";
import { toast } from "@/hooks/use-toast";
import type { EstadoUnidad } from "@/lib/types/database";
import {
  abrirInspeccionAction,
  agregarUnidadesBateaAction,
  cambiarEstadoBateaAction,
  marcarFaltanteAction,
  quitarUnidadBateaAction,
} from "../actions";
import type { BateaResumen, UnidadBatea } from "../domain/types";
import { ResultadoBadge } from "./badges";
import { SelectorUnidades, type UnidadCandidata } from "./selector-unidades";

export function AccionesBatea({ batea }: { batea: BateaResumen }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const cambiar = (estado: "en_ruta" | "arribada" | "cerrada" | "cancelada") => {
    startTransition(async () => {
      const r = await cambiarEstadoBateaAction(batea.id, estado);
      if (!r.ok) {
        toast({ title: "No se pudo actualizar", description: r.error, variant: "destructive" });
        return;
      }
      toast({ title: "Batea actualizada", variant: "success" });
      router.refresh();
    });
  };

  const pendientes = batea.unidades_total - batea.unidades_inspeccionadas - batea.unidades_faltantes;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {batea.estado === "programada" ? (
        <Button onClick={() => cambiar("en_ruta")} disabled={pending}>
          <Truck className="h-4 w-4" />
          Marcar en ruta
        </Button>
      ) : null}
      {batea.estado === "en_ruta" || batea.estado === "programada" ? (
        <Button variant={batea.estado === "en_ruta" ? "default" : "outline"} onClick={() => cambiar("arribada")} disabled={pending}>
          <PackageSearch className="h-4 w-4" />
          Llegó: empezar recepción
        </Button>
      ) : null}
      {batea.estado === "arribada" && pendientes === 0 && batea.unidades_total > 0 ? (
        <Button onClick={() => cambiar("cerrada")} disabled={pending}>
          <CheckCircle2 className="h-4 w-4" />
          Cerrar batea
        </Button>
      ) : null}
      {batea.estado !== "cerrada" && batea.estado !== "cancelada" ? (
        <Button variant="outline" onClick={() => cambiar("cancelada")} disabled={pending}>
          <Ban className="h-4 w-4" />
          Cancelar
        </Button>
      ) : null}
      {pending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
    </div>
  );
}

export function UnidadesBatea({
  batea,
  filas,
  candidatas,
}: {
  batea: BateaResumen;
  filas: UnidadBatea[];
  candidatas: UnidadCandidata[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [agregando, setAgregando] = useState(false);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const editable = batea.estado !== "cerrada" && batea.estado !== "cancelada";

  const inspeccionar = (unidadId: string) => {
    startTransition(async () => {
      const r = await abrirInspeccionAction({
        unidadId,
        tipo: "recepcion_batea",
        bateaId: batea.id,
        sucursal: batea.sucursal_destino,
      });
      // abrirInspeccionAction redirige; solo llega acá si falló.
      if (r && !r.ok) toast({ title: "No se pudo abrir la inspección", description: r.error, variant: "destructive" });
    });
  };

  const quitar = (filaId: string) => {
    startTransition(async () => {
      const r = await quitarUnidadBateaAction(batea.id, filaId);
      if (!r.ok) toast({ title: "No se pudo quitar", description: r.error, variant: "destructive" });
      router.refresh();
    });
  };

  const faltante = (filaId: string) => {
    startTransition(async () => {
      const r = await marcarFaltanteAction(batea.id, filaId);
      if (!r.ok) toast({ title: "No se pudo marcar", description: r.error, variant: "destructive" });
      else toast({ title: "Unidad marcada como faltante", variant: "success" });
      router.refresh();
    });
  };

  const agregar = () => {
    startTransition(async () => {
      const r = await agregarUnidadesBateaAction(batea.id, seleccion);
      if (!r.ok) {
        toast({ title: "No se pudieron agregar", description: r.error, variant: "destructive" });
        return;
      }
      toast({ title: `${seleccion.length} unidad(es) agregada(s)`, variant: "success" });
      setAgregando(false);
      setSeleccion([]);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Unidades ({filas.length})
        </CardTitle>
        {editable ? (
          <Button variant="outline" size="sm" onClick={() => setAgregando(true)}>
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="p-0">
        {filas.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">
            Todavía no hay unidades en esta batea.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filas.map((f) => {
              const u = f.unidad;
              const puedeInspeccionar =
                editable && f.estado_recepcion === "pendiente" && batea.estado !== "programada";
              return (
                <li key={f.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground tabular-nums">#{f.posicion ?? "—"}</span>
                      <Link href={`/unidades/${u.id}`} className="font-mono text-xs text-primary hover:underline">
                        {u.stock_interno}
                      </Link>
                      <EstadoBadge estado={u.estado_actual as EstadoUnidad} />
                      {f.estado_recepcion === "inspeccionada" ? (
                        <ResultadoBadge resultado={f.inspeccion?.resultado ?? null} />
                      ) : f.estado_recepcion === "faltante" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive-muted px-2 py-0.5 text-xs font-medium text-destructive">
                          <XCircle className="h-3 w-3" /> No vino
                        </span>
                      ) : (
                        <span className="rounded-full bg-warning-muted px-2 py-0.5 text-xs font-medium text-warning">Sin inspeccionar</span>
                      )}
                    </div>
                    <div className="truncate text-sm">{u.descripcion_unidad}</div>
                    <div className="truncate font-mono text-xs text-muted-foreground">
                      {u.chasis || "sin chasis"} {u.color_descripcion ? `· ${u.color_descripcion}` : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {f.inspeccion_id ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/inspeccion/${f.inspeccion_id}`}>Ver inspección</Link>
                      </Button>
                    ) : null}
                    {puedeInspeccionar ? (
                      <Button size="sm" onClick={() => inspeccionar(u.id)} disabled={pending}>
                        <Camera className="h-4 w-4" />
                        Inspeccionar
                      </Button>
                    ) : null}
                    {editable && f.estado_recepcion === "pendiente" && batea.estado !== "programada" ? (
                      <Button variant="outline" size="sm" onClick={() => faltante(f.id)} disabled={pending} title="No vino en la batea">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    ) : null}
                    {editable && f.estado_recepcion === "pendiente" ? (
                      <Button variant="outline" size="sm" onClick={() => quitar(f.id)} disabled={pending} aria-label="Quitar de la batea">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <Dialog open={agregando} onOpenChange={setAgregando}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar unidades a {batea.numero}</DialogTitle>
          </DialogHeader>
          <SelectorUnidades
            unidades={candidatas}
            marca={batea.marca}
            excluir={filas.map((f) => f.unidad_id)}
            onChange={setSeleccion}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgregando(false)} disabled={pending}>Cancelar</Button>
            <Button onClick={agregar} disabled={pending || seleccion.length === 0}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Agregar {seleccion.length > 0 ? `(${seleccion.length})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
