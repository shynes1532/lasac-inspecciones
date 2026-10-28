"use client";

// Pantalla de inspección pensada para el celular, al pie de la batea:
// datos → fotos por zona (solo cámara) → checklist → daños con foto →
// faltantes → firma del chofer → cerrar. Todo se guarda a medida que
// se carga, así si se corta la señal no se pierde nada.

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Lock,
  MapPin,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn, formatFechaHora } from "@/lib/utils";
import {
  cerrarInspeccionAction,
  eliminarDanioAction,
  guardarFirmaAction,
  guardarInspeccionAction,
  registrarDanioAction,
  registrarFotoAction,
} from "../actions";
import {
  AREAS_DANIO,
  FALTANTES_CATALOGO,
  GRAVEDADES,
  RESPONSABLE_LABEL,
  TIPOS_DANIO,
  TIPO_INSPECCION_LABEL,
  ZONA_FOTO_DANIO,
  codigoDanio,
  labelArea,
  labelTipo,
  zonasObligatorias,
  zonasPara,
  type ResponsableDanio,
} from "../domain/constants";
import type { ChecklistItem, Danio, FotoInspeccion, InspeccionCompleta } from "../domain/types";
import { FirmaPad } from "./firma-pad";
import { resumenDispositivo, subirEvidencia, urlFirmada } from "./subir-evidencia";
import { ResultadoBadge } from "./badges";

const SELECT_CLS =
  "flex h-11 w-full rounded-md border border-border bg-surface px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

type FotoLocal = Pick<FotoInspeccion, "id" | "zona" | "tomada_at" | "lat" | "lng"> & { url?: string };

