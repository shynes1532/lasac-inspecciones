import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Sucursal } from "@/lib/types/database";
import type {
  Batea,
  BateaResumen,
  Danio,
  DanioTablero,
  FotoInspeccion,
  Inspeccion,
  InspeccionCompleta,
  ResumenTransportista,
  UnidadBatea,
} from "../domain/types";
import type { EstadoBatea, OrigenBatea } from "../domain/constants";

export const BUCKET_INSPECCIONES = "inspecciones";
const SIGNED_URL_TTL = 60 * 60; // 1 h

export interface FiltrosBateas {
  estado?: EstadoBatea | "abiertas" | "todas";
  origen?: OrigenBatea;
  marca?: string;
  sucursal?: Sucursal;
  q?: string;
}

export async function listarBateas(f: FiltrosBateas = {}): Promise<BateaResumen[]> {
  const supabase = createClient();
  let query = supabase
    .from("vw_bateas_historial")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (f.estado === "abiertas" || !f.estado) {
    if (f.estado === "abiertas") query = query.in("estado", ["programada", "en_ruta", "arribada"]);
  } else if (f.estado !== "todas") {
    query = query.eq("estado", f.estado);
  }
  if (f.origen) query = query.eq("origen", f.origen);
  if (f.marca) query = query.eq("marca", f.marca);
  if (f.sucursal) query = query.eq("sucursal_destino", f.sucursal);
  if (f.q?.trim()) {
    const t = f.q.trim();
    query = query.or(
      `numero.ilike.%${t}%,empresa_transporte.ilike.%${t}%,chofer_nombre.ilike.%${t}%,nro_remito.ilike.%${t}%,patente_batea.ilike.%${t}%`,
    );
  }
  const { data, error } = await query;
  if (error) throw new Error(`listarBateas: ${error.message}`);
  return (data ?? []) as BateaResumen[];
}

export async function obtenerBatea(id: string): Promise<BateaResumen | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("vw_bateas_historial")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as BateaResumen | null) ?? null;
}

export async function listarUnidadesBatea(bateaId: string): Promise<UnidadBatea[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bateas_unidades")
    .select(
      `id, unidad_id, posicion, estado_recepcion, inspeccion_id,
       unidad:unidades ( id, stock_interno, descripcion_unidad, chasis, marca, color_descripcion, estado_actual, sucursal ),
       inspeccion:inspecciones_unidad ( resultado, cerrada_at )`,
    )
    .eq("batea_id", bateaId)
    .order("posicion", { ascending: true, nullsFirst: false });
  if (error) throw new Error(`listarUnidadesBatea: ${error.message}`);
  return (data ?? []) as unknown as UnidadBatea[];
}

/** Unidades candidatas a subir a una batea: compradas o en tránsito. */
export async function listarUnidadesParaBatea(marca?: string) {
  const supabase = createClient();
  let query = supabase
    .from("unidades")
    .select("id, stock_interno, descripcion_unidad, chasis, marca, color_descripcion, estado_actual, sucursal")
    .is("deleted_at", null)
    .in("estado_actual", ["compra_0km", "en_transito", "stock_fisico"])
    .order("created_at", { ascending: false })
    .limit(400);
  if (marca) query = query.eq("marca", marca);
  const { data, error } = await query;
  if (error) throw new Error(`listarUnidadesParaBatea: ${error.message}`);
  return (data ?? []) as Array<{
    id: string;
    stock_interno: string;
    descripcion_unidad: string;
    chasis: string;
    marca: string | null;
    color_descripcion: string | null;
    estado_actual: string;
    sucursal: Sucursal;
  }>;
}

export async function listarInspeccionesUnidad(unidadId: string): Promise<Inspeccion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inspecciones_unidad")
    .select("*")
    .eq("unidad_id", unidadId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listarInspeccionesUnidad: ${error.message}`);
  return (data ?? []) as Inspeccion[];
}

export async function listarDaniosUnidad(unidadId: string): Promise<Danio[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("danios_unidad")
    .select("*")
    .eq("unidad_id", unidadId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listarDaniosUnidad: ${error.message}`);
  return (data ?? []) as Danio[];
}

