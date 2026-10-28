"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { MARCAS } from "@/lib/types/catalogo";
import type { Sucursal } from "@/lib/types/database";
import {
  zonasObligatorias,
  type TipoInspeccion,
} from "./domain/constants";
import type { ChecklistItem } from "./domain/types";

export type LogisticaResult =
  | { ok: true; id?: string; detalle?: string }
  | { ok: false; error: string };

function revalidar(extra: string[] = []) {
  revalidatePath("/");
  for (const p of extra) revalidatePath(p);
}

function limpiar(formData: FormData): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    out[k] = t === "" ? null : t;
  }
  return out;
}

const sucursalSchema = z.enum(["ushuaia", "rio_grande", "austral", "legacy_pendiente"]);

// ------------------------------------------------------------
// Bateas
// ------------------------------------------------------------

const bateaSchema = z
  .object({
    origen: z.enum(["buenos_aires", "interna", "otro"]),
    sucursal_origen: sucursalSchema.nullable().optional(),
    sucursal_destino: sucursalSchema,
    marca: z.enum(MARCAS).nullable().optional(),
    empresa_transporte: z.string().nullable().optional(),
    chofer_nombre: z.string().nullable().optional(),
    chofer_dni: z.string().nullable().optional(),
    chofer_telefono: z.string().nullable().optional(),
    patente_camion: z.string().nullable().optional(),
    patente_batea: z.string().nullable().optional(),
    nro_remito: z.string().nullable().optional(),
    fecha_salida: z.string().nullable().optional(),
    fecha_estimada_arribo: z.string().nullable().optional(),
    observaciones: z.string().nullable().optional(),
  })
  .refine((v) => v.origen !== "interna" || !!v.sucursal_origen, {
    message: "Una batea interna necesita sucursal de origen",
    path: ["sucursal_origen"],
  });

export async function crearBateaAction(
  _prev: LogisticaResult | null,
  formData: FormData,
): Promise<LogisticaResult> {
  const raw = limpiar(formData);
  const parsed = bateaSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const unidadIds = formData
    .getAll("unidad_ids")
    .map((v) => String(v))
    .filter(Boolean);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: batea, error } = await supabase
    .from("bateas")
    .insert({
      ...parsed.data,
      sucursal_origen: parsed.data.origen === "interna" ? parsed.data.sucursal_origen : null,
      estado: parsed.data.fecha_salida ? "en_ruta" : "programada",
      created_by: user?.id ?? null,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !batea) return { ok: false, error: error?.message ?? "No se pudo crear la batea" };

  if (unidadIds.length > 0) {
    const { error: e2 } = await supabase.from("bateas_unidades").insert(
      unidadIds.map((unidad_id, i) => ({ batea_id: batea.id, unidad_id, posicion: i + 1 })),
    );
    if (e2) return { ok: false, error: `Batea creada pero no se cargaron las unidades: ${e2.message}` };

    // Unidades compradas que suben a una batea pasan a tránsito.
    const hoy = new Date().toISOString().slice(0, 10);
    await supabase
      .from("unidades")
      .update({ estado_actual: "en_transito", fecha_despacho: parsed.data.fecha_salida ?? hoy })
      .in("id", unidadIds)
      .eq("estado_actual", "compra_0km");
  }

  revalidar(["/unidades", "/compras"]);
  redirect(`/bateas/${batea.id}`);
}

export async function agregarUnidadesBateaAction(
  bateaId: string,
  unidadIds: string[],
): Promise<LogisticaResult> {
  if (!bateaId || unidadIds.length === 0) return { ok: false, error: "Sin unidades" };
  const supabase = createClient();
  const { count } = await supabase
    .from("bateas_unidades")
    .select("id", { count: "exact", head: true })
    .eq("batea_id", bateaId);
  const base = count ?? 0;
  const { error } = await supabase.from("bateas_unidades").upsert(
    unidadIds.map((unidad_id, i) => ({ batea_id: bateaId, unidad_id, posicion: base + i + 1 })),
    { onConflict: "batea_id,unidad_id", ignoreDuplicates: true },
  );
  if (error) return { ok: false, error: error.message };
  await supabase
    .from("unidades")
    .update({ estado_actual: "en_transito", fecha_despacho: new Date().toISOString().slice(0, 10) })
    .in("id", unidadIds)
    .eq("estado_actual", "compra_0km");
  revalidar([`/bateas/${bateaId}`, "/unidades"]);
  return { ok: true };
}

export async function quitarUnidadBateaAction(bateaId: string, filaId: string): Promise<LogisticaResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("bateas_unidades")
    .delete()
    .eq("id", filaId)
    .eq("batea_id", bateaId)
    .eq("estado_recepcion", "pendiente");
  if (error) return { ok: false, error: error.message };
  revalidar([`/bateas/${bateaId}`]);
  return { ok: true };
}

