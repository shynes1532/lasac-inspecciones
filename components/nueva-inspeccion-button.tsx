"use client";

import { useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { abrirInspeccionAction } from "@/modules/logistica/actions";
import { TIPO_INSPECCION_LABEL, type TipoInspeccion } from "@/modules/logistica/domain/constants";

const TIPOS: TipoInspeccion[] = ["recepcion_batea", "traslado_interno", "test_drive", "pre_entrega", "otro"];

/** Abre una inspección de cualquier tipo desde la ficha de la unidad (sin batea). */
export function NuevaInspeccionButton({ unidadId, estadoActual }: { unidadId: string; estadoActual: string }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const abrir = (tipo: TipoInspeccion) => {
    startTransition(async () => {
      const r = await abrirInspeccionAction({ unidadId, tipo });
      if (r && !r.ok) toast({ title: "No se pudo abrir", description: r.error, variant: "destructive" });
    });
  };

  const tipos = estadoActual === "entregada" || estadoActual === "anulada" ? TIPOS.filter((t) => t === "otro") : TIPOS;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          Inspeccionar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {tipos.map((t) => (
          <DropdownMenuItem key={t} onSelect={() => abrir(t)}>
            {TIPO_INSPECCION_LABEL[t]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
