"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SucursalBadge } from "@/components/domain/sucursal-badge";
import { toast } from "@/hooks/use-toast";
import { formatARS, formatFecha } from "@/lib/utils";
import { actualizarReclamoAction } from "../actions";
import {
  ESTADO_RECLAMO_LABEL,
  RESPONSABLE_LABEL,
  codigoDanio,
  labelArea,
  labelTipo,
  type EstadoReclamo,
  type ResponsableDanio,
} from "../domain/constants";
import type { DanioTablero } from "../domain/types";
import { ReclamoBadge, ResponsableBadge } from "./badges";

const SELECT_CLS =
  "flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

export function TableroDanios({ danios }: { danios: DanioTablero[] }) {
  const [editando, setEditando] = useState<DanioTablero | null>(null);

  if (danios.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Sin daños abiertos"
        description="Los daños que se registren en una inspección aparecen acá para seguir el reclamo al transportista o a fábrica."
      />
    );
  }

  const totalEstimado = danios.reduce((a, d) => a + Number(d.monto_estimado ?? 0), 0);
  const totalRecuperado = danios.reduce((a, d) => a + Number(d.monto_recuperado ?? 0), 0);

  return (
    <>
      <div className="flex flex-wrap gap-4 border-b border-border px-4 py-3 text-sm">
        <span>
          <span className="text-muted-foreground">Daños:</span> <strong>{danios.length}</strong>
        </span>
        <span>
          <span className="text-muted-foreground">Estimado:</span> <strong>{formatARS(totalEstimado)}</strong>
        </span>
        <span>
          <span className="text-muted-foreground">Recuperado:</span> <strong>{formatARS(totalRecuperado)}</strong>
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead>Daño</TableHead>
            <TableHead>Batea / transporte</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Reclamo</TableHead>
            <TableHead className="text-right">Estimado</TableHead>
            <TableHead className="text-right">Recuperado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {danios.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="tabular-nums whitespace-nowrap">{formatFecha(d.created_at)}</TableCell>
              <TableCell>
                <div className="font-mono text-xs">
                  <Link href={`/unidades/${d.unidad_id}`} className="text-primary hover:underline">
                    {d.unidad?.stock_interno}
                  </Link>
                </div>
                <div className="max-w-[220px] truncate text-xs text-muted-foreground">{d.unidad?.descripcion_unidad}</div>
                {d.unidad?.sucursal ? <SucursalBadge sucursal={d.unidad.sucursal} /> : null}
              </TableCell>
              <TableCell>
                <div className="font-medium">{labelArea(d.zona)}</div>
                <div className="text-xs text-muted-foreground">
                  {labelTipo(d.tipo)} · gravedad {d.gravedad} ·{" "}
                  <span className="font-mono">{codigoDanio(d.zona, d.tipo, d.gravedad)}</span>
                </div>
                {d.descripcion ? <div className="text-xs">{d.descripcion}</div> : null}
                {d.inspeccion_id ? (
                  <Link href={`/inspeccion/${d.inspeccion_id}`} className="text-xs text-primary hover:underline">
                    Ver evidencia
                  </Link>
                ) : null}
              </TableCell>
              <TableCell>
                {d.batea ? (
                  <>
                    <div className="font-mono text-xs">{d.batea.numero}</div>
                    <div className="text-xs text-muted-foreground">{d.batea.empresa_transporte ?? "—"}</div>
                  </>
                ) : (
                  <span className="text-muted-foreground">Sin batea</span>
                )}
              </TableCell>
              <TableCell><ResponsableBadge responsable={d.responsable} /></TableCell>
              <TableCell>
                <ReclamoBadge estado={d.estado_reclamo} />
                {d.nro_reclamo ? <div className="mt-1 font-mono text-xs">{d.nro_reclamo}</div> : null}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatARS(d.monto_estimado)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatARS(d.monto_recuperado)}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => setEditando(d)} aria-label="Gestionar reclamo">
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editando ? <DialogReclamo danio={editando} onClose={() => setEditando(null)} /> : null}
    </>
  );
}

function DialogReclamo({ danio, onClose }: { danio: DanioTablero; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    responsable: danio.responsable,
    estado_reclamo: danio.estado_reclamo,
    monto_estimado: danio.monto_estimado?.toString() ?? "",
    monto_recuperado: danio.monto_recuperado?.toString() ?? "",
    fecha_reclamo: danio.fecha_reclamo ?? "",
    nro_reclamo: danio.nro_reclamo ?? "",
    notas_reclamo: danio.notas_reclamo ?? "",
  });

  const guardar = () => {
    startTransition(async () => {
      const r = await actualizarReclamoAction(danio.id, {
        ...form,
        monto_estimado: form.monto_estimado === "" ? null : Number(form.monto_estimado),
        monto_recuperado: form.monto_recuperado === "" ? null : Number(form.monto_recuperado),
      });
      if (!r.ok) {
        toast({ title: "No se pudo guardar", description: r.error, variant: "destructive" });
        return;
      }
      toast({ title: "Reclamo actualizado", variant: "success" });
      onClose();
      router.refresh();
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Reclamo · {labelArea(danio.zona)} ({labelTipo(danio.tipo)})
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="responsable">Responsable</Label>
            <select
              id="responsable"
              className={SELECT_CLS}
              value={form.responsable}
              onChange={(e) => setForm({ ...form, responsable: e.target.value as ResponsableDanio })}
            >
              {(Object.keys(RESPONSABLE_LABEL) as ResponsableDanio[]).map((k) => (
                <option key={k} value={k}>{RESPONSABLE_LABEL[k]}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="estado_reclamo">Estado del reclamo</Label>
            <select
              id="estado_reclamo"
              className={SELECT_CLS}
              value={form.estado_reclamo}
              onChange={(e) => setForm({ ...form, estado_reclamo: e.target.value as EstadoReclamo })}
            >
              {(Object.keys(ESTADO_RECLAMO_LABEL) as EstadoReclamo[]).map((k) => (
                <option key={k} value={k}>{ESTADO_RECLAMO_LABEL[k]}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="monto_estimado">Monto estimado (ARS)</Label>
            <Input id="monto_estimado" type="number" inputMode="decimal" value={form.monto_estimado} onChange={(e) => setForm({ ...form, monto_estimado: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="monto_recuperado">Monto recuperado (ARS)</Label>
            <Input id="monto_recuperado" type="number" inputMode="decimal" value={form.monto_recuperado} onChange={(e) => setForm({ ...form, monto_recuperado: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="fecha_reclamo">Fecha de reclamo</Label>
            <Input id="fecha_reclamo" type="date" value={form.fecha_reclamo} onChange={(e) => setForm({ ...form, fecha_reclamo: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="nro_reclamo">N° de reclamo / expediente</Label>
            <Input id="nro_reclamo" value={form.nro_reclamo} onChange={(e) => setForm({ ...form, nro_reclamo: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Label htmlFor="notas_reclamo">Notas</Label>
            <Textarea id="notas_reclamo" rows={3} value={form.notas_reclamo} onChange={(e) => setForm({ ...form, notas_reclamo: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button onClick={guardar} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