export async function cambiarEstadoBateaAction(
  bateaId: string,
  estado: "programada" | "en_ruta" | "arribada" | "cerrada" | "cancelada",
): Promise<LogisticaResult> {
  const supabase = createClient();
  const patch: Record<string, unknown> = { estado };
  if (estado === "en_ruta") patch.fecha_salida = new Date().toISOString().slice(0, 10);
  if (estado === "arribada") patch.fecha_arribo_real = new Date().toISOString();
  const { error } = await supabase.from("bateas").update(patch).eq("id", bateaId);
  if (error) return { ok: false, error: error.message };
  revalidar([`/bateas/${bateaId}`]);
  return { ok: true };
}

export async function marcarFaltanteAction(bateaId: string, filaId: string): Promise<LogisticaResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("bateas_unidades")
    .update({ estado_recepcion: "faltante" })
    .eq("id", filaId)
    .eq("batea_id", bateaId);
  if (error) return { ok: false, error: error.message };
  revalidar([`/bateas/${bateaId}`]);
  return { ok: true };
}

// ------------------------------------------------------------
// Inspecciones
// ------------------------------------------------------------

/**
 * Abre (o retoma) una inspección para la unidad. Si ya hay una abierta
 * del mismo tipo, redirige a esa en vez de duplicar.
 */
export async function abrirInspeccionAction(params: {
  unidadId: string;
  tipo: TipoInspeccion;
  bateaId?: string | null;
  sucursal?: Sucursal | null;
}): Promise<LogisticaResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: abierta } = await supabase
    .from("inspecciones_unidad")
    .select("id")
    .eq("unidad_id", params.unidadId)
    .eq("tipo", params.tipo)
    .eq("estado", "abierta")
    .maybeSingle<{ id: string }>();
  if (abierta) redirect(`/inspeccion/${abierta.id}`);

  let sucursal = params.sucursal ?? null;
  let chofer: { chofer_nombre: string | null; chofer_dni: string | null; nro_remito: string | null } | null = null;
  if (params.bateaId) {
    const { data: b } = await supabase
      .from("bateas")
      .select("sucursal_destino, chofer_nombre, chofer_dni, nro_remito")
      .eq("id", params.bateaId)
      .maybeSingle<{ sucursal_destino: Sucursal; chofer_nombre: string | null; chofer_dni: string | null; nro_remito: string | null }>();
    if (b) {
      sucursal = sucursal ?? b.sucursal_destino;
      chofer = b;
    }
  }
  if (!sucursal) {
    const { data: u } = await supabase
      .from("unidades")
      .select("sucursal")
      .eq("id", params.unidadId)
      .maybeSingle<{ sucursal: Sucursal }>();
    sucursal = u?.sucursal ?? "legacy_pendiente";
  }

  const { data, error } = await supabase
    .from("inspecciones_unidad")
    .insert({
      unidad_id: params.unidadId,
      batea_id: params.bateaId ?? null,
      tipo: params.tipo,
      sucursal,
      inspector_user_id: user?.id ?? null,
      inspector_nombre: user?.email ?? null,
      chofer_nombre: chofer?.chofer_nombre ?? null,
      chofer_dni: chofer?.chofer_dni ?? null,
      remito_nro: chofer?.nro_remito ?? null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) return { ok: false, error: error?.message ?? "No se pudo abrir la inspección" };
  revalidar(params.bateaId ? [`/bateas/${params.bateaId}`] : []);
  redirect(`/inspeccion/${data.id}`);
}

const CAMPOS_INSPECCION = new Set([
  "chofer_nombre",
  "chofer_dni",
  "remito_nro",
  "remito_con_reservas",
  "reservas_texto",
  "km",
  "combustible_pct",
  "checklist",
  "faltantes",
  "lat",
  "lng",
  "dispositivo",
  "observaciones",
  "inspector_nombre",
]);

export async function guardarInspeccionAction(
  id: string,
  patch: Record<string, unknown>,
): Promise<LogisticaResult> {
  const supabase = createClient();
  const limpio: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (CAMPOS_INSPECCION.has(k)) limpio[k] = v === "" ? null : v;
  }
  if (Object.keys(limpio).length === 0) return { ok: false, error: "Nada para guardar" };
  const { error } = await supabase
    .from("inspecciones_unidad")
    .update(limpio)
    .eq("id", id)
    .eq("estado", "abierta");
  if (error) return { ok: false, error: error.message };
  return { ok: true, id };
}

export async function registrarFotoAction(input: {
  inspeccionId: string;
  zona: string;
  storagePath: string;
  sha256: string | null;
  tamanioBytes: number | null;
  tomadaAt: string | null;
  lat: number | null;
  lng: number | null;
  nota?: string | null;
}): Promise<LogisticaResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("inspeccion_fotos")
    .insert({
      inspeccion_id: input.inspeccionId,
      zona: input.zona,
      storage_path: input.storagePath,
      sha256: input.sha256,
      tamanio_bytes: input.tamanioBytes,
      tomada_at: input.tomadaAt,
      lat: input.lat,
      lng: input.lng,
      nota: input.nota ?? null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) return { ok: false, error: error?.message ?? "No se registró la foto" };
  return { ok: true, id: data.id };
}

