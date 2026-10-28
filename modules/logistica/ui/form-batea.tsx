"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SUCURSAL_LABELS } from "@/components/domain/sucursal-badge";
import { MARCAS } from "@/lib/types/catalogo";
import type { Sucursal } from "@/lib/types/database";
import { crearBateaAction, type LogisticaResult } from "../actions";
import { ORIGEN_LABEL, type OrigenBatea } from "../domain/constants";
import { SelectorUnidades, type UnidadCandidata } from "./selector-unidades";

const SELECT_CLS =
  "flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";
const SUCURSALES: Sucursal[] = ["rio_grande", "ushuaia", "austral"];

function BotonCrear() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
      Crear batea
    </Button>
  );
}

export function FormBatea({ unidades }: { unidades: UnidadCandidata[] }) {
  const [state, action] = useFormState<LogisticaResult | null, FormData>(crearBateaAction, null);
  const [origen, setOrigen] = useState<OrigenBatea>("buenos_aires");
  const [marca, setMarca] = useState<string>("");

  return (
    <form action={action} className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Datos del viaje</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="origen">Origen</Label>
            <select id="origen" name="origen" className={SELECT_CLS} value={origen} onChange={(e) => setOrigen(e.target.value as OrigenBatea)}>
              {(Object.keys(ORIGEN_LABEL) as OrigenBatea[]).map((k) => (
                <option key={k} value={k}>{ORIGEN_LABEL[k]}</option>
              ))}
            </select>
          </div>
          {origen === "interna" ? (
            <div className="flex flex-col gap-1">
              <Label htmlFor="sucursal_origen">Sucursal de origen</Label>
              <select id="sucursal_origen" name="sucursal_origen" className={SELECT_CLS} defaultValue="rio_grande">
                {SUCURSALES.map((s) => (
                  <option key={s} value={s}>{SUCURSAL_LABELS[s]}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="hidden sm:block" />
          )}
          <div className="flex flex-col gap-1">
            <Label htmlFor="sucursal_destino">Sucursal destino</Label>
            <select id="sucursal_destino" name="sucursal_destino" className={SELECT_CLS} defaultValue="rio_grande">
              {SUCURSALES.map((s) => (
                <option key={s} value={s}>{SUCURSAL_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="marca">Marca (filtra las unidades)</Label>
            <select id="marca" name="marca" className={SELECT_CLS} value={marca} onChange={(e) => setMarca(e.target.value)}>
              <option value="">Mixta / sin especificar</option>
              {MARCAS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="empresa_transporte">Empresa de transporte</Label>
            <Input id="empresa_transporte" name="empresa_transporte" placeholder="Ej. Transportes del Sur" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="nro_remito">N° de remito / CMR</Label>
            <Input id="nro_remito" name="nro_remito" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="chofer_nombre">Chofer</Label>
            <Input id="chofer_nombre" name="chofer_nombre" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="chofer_dni">DNI chofer</Label>
            <Input id="chofer_dni" name="chofer_dni" inputMode="numeric" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="chofer_telefono">Teléfono chofer</Label>
            <Input id="chofer_telefono" name="chofer_telefono" inputMode="tel" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="patente_camion">Patente camión</Label>
            <Input id="patente_camion" name="patente_camion" className="font-mono uppercase" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="patente_batea">Patente batea</Label>
            <Input id="patente_batea" name="patente_batea" className="font-mono uppercase" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="fecha_salida">Fecha de salida</Label>
            <Input id="fecha_salida" name="fecha_salida" type="date" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="fecha_estimada_arribo">Arribo estimado</Label>
            <Input id="fecha_estimada_arribo" name="fecha_estimada_arribo" type="date" />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea id="observaciones" name="observaciones" rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unidades que viajan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Podés dejarla vacía y cargar las unidades después. Las compradas que subas pasan a &quot;en tránsito&quot;.
          </p>
          <SelectorUnidades unidades={unidades} marca={marca || null} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 lg:col-span-2">
        {state && !state.ok ? (
          <p className="rounded-md bg-destructive-muted px-3 py-2 text-sm text-destructive">{state.error}</p>
        ) : null}
        <div className="flex justify-end">
          <BotonCrear />
        </div>
      </div>
    </form>
  );
}
