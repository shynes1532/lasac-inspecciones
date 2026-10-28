"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { EstadoBadge } from "@/components/domain/estado-badge";
import { SucursalBadge } from "@/components/domain/sucursal-badge";
import type { EstadoUnidad, Sucursal } from "@/lib/types/database";

export interface UnidadCandidata {
  id: string;
  stock_interno: string;
  descripcion_unidad: string;
  chasis: string;
  marca: string | null;
  color_descripcion: string | null;
  estado_actual: string;
  sucursal: Sucursal;
}

/**
 * Lista con checkboxes para elegir qué unidades suben a la batea.
 * Emite `unidad_ids` como inputs hidden para el form padre, o notifica
 * por `onChange` cuando se usa fuera de un form.
 */
export function SelectorUnidades({
  unidades,
  marca,
  excluir = [],
  onChange,
  nombreCampo = "unidad_ids",
}: {
  unidades: UnidadCandidata[];
  marca?: string | null;
  excluir?: string[];
  onChange?: (ids: string[]) => void;
  nombreCampo?: string;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());

  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase();
    return unidades
      .filter((u) => !excluir.includes(u.id))
      .filter((u) => !marca || (u.marca ?? "FIAT") === marca)
      .filter(
        (u) =>
          !t ||
          u.stock_interno.toLowerCase().includes(t) ||
          u.chasis.toLowerCase().includes(t) ||
          u.descripcion_unidad.toLowerCase().includes(t),
      )
      .slice(0, 150);
  }, [unidades, q, marca, excluir]);

  const toggle = (id: string, on: boolean) => {
    const next = new Set(sel);
    if (on) next.add(id);
    else next.delete(id);
    setSel(next);
    onChange?.(Array.from(next));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por stock, chasis o modelo…"
          className="pl-9"
          aria-label="Buscar unidades"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {sel.size} seleccionada{sel.size === 1 ? "" : "s"} · mostrando {visibles.length}
      </p>
      {Array.from(sel).map((id) => (
        <input key={id} type="hidden" name={nombreCampo} value={id} />
      ))}
      <ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-md border border-border">
        {visibles.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">Sin unidades para mostrar</li>
        ) : (
          visibles.map((u) => {
            const on = sel.has(u.id);
            return (
              <li key={u.id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/50">
                  <Checkbox checked={on} onCheckedChange={(v) => toggle(u.id, v === true)} aria-label={`Seleccionar ${u.stock_interno}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs">{u.stock_interno}</span>
                      <EstadoBadge estado={u.estado_actual as EstadoUnidad} />
                      <SucursalBadge sucursal={u.sucursal} />
                    </div>
                    <div className="truncate text-sm">{u.descripcion_unidad}</div>
                    <div className="truncate font-mono text-xs text-muted-foreground">
                      {u.chasis || "sin chasis"} {u.color_descripcion ? `· ${u.color_descripcion}` : ""}
                    </div>
                  </div>
                </label>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
