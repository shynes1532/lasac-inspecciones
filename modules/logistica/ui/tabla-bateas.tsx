import Link from "next/link";
import { Truck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SucursalBadge } from "@/components/domain/sucursal-badge";
import { formatFecha } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MARCA_BADGE } from "@/lib/types/catalogo";
import type { BateaResumen } from "../domain/types";
import { EstadoBateaBadge, OrigenBadge } from "./badges";

export function TablaBateas({ bateas }: { bateas: BateaResumen[] }) {
  if (bateas.length === 0) {
    return (
      <EmptyState
        icon={Truck}
        title="No hay bateas cargadas"
        description="Cargá la próxima batea con las unidades que vienen arriba. Al llegar, cada unidad se inspecciona desde el celular."
      />
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Batea</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Origen</TableHead>
          <TableHead>Destino</TableHead>
          <TableHead>Marca</TableHead>
          <TableHead>Transporte</TableHead>
          <TableHead>Salida</TableHead>
          <TableHead>Arribo</TableHead>
          <TableHead className="text-right">Unidades</TableHead>
          <TableHead className="text-right">Daños</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bateas.map((b) => {
          const pendientes = b.unidades_total - b.unidades_inspeccionadas - b.unidades_faltantes;
          return (
            <TableRow key={b.id}>
              <TableCell className="font-mono text-xs">
                <Link href={`/bateas/${b.id}`} className="text-primary hover:underline">
                  {b.numero}
                </Link>
              </TableCell>
              <TableCell><EstadoBateaBadge estado={b.estado} /></TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <OrigenBadge origen={b.origen} />
                  {b.origen === "interna" && b.sucursal_origen ? (
                    <SucursalBadge sucursal={b.sucursal_origen} />
                  ) : null}
                </div>
              </TableCell>
              <TableCell><SucursalBadge sucursal={b.sucursal_destino} /></TableCell>
              <TableCell>
                {b.marca ? (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                      MARCA_BADGE[b.marca as keyof typeof MARCA_BADGE] ?? "bg-muted text-muted-foreground border-transparent",
                    )}
                  >
                    {b.marca}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Mixta</span>
                )}
              </TableCell>
              <TableCell className="max-w-[200px]">
                <div className="truncate">{b.empresa_transporte ?? <span className="text-muted-foreground">—</span>}</div>
                {b.chofer_nombre ? (
                  <div className="truncate text-xs text-muted-foreground">{b.chofer_nombre}</div>
                ) : null}
              </TableCell>
              <TableCell className="tabular-nums whitespace-nowrap">{formatFecha(b.fecha_salida)}</TableCell>
              <TableCell className="tabular-nums whitespace-nowrap">
                {b.fecha_arribo_real ? (
                  formatFecha(b.fecha_arribo_real)
                ) : b.fecha_estimada_arribo ? (
                  <span className="text-muted-foreground">est. {formatFecha(b.fecha_estimada_arribo)}</span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span className="font-medium">{b.unidades_inspeccionadas}</span>
                <span className="text-muted-foreground">/{b.unidades_total}</span>
                {pendientes > 0 && b.estado === "arribada" ? (
                  <span className="ml-1 text-xs text-warning">({pendientes} sin inspeccionar)</span>
                ) : null}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {b.danios_total > 0 ? (
                  <span className="font-medium text-destructive">{b.danios_total}</span>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