export async function firmarUrls(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (paths.length === 0) return out;
  const supabase = createClient();
  const { data } = await supabase.storage
    .from(BUCKET_INSPECCIONES)
    .createSignedUrls(paths, SIGNED_URL_TTL);
  for (const r of data ?? []) {
    if (r.path && r.signedUrl) out.set(r.path, r.signedUrl);
  }
  return out;
}

export async function obtenerInspeccionCompleta(id: string): Promise<InspeccionCompleta | null> {
  const supabase = createClient();
  const { data: insp } = await supabase
    .from("inspecciones_unidad")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!insp) return null;
  const inspeccion = insp as Inspeccion;

  const [{ data: unidad }, { data: batea }, { data: fotos }, { data: danios }] = await Promise.all([
    supabase
      .from("unidades")
      .select("id, stock_interno, descripcion_unidad, chasis, marca, color_descripcion, estado_actual")
      .eq("id", inspeccion.unidad_id)
      .maybeSingle(),
    inspeccion.batea_id
      ? supabase
          .from("bateas")
          .select("id, numero, empresa_transporte, chofer_nombre, chofer_dni, nro_remito, origen")
          .eq("id", inspeccion.batea_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("inspeccion_fotos")
      .select("*")
      .eq("inspeccion_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("danios_unidad")
      .select("*")
      .eq("inspeccion_id", id)
      .order("created_at", { ascending: true }),
  ]);
  if (!unidad) return null;

  const fotosRows = (fotos ?? []) as FotoInspeccion[];
  const paths = fotosRows.map((f) => f.storage_path);
  if (inspeccion.chofer_firma_path) paths.push(inspeccion.chofer_firma_path);
  const urls = await firmarUrls(paths);

  return {
    inspeccion: {
      ...inspeccion,
      chofer_firma_path: inspeccion.chofer_firma_path
        ? (urls.get(inspeccion.chofer_firma_path) ?? inspeccion.chofer_firma_path)
        : null,
    },
    unidad: unidad as InspeccionCompleta["unidad"],
    batea: (batea as InspeccionCompleta["batea"]) ?? null,
    fotos: fotosRows.map((f) => ({ ...f, url: urls.get(f.storage_path) })),
    danios: (danios ?? []) as Danio[],
  };
}

export interface FiltrosDanios {
  estado?: "abiertos" | "todos";
  responsable?: string;
}

export async function listarDaniosTablero(f: FiltrosDanios = {}): Promise<DanioTablero[]> {
  const supabase = createClient();
  let query = supabase
    .from("danios_unidad")
    .select(
      `*,
       unidad:unidades ( stock_interno, descripcion_unidad, chasis, marca, sucursal ),
       batea:bateas ( numero, empresa_transporte, origen )`,
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (f.estado !== "todos") {
    query = query.in("estado_reclamo", ["detectado", "reclamado", "aceptado", "reparado"]);
  }
  if (f.responsable) query = query.eq("responsable", f.responsable);
  const { data, error } = await query;
  if (error) throw new Error(`listarDaniosTablero: ${error.message}`);
  return (data ?? []) as unknown as DanioTablero[];
}

export async function resumenTransportistas(): Promise<ResumenTransportista[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vw_danios_por_transportista")
    .select("*")
    .order("danios", { ascending: false });
  if (error) throw new Error(`resumenTransportistas: ${error.message}`);
  return (data ?? []) as ResumenTransportista[];
}

export async function contarBateas() {
  const supabase = createClient();
  const base = () => supabase.from("bateas").select("id", { count: "exact", head: true });
  const [{ count: enRuta }, { count: arribadas }, { count: cerradas }] = await Promise.all([
    base().in("estado", ["programada", "en_ruta"]),
    base().eq("estado", "arribada"),
    base().eq("estado", "cerrada"),
  ]);
  const { count: pendientes } = await supabase
    .from("bateas_unidades")
    .select("id", { count: "exact", head: true })
    .eq("estado_recepcion", "pendiente");
  const { count: reclamos } = await supabase
    .from("danios_unidad")
    .select("id", { count: "exact", head: true })
    .in("estado_reclamo", ["detectado", "reclamado"]);
  return {
    enRuta: enRuta ?? 0,
    arribadas: arribadas ?? 0,
    cerradas: cerradas ?? 0,
    unidadesPendientes: pendientes ?? 0,
    reclamosAbiertos: reclamos ?? 0,
  };
}

export type { Batea };
