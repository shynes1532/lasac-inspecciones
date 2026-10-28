import { Building2 } from "lucide-react";
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
import { formatARS } from "@/lib/utils";
import type { ResumenTransportista } from "../domain/types";
import { OrigenBadge } from "./badges";

export function TablaTransportistas({ filas }: { filas: ResumenTransportista[] }) {
  if (filas.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Todavía no hay viajes"
        description="Cuando haya bateas cerradas vas a ver daños por transportista, origen y marca para negociar con datos."
      />
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Transportista</TableHead>
          <TableHead>Origen</TableHead>
          <TableHead>Marca</TableHead>
          <TableHead>Destino</TableHead>
          <TableHead className="text-right">Viajes</TableHead>
          <TableHead className="text-right">Unidades</TableHead>
          <TableHead className="text-right">Daños</TableHead>
          <TableHead className="text-right">Tasa</TableHead>
          <TableHead className="text-right">Estimado</TableHead>
          <TableHead className="text-right">Recuperado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filas.map((f, i) => {
          const tasa = f.unidades > 0 ? (f.danios / f.unidades) * 100 : 0;
          return (
            <TableRow key={`${f.empresa_transporte}-${f.origen}-${f.marca}-${f.sucursal_destino}-${i}`}>
              <TableCell className="font-medium">{f.empresa_transporte}</TableCell>
              <TableCell><OrigenBadge origen={f.origen} /></TableCell>
              <TableCell>{f.marca ?? <span className="text-muted-foreground">Mixta</span>}</TableCell>
              <TableCell><SucursalBadge sucursal={f.sucursal_destino} /></TableCell>
              <TableCell className="text-right tabular-nums">{f.viajes}</TableCell>
              <TableCell className="text-right tabular-nums">{f.unidades}</TableCell>
              <TableCell className="text-right tabular-nums">
                {f.danios}
                {f.danios_transporte > 0 ? (
                  <span className="text-xs text-muted-foreground"> ({f.danios_transporte} transp.)</span>
                ) : null}
              </TableCell>
              <TableCell className={`text-right tabular-nums ${tasa >= 20 ? "text-destructive font-medium" : tasa >= 10 ? "text-warning" : ""}`}>
                {tasa.toFixed(0)}%
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatARS(f.monto_estimado)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatARS(f.monto_recuperado)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