export function InspeccionMobile({ data }: { data: InspeccionCompleta }) {
  const { inspeccion, unidad, batea } = data;
  const router = useRouter();
  const cerrada = inspeccion.estado !== "abierta";
  const zonas = useMemo(() => zonasPara(inspeccion.tipo), [inspeccion.tipo]);
  const obligatorias = useMemo(() => zonasObligatorias(inspeccion.tipo), [inspeccion.tipo]);

  const [fotos, setFotos] = useState<FotoLocal[]>(data.fotos);
  const [danios, setDanios] = useState<Danio[]>(data.danios);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [cerrando, startCerrar] = useTransition();

  // Datos del encabezado (autosave al salir del campo)
  const [datos, setDatos] = useState({
    km: inspeccion.km?.toString() ?? "",
    combustible_pct: inspeccion.combustible_pct?.toString() ?? "",
    chofer_nombre: inspeccion.chofer_nombre ?? "",
    chofer_dni: inspeccion.chofer_dni ?? "",
    remito_nro: inspeccion.remito_nro ?? "",
    remito_con_reservas: inspeccion.remito_con_reservas,
    reservas_texto: inspeccion.reservas_texto ?? "",
    observaciones: inspeccion.observaciones ?? "",
  });
  const [faltantes, setFaltantes] = useState<string[]>(inspeccion.faltantes ?? []);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    const base = new Map((inspeccion.checklist ?? []).map((c) => [c.zona, c]));
    return AREAS_DANIO.filter((a) => a.codigo !== "62").map(
      (a) => base.get(a.codigo) ?? { zona: a.codigo, estado: "ok" as const },
    );
  });
  const [firmaUrl, setFirmaUrl] = useState<string | null>(inspeccion.chofer_firma_path);
  const [firmaBlob, setFirmaBlob] = useState<Blob | null>(null);
  const [guardandoFirma, setGuardandoFirma] = useState(false);
  const [danioDialog, setDanioDialog] = useState<{ zona?: string } | null>(null);

  // Registrar dispositivo una sola vez
  const dispositivoGuardado = useRef(false);
  useEffect(() => {
    if (cerrada || dispositivoGuardado.current || inspeccion.dispositivo) return;
    dispositivoGuardado.current = true;
    void guardarInspeccionAction(inspeccion.id, { dispositivo: resumenDispositivo() });
  }, [cerrada, inspeccion.id, inspeccion.dispositivo]);

  const guardar = useCallback(
    async (patch: Record<string, unknown>) => {
      if (cerrada) return;
      const r = await guardarInspeccionAction(inspeccion.id, patch);
      if (!r.ok) toast({ title: "No se guardó", description: r.error, variant: "destructive" });
    },
    [cerrada, inspeccion.id],
  );

  const guardarDatos = () =>
    guardar({
      km: datos.km === "" ? null : Number(datos.km),
      combustible_pct: datos.combustible_pct === "" ? null : Number(datos.combustible_pct),
      chofer_nombre: datos.chofer_nombre,
      chofer_dni: datos.chofer_dni,
      remito_nro: datos.remito_nro,
      remito_con_reservas: datos.remito_con_reservas,
      reservas_texto: datos.reservas_texto,
      observaciones: datos.observaciones,
    });

  const subirFoto = async (zona: string, file: File): Promise<FotoLocal | null> => {
    setSubiendo(zona);
    try {
      const s = await subirEvidencia(inspeccion.id, zona, file);
      const r = await registrarFotoAction({
        inspeccionId: inspeccion.id,
        zona,
        storagePath: s.path,
        sha256: s.sha256,
        tamanioBytes: s.bytes,
        tomadaAt: s.tomadaAt,
        lat: s.lat,
        lng: s.lng,
      });
      if (!r.ok || !r.id) throw new Error(r.ok ? "Sin id" : r.error);
      if (s.lat != null && inspeccion.lat == null) {
        void guardar({ lat: s.lat, lng: s.lng });
      }
      const url = (await urlFirmada(s.path)) ?? undefined;
      const nueva: FotoLocal = { id: r.id, zona, tomada_at: s.tomadaAt, lat: s.lat, lng: s.lng, url };
      setFotos((prev) => [...prev, nueva]);
      return nueva;
    } catch (e) {
      toast({ title: "No se subió la foto", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
      return null;
    } finally {
      setSubiendo(null);
    }
  };

  const guardarFirma = async () => {
    if (!firmaBlob) return;
    setGuardandoFirma(true);
    try {
      const s = await subirEvidencia(inspeccion.id, "firma", firmaBlob);
      const r = await guardarFirmaAction(inspeccion.id, s.path);
      if (!r.ok) throw new Error(r.error);
      setFirmaUrl((await urlFirmada(s.path)) ?? s.path);
      toast({ title: "Firma guardada", variant: "success" });
    } catch (e) {
      toast({ title: "No se guardó la firma", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally {
      setGuardandoFirma(false);
    }
  };

  const toggleFaltante = (codigo: string, on: boolean) => {
    const next = on ? [...faltantes, codigo] : faltantes.filter((f) => f !== codigo);
    setFaltantes(next);
    void guardar({ faltantes: next });
  };

  const setItemChecklist = (zona: string, estado: ChecklistItem["estado"]) => {
    const next = checklist.map((c) => (c.zona === zona ? { ...c, estado } : c));
    setChecklist(next);
    void guardar({ checklist: next });
    if (estado === "danio" && !danios.some((d) => d.zona === zona)) setDanioDialog({ zona });
  };

  const quitarDanio = async (id: string) => {
    const r = await eliminarDanioAction(inspeccion.id, id);
    if (!r.ok) {
      toast({ title: "No se pudo quitar", description: r.error, variant: "destructive" });
      return;
    }
    setDanios((prev) => prev.filter((d) => d.id !== id));
  };

  const faltanObligatorias = obligatorias.filter((z) => !fotos.some((f) => f.zona === z));
  const listaParaCerrar = faltanObligatorias.length === 0;

  const cerrar = () => {
    startCerrar(async () => {
      await guardarDatos();
      const r = await cerrarInspeccionAction(inspeccion.id, checklist);
      if (!r.ok) {
        toast({ title: "No se pudo cerrar", description: r.error, variant: "destructive" });
        return;
      }
      toast({ title: "Inspección cerrada", description: r.detalle, variant: "success" });
      router.refresh();
    });
  };

  const fotosPorZona = (z: string) => fotos.filter((f) => f.zona === z);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 pb-28">
      {/* Encabezado */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {TIPO_INSPECCION_LABEL[inspeccion.tipo]}
            </div>
            <div className="truncate text-lg font-semibold">{unidad.descripcion_unidad}</div>
            <div className="font-mono text-xs text-muted-foreground">
              {unidad.stock_interno} · {unidad.chasis || "sin chasis"}
              {unidad.color_descripcion ? ` · ${unidad.color_descripcion}` : ""}
            </div>
            {batea ? (
              <Link href={`/bateas/${batea.id}`} className="text-xs text-primary hover:underline">
                Batea {batea.numero} · {batea.empresa_transporte ?? "sin transportista"}
              </Link>
            ) : null}
          </div>
          {cerrada ? (
            <div className="flex flex-col items-end gap-1">
              <ResultadoBadge resultado={inspeccion.resultado} />
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" /> {formatFechaHora(inspeccion.cerrada_at)}
              </span>
            </div>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Abierta {formatFechaHora(inspeccion.abierta_at)}</span>
          {inspeccion.inspector_nombre ? <span>Inspector: {inspeccion.inspector_nombre}</span> : null}
          {inspeccion.lat != null ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {inspeccion.lat}, {inspeccion.lng}
            </span>
          ) : null}
        </div>
      </div>

      {/* 1. Datos */}
      <Seccion titulo="1 · Datos de recepción">
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Km" id="km">
            <Input id="km" type="number" inputMode="numeric" className="h-11 text-base" value={datos.km} disabled={cerrada} onChange={(e) => setDatos({ ...datos, km: e.target.value })} onBlur={guardarDatos} />
          </Campo>
          <Campo label="Combustible %" id="combustible">
            <Input id="combustible" type="number" inputMode="numeric" min={0} max={100} className="h-11 text-base" value={datos.combustible_pct} disabled={cerrada} onChange={(e) => setDatos({ ...datos, combustible_pct: e.target.value })} onBlur={guardarDatos} />
          </Campo>
          <Campo label="Chofer" id="chofer">
            <Input id="chofer" className="h-11 text-base" value={datos.chofer_nombre} disabled={cerrada} onChange={(e) => setDatos({ ...datos, chofer_nombre: e.target.value })} onBlur={guardarDatos} />
          </Campo>
          <Campo label="DNI chofer" id="dni">
            <Input id="dni" inputMode="numeric" className="h-11 text-base" value={datos.chofer_dni} disabled={cerrada} onChange={(e) => setDatos({ ...datos, chofer_dni: e.target.value })} onBlur={guardarDatos} />
          </Campo>
          <Campo label="N° remito" id="remito" className="col-span-2">
            <Input id="remito" className="h-11 font-mono text-base" value={datos.remito_nro} disabled={cerrada} onChange={(e) => setDatos({ ...datos, remito_nro: e.target.value })} onBlur={guardarDatos} />
          </Campo>
        </div>
        <label className="mt-3 flex items-start gap-3 rounded-md border border-border p-3">
          <Checkbox
            checked={datos.remito_con_reservas}
            disabled={cerrada}
            onCheckedChange={(v) => {
              const next = { ...datos, remito_con_reservas: v === true };
              setDatos(next);
              void guardar({ remito_con_reservas: next.remito_con_reservas });
            }}
            className="mt-0.5 h-5 w-5"
          />
          <span className="text-sm">
            <span className="font-medium">Remito firmado con reservas</span>
            <span className="block text-xs text-muted-foreground">
              Escribí &quot;Recibido con reservas: [daño, ubicación]&quot; en el remito antes de que el chofer se vaya.
            </span>
          </span>
        </label>
        {datos.remito_con_reservas ? (
          <Textarea
            className="mt-2 text-base"
            rows={2}
            placeholder="Qué se escribió en el remito"
            value={datos.reservas_texto}
            disabled={cerrada}
            onChange={(e) => setDatos({ ...datos, reservas_texto: e.target.value })}
            onBlur={guardarDatos}
          />
        ) : null}
      </Seccion>

      {/* 2. Fotos */}
      <Seccion
        titulo="2 · Fotos obligatorias"
        extra={
          <span className={cn("text-xs font-medium", listaParaCerrar ? "text-success" : "text-warning")}>
            {obligatorias.length - faltanObligatorias.length}/{obligatorias.length}
          </span>
        }
      >
        <p className="mb-3 text-xs text-muted-foreground">
          Solo desde la cámara. Cada foto guarda hora, GPS y huella digital (SHA-256) para que valga en el reclamo.
        </p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {zonas.map((z) => {
            const lista = fotosPorZona(z.codigo);
            const ok = lista.length > 0;
            const esVideo = z.codigo === "video_360";
            return (
              <li key={z.codigo} className={cn("flex flex-col gap-1 rounded-lg border p-2", ok ? "border-success/40 bg-success-muted/30" : z.obligatoria ? "border-border" : "border-dashed border-border")}>
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-sm font-medium">{z.label}</span>
                  {ok ? <Check className="h-4 w-4 shrink-0 text-success" /> : z.obligatoria ? <span className="text-[10px] uppercase text-warning">oblig.</span> : null}
                </div>
                <p className="line-clamp-2 text-[11px] leading-tight text-muted-foreground">{z.ayuda}</p>
                {lista.length > 0 ? (
                  <div className="flex gap-1 overflow-x-auto">
                    {lista.map((f) => (
                      <Miniatura key={f.id} foto={f} video={esVideo} />
                    ))}
                  </div>
                ) : null}
                {!cerrada ? (
                  <BotonCamara
                    label={ok ? "Otra" : "Sacar"}
                    video={esVideo}
                    cargando={subiendo === z.codigo}
                    disabled={subiendo !== null}
                    onFile={(file) => void subirFoto(z.codigo, file)}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </Seccion>

      {/* 3. Checklist */}
      <Seccion titulo="3 · Revisión por zona">
        <p className="mb-2 text-xs text-muted-foreground">Tocá &quot;Daño&quot; en la zona afectada para cargarlo con foto.</p>
        <ul className="divide-y divide-border rounded-md border border-border">
          {checklist.map((c) => (
            <li key={c.zona} className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="text-sm">{labelArea(c.zona)}</span>
              <div className="flex gap-1">
                {(["ok", "danio", "na"] as const).map((e) => (
                  <button
                    key={e}
                    type="button"
                    disabled={cerrada}
                    onClick={() => setItemChecklist(c.zona, e)}
                    className={cn(
                      "h-9 min-w-[52px] rounded-md border px-2 text-xs font-medium transition-colors",
                      c.estado === e
                        ? e === "ok"
                          ? "border-success bg-success-muted text-success"
                          : e === "danio"
                            ? "border-destructive bg-destructive-muted text-destructive"
                            : "border-border-strong bg-muted text-muted-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {e === "ok" ? "OK" : e === "danio" ? "Daño" : "N/A"}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Seccion>

      {/* 4. Daños */}
      <Seccion
        titulo={`4 · Daños (${danios.length})`}
        extra={
          !cerrada ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setDanioDialog({})}>
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          ) : null
        }
      >
        {danios.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin daños registrados.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {danios.map((d) => {
              const fotosDanio = fotos.filter((f) => d.foto_ids.includes(f.id));
              return (
                <li key={d.id} className="rounded-lg border border-destructive/30 bg-destructive-muted/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{labelArea(d.zona)} · {labelTipo(d.tipo)}</div>
                      <div className="text-xs text-muted-foreground">
                        Gravedad {d.gravedad} · <span className="font-mono">{codigoDanio(d.zona, d.tipo, d.gravedad)}</span> ·{" "}
                        {RESPONSABLE_LABEL[d.responsable]}
                      </div>
                      {d.descripcion ? <div className="mt-1 text-sm">{d.descripcion}</div> : null}
                    </div>
                    {!cerrada ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => void quitarDanio(d.id)} aria-label="Quitar daño">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                  {fotosDanio.length > 0 ? (
                    <div className="mt-2 flex gap-1 overflow-x-auto">
                      {fotosDanio.map((f) => <Miniatura key={f.id} foto={f} grande />)}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Seccion>

      {/* 5. Faltantes */}
      <Seccion titulo="5 · Faltantes">
        <ul className="grid grid-cols-2 gap-2">
          {FALTANTES_CATALOGO.map((f) => {
            const on = faltantes.includes(f.codigo);
            return (
              <li key={f.codigo}>
                <label className={cn("flex h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm", on ? "border-warning bg-warning-muted/40" : "border-border")}>
                  <Checkbox checked={on} disabled={cerrada} onCheckedChange={(v) => toggleFaltante(f.codigo, v === true)} className="h-5 w-5" />
                  {f.label}
                </label>
              </li>
            );
          })}
        </ul>
      </Seccion>

      {/* 6. Firma */}
      {inspeccion.tipo === "recepcion_batea" ? (
        <Seccion titulo="6 · Firma del chofer">
          {firmaUrl ? (
            <div className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={firmaUrl} alt="Firma del chofer" className="h-32 w-full rounded-md border border-border bg-white object-contain" />
              <span className="text-xs text-success inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Firma guardada</span>
            </div>
          ) : cerrada ? (
            <p className="text-sm text-muted-foreground">Sin firma.</p>
          ) : (
            <div className="flex flex-col gap-2">
              <FirmaPad onCambio={setFirmaBlob} />
              <Button type="button" onClick={() => void guardarFirma()} disabled={!firmaBlob || guardandoFirma} className="h-11">
                {guardandoFirma ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Guardar firma
              </Button>
            </div>
          )}
        </Seccion>
      ) : null}

      {/* 7. Observaciones */}
      <Seccion titulo="Observaciones">
        <Textarea rows={3} className="text-base" value={datos.observaciones} disabled={cerrada} onChange={(e) => setDatos({ ...datos, observaciones: e.target.value })} onBlur={guardarDatos} />
      </Seccion>

      {/* Barra de cierre fija */}
      {!cerrada ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1 text-xs">
              {listaParaCerrar ? (
                <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" /> Fotos completas</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-warning">
                  <AlertTriangle className="h-4 w-4" /> Faltan {faltanObligatorias.length} foto{faltanObligatorias.length === 1 ? "" : "s"}
                </span>
              )}
              {danios.length > 0 ? <span className="block text-muted-foreground">{danios.length} daño(s) registrado(s)</span> : null}
            </div>
            <Button className="h-12 px-5" onClick={cerrar} disabled={!listaParaCerrar || cerrando || subiendo !== null}>
              {cerrando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Cerrar inspección
            </Button>
          </div>
        </div>
      ) : null}

      {danioDialog ? (
        <DialogDanio
          inspeccionId={inspeccion.id}
          zonaInicial={danioDialog.zona}
          esRecepcion={inspeccion.tipo === "recepcion_batea"}
          subirFoto={(file) => subirFoto(ZONA_FOTO_DANIO, file)}
          subiendo={subiendo === ZONA_FOTO_DANIO}
          onClose={() => setDanioDialog(null)}
          onCreado={(d) => {
            setDanios((prev) => [...prev, d]);
            setChecklist((prev) => {
              const next = prev.map((c) => (c.zona === d.zona ? { ...c, estado: "danio" as const } : c));
              void guardar({ checklist: next });
              return next;
            });
            setDanioDialog(null);
          }}
        />
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------
// Piezas
// ------------------------------------------------------------

function Seccion({ titulo, extra, children }: { titulo: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">{titulo}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

function Campo({ label, id, className, children }: { label: string; id: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Label htmlFor={id} className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function BotonCamara({
  label,
  video,
  cargando,
  disabled,
  onFile,
}: {
  label: string;
  video?: boolean;
  cargando: boolean;
  disabled?: boolean;
  onFile: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={video ? "video/*" : "image/*"}
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <Button type="button" variant="outline" size="sm" className="h-10 w-full" disabled={disabled} onClick={() => ref.current?.click()}>
        {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : video ? <Video className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
        {cargando ? "Subiendo…" : label}
      </Button>
    </>
  );
}

function Miniatura({ foto, video, grande }: { foto: FotoLocal; video?: boolean; grande?: boolean }) {
  const cls = grande ? "h-20 w-20" : "h-14 w-14";
  if (!foto.url) {
    return <div className={cn(cls, "flex shrink-0 items-center justify-center rounded border border-border bg-muted")}><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>;
  }
  return (
    <a href={foto.url} target="_blank" rel="noreferrer" className={cn(cls, "shrink-0 overflow-hidden rounded border border-border bg-muted")} title={foto.tomada_at ? formatFechaHora(foto.tomada_at) : undefined}>
      {video ? (
        <video src={foto.url} className="h-full w-full object-cover" muted />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto.url} alt="" className="h-full w-full object-cover" loading="lazy" />
      )}
    </a>
  );
}

function DialogDanio({
  inspeccionId,
  zonaInicial,
  esRecepcion,
  subirFoto,
  subiendo,
  onClose,
  onCreado,
}: {
  inspeccionId: string;
  zonaInicial?: string;
  esRecepcion: boolean;
  subirFoto: (file: File) => Promise<FotoLocal | null>;
  subiendo: boolean;
  onClose: () => void;
  onCreado: (d: Danio) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    zona: zonaInicial ?? "",
    tipo: "",
    gravedad: 1,
    descripcion: "",
    responsable: (esRecepcion ? "transporte" : "desconocido") as ResponsableDanio,
    monto_estimado: "",
  });
  const [fotosDanio, setFotosDanio] = useState<FotoLocal[]>([]);

  const guardar = () => {
    startTransition(async () => {
      const r = await registrarDanioAction(inspeccionId, {
        zona: form.zona,
        tipo: form.tipo,
        gravedad: form.gravedad,
        descripcion: form.descripcion || null,
        responsable: form.responsable,
        foto_ids: fotosDanio.map((f) => f.id),
        monto_estimado: form.monto_estimado === "" ? null : Number(form.monto_estimado),
      });
      if (!r.ok || !r.id) {
        toast({ title: "No se guardó el daño", description: r.ok ? "Sin id" : r.error, variant: "destructive" });
        return;
      }
      onCreado({
        id: r.id,
        unidad_id: "",
        inspeccion_id: inspeccionId,
        batea_id: null,
        zona: form.zona,
        tipo: form.tipo,
        gravedad: form.gravedad,
        descripcion: form.descripcion || null,
        foto_ids: fotosDanio.map((f) => f.id),
        responsable: form.responsable,
        estado_reclamo: "detectado",
        monto_estimado: form.monto_estimado === "" ? null : Number(form.monto_estimado),
        monto_recuperado: null,
        fecha_reclamo: null,
        nro_reclamo: null,
        notas_reclamo: null,
        created_at: new Date().toISOString(),
      });
    });
  };

  const valido = form.zona && form.tipo && fotosDanio.length > 0;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar daño</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Campo label="Zona" id="d_zona">
            <select id="d_zona" className={SELECT_CLS} value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })}>
              <option value="">Elegir zona…</option>
              {AREAS_DANIO.map((a) => <option key={a.codigo} value={a.codigo}>{a.codigo} · {a.label}</option>)}
            </select>
          </Campo>
          <Campo label="Tipo" id="d_tipo">
            <select id="d_tipo" className={SELECT_CLS} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="">Elegir tipo…</option>
              {TIPOS_DANIO.map((t) => <option key={t.codigo} value={t.codigo}>{t.codigo} · {t.label}</option>)}
            </select>
          </Campo>
          <Campo label="Gravedad (tamaño)" id="d_grav">
            <select id="d_grav" className={SELECT_CLS} value={form.gravedad} onChange={(e) => setForm({ ...form, gravedad: Number(e.target.value) })}>
              {GRAVEDADES.map((g) => <option key={g.valor} value={g.valor}>{g.label}</option>)}
            </select>
          </Campo>
          <Campo label="Responsable" id="d_resp">
            <select id="d_resp" className={SELECT_CLS} value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value as ResponsableDanio })}>
              {(Object.keys(RESPONSABLE_LABEL) as ResponsableDanio[]).map((k) => <option key={k} value={k}>{RESPONSABLE_LABEL[k]}</option>)}
            </select>
          </Campo>
          <Campo label="Descripción" id="d_desc">
            <Textarea id="d_desc" rows={2} className="text-base" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej. rayón de 10 cm a la altura de la manija" />
          </Campo>
          <Campo label="Monto estimado (ARS, opcional)" id="d_monto">
            <Input id="d_monto" type="number" inputMode="decimal" className="h-11 text-base" value={form.monto_estimado} onChange={(e) => setForm({ ...form, monto_estimado: e.target.value })} />
          </Campo>
          <div className="flex flex-col gap-2">
            <Label className="text-xs">Fotos del daño (al menos una: general + primer plano)</Label>
            {fotosDanio.length > 0 ? (
              <div className="flex gap-1 overflow-x-auto">
                {fotosDanio.map((f) => <Miniatura key={f.id} foto={f} grande />)}
              </div>
            ) : null}
            <BotonCamara
              label={fotosDanio.length === 0 ? "Sacar foto del daño" : "Otra foto"}
              cargando={subiendo}
              onFile={(file) => {
                void subirFoto(file).then((f) => {
                  if (f) setFotosDanio((prev) => [...prev, f]);
                });
              }}
            />
          </div>
          {form.zona && form.tipo ? (
            <p className="text-xs text-muted-foreground">
              Código AIAG: <span className="font-mono">{codigoDanio(form.zona, form.tipo, form.gravedad)}</span>
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button onClick={guardar} disabled={!valido || pending || subiendo} className="h-11">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Guardar daño
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
