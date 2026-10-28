"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUCURSAL_LABELS } from "@/components/domain/sucursal-badge";
import { MARCAS } from "@/lib/types/catalogo";
import type { Sucursal } from "@/lib/types/database";
import { ESTADO_BATEA_LABEL, ORIGEN_LABEL } from "../domain/constants";

const SUCURSALES: Sucursal[] = ["rio_grande", "ushuaia", "austral"];

export function FiltrosBateas() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params);
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "" || v === "todas" || v === "todos") next.delete(k);
        else next.set(k, v);
      }
      router.replace(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <div className="relative flex-1 min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          defaultValue={params.get("q") ?? ""}
          placeholder="Buscar por número, transportista, chofer, remito o patente…"
          className="pl-9"
          onChange={(e) => update({ q: e.target.value })}
          aria-label="Buscar bateas"
        />
      </div>
      <Select value={params.get("estado") ?? "abiertas"} onValueChange={(v) => update({ estado: v })}>
        <SelectTrigger className="w-full lg:w-40" aria-label="Estado"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="abiertas">Abiertas</SelectItem>
          <SelectItem value="todas">Todas</SelectItem>
          {(Object.keys(ESTADO_BATEA_LABEL) as Array<keyof typeof ESTADO_BATEA_LABEL>).map((k) => (
            <SelectItem key={k} value={k}>{ESTADO_BATEA_LABEL[k]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={params.get("origen") ?? "todos"} onValueChange={(v) => update({ origen: v })}>
        <SelectTrigger className="w-full lg:w-44" aria-label="Origen"><SelectValue placeholder="Origen" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los orígenes</SelectItem>
          {(Object.keys(ORIGEN_LABEL) as Array<keyof typeof ORIGEN_LABEL>).map((k) => (
            <SelectItem key={k} value={k}>{ORIGEN_LABEL[k]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={params.get("marca") ?? "todas"} onValueChange={(v) => update({ marca: v })}>
        <SelectTrigger className="w-full lg:w-36" aria-label="Marca"><SelectValue placeholder="Marca" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas las marcas</SelectItem>
          {MARCAS.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={params.get("sucursal") ?? "todas"} onValueChange={(v) => update({ sucursal: v })}>
        <SelectTrigger className="w-full lg:w-40" aria-label="Destino"><SelectValue placeholder="Destino" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todos los destinos</SelectItem>
          {SUCURSALES.map((s) => (
            <SelectItem key={s} value={s}>{SUCURSAL_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