export async function guardarFirmaAction(inspeccionId: string, storagePath: string): Promise<LogisticaResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("inspecciones_unidad")
    .update({ chofer_firma_path: storagePath })
    .eq("id", inspeccionId)
    .eq("estado", "abierta");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

const danioSchema = z.object({
  zona: z.string().min(1),
  tipo: z.string().min(1),
  gravedad: z.coerce.number().int().min(1).max(5),
  descripcion: z.string().nullable().optional(),
  responsable: z.enum(["transporte", "fabrica", "interno", "cliente", "desconocido"]).default("desconocido"),
  foto_ids: z.array(z.string()).default([]),
  monto_estimado: z.coerce.number().nullable().optional(),
});

export async function registrarDanioAction(
  inspeccionId: string,
  input: z.input<typeof danioSchema>,
): Promise<LogisticaResult> {
  const parsed = danioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Daño inválido" };
  if (parsed.data.foto_ids.length === 0) {
    return { ok: false, error: "Todo daño necesita al menos una foto." };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: insp } = await supabase
    .from("inspecciones_unidad")
    .select("unidad_id, batea_id, tipo, estado")
    .eq("id", inspeccionId)
    .maybeSingle<{ unidad_id: string; batea_id: string | null; tipo: TipoInspeccion; estado: string }>();
  if (!insp) return { ok: false, error: "Inspección no encontrada" };
  if (insp.estado !== "abierta") return { ok: false, error: "La inspección ya está cerrada" };

  // Default de responsable: si es recepción de batea y no se indicó, transporte.
  const responsable =
    input.responsable ?? (insp.tipo === "recepcion_batea" ? "transporte" : "desconocido");

  const { data, error } = await supabase
    .from("danios_unidad")
    .insert({
      unidad_id: insp.unidad_id,
      inspeccion_id: inspeccionId,
      batea_id: insp.batea_id,
      zona: parsed.data.zona,
      tipo: parsed.data.tipo,
      gravedad: parsed.data.gravedad,
      descripcion: parsed.data.descripcion ?? null,
      responsable,
      foto_ids: parsed.data.foto_ids,
      monto_estimado: parsed.data.monto_estimado ?? null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) return { ok: false, error: error?.message ?? "No se registró el daño" };
  return { ok: true, id: data.id };
}

export async function eliminarDanioAction(inspeccionId: string, danioId: string): Promise<LogisticaResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("danios_unidad")
    .delete()
    .eq("id", danioId)
    .eq("inspeccion_id", inspeccionId)
    .eq("estado_reclamo", "detectado");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function cerrarInspeccionAction(
  inspeccionId: string,
  checklist: ChecklistItem[],
): Promise<LogisticaResult> {
  const supabase = createClient();
  const { data: insp } = await supabase
    .from("inspecciones_unidad")
    .select("tipo, batea_id, unidad_id")
    .eq("id", inspeccionId)
    .maybeSingle<{ tipo: TipoInspeccion; batea_id: string | null; unidad_id: string }>();
  if (!insp) return { ok: false, error: "Inspección no encontrada" };

  await supabase
    .from("inspecciones_unidad")
    .update({ checklist })
    .eq("id", inspeccionId)
    .eq("estado", "abierta");

  const { data, error } = await supabase.rpc("cerrar_inspeccion", {
    p_inspeccion_id: inspeccionId,
    p_fotos_obligatorias: zonasObligatorias(insp.tipo),
  });
  if (error) return { ok: false, error: error.message };

  const res = data as { resultado?: string; danios?: number };
  revalidar([
    "/unidades",
    `/unidades/${insp.unidad_id}`,
    "/compras",
    "/",
    ...(insp.batea_id ? [`/bateas/${insp.batea_id}`] : []),
    `/inspeccion/${inspeccionId}`,
  ]);
  return {
    ok: true,
    id: inspeccionId,
    detalle: `Resultado: ${res?.resultado ?? "—"} · daños: ${res?.danios ?? 0}`,
  };
}

// ------------------------------------------------------------
// Reclamos
// ------------------------------------------------------------

const CAMPOS_RECLAMO = new Set([
  "responsable",
  "estado_reclamo",
  "monto_estimado",
  "monto_recuperado",
  "fecha_reclamo",
  "nro_reclamo",
  "notas_reclamo",
]);

export async function actualizarReclamoAction(
  danioId: string,
  patch: Record<string, unknown>,
): Promise<LogisticaResult> {
  const supabase = createClient();
  const limpio: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (CAMPOS_RECLAMO.has(k)) limpio[k] = v === "" ? null : v;
  }
  if (Object.keys(limpio).length === 0) return { ok: false, error: "Nada para actualizar" };
  const { error } = await supabase.from("danios_unidad").update(limpio).eq("id", danioId);
  if (error) return { ok: false, error: error.message };
  revalidar();
  return { ok: true, id: danioId };
}
