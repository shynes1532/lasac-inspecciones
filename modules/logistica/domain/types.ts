import type { Sucursal } from "@/lib/types/database";
import type {
  EstadoBatea,
  EstadoInspeccion,
  EstadoReclamo,
  OrigenBatea,
  ResponsableDanio,
  ResultadoInspeccion,
  TipoInspeccion,
} from "./constants";

export interface Batea {
  id: string;
  numero: string;
  origen: OrigenBatea;
  sucursal_origen: Sucursal | null;
  sucursal_destino: Sucursal;
  marca: string | null;
  empresa_transporte: string | null;
  chofer_nombre: string | null;
  chofer_dni: string | null;
  chofer_telefono: string | null;
  patente_camion: string | null;
  patente_batea: string | null;
  nro_remito: string | null;
  fecha_salida: string | null;
  fecha_estimada_arribo: string | null;
  fecha_arribo_real: string | null;
  estado: EstadoBatea;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

/** Fila de vw_bateas_historial */
export interface BateaResumen extends Batea {
  unidades_total: number;
  unidades_inspeccionadas: number;
  unidades_faltantes: number;
  danios_total: number;
  danios_transporte: number;
  monto_danios_estimado: number;
  monto_danios_recuperado: number;
}

export interface UnidadBatea {
  id: string; // bateas_unidades.id
  unidad_id: string;
  posicion: number | null;
  estado_recepcion: "pendiente" | "inspeccionada" | "faltante";
  inspeccion_id: string | null;
  unidad: {
    id: string;
    stock_interno: string;
    descripcion_unidad: string;
    chasis: string;
    marca: string | null;
    color_descripcion: string | null;
    estado_actual: string;
    sucursal: Sucursal;
  };
  inspeccion: { resultado: ResultadoInspeccion | null; cerrada_at: string | null } | null;
}

export interface ChecklistItem {
  zona: string;
  estado: "ok" | "danio" | "na";
  nota?: string;
}

export interface Inspeccion {
  id: string;
  unidad_id: string;
  batea_id: string | null;
  tipo: TipoInspeccion;
  sucursal: Sucursal;
  estado: EstadoInspeccion;
  resultado: ResultadoInspeccion | null;
  inspector_user_id: string | null;
  inspector_nombre: string | null;
  chofer_nombre: string | null;
  chofer_dni: string | null;
  chofer_firma_path: string | null;
  remito_nro: string | null;
  remito_con_reservas: boolean;
  reservas_texto: string | null;
  km: number | null;
  combustible_pct: number | null;
  checklist: ChecklistItem[];
  faltantes: string[];
  lat: number | null;
  lng: number | null;
  dispositivo: string | null;
  observaciones: string | null;
  abierta_at: string;
  cerrada_at: string | null;
  created_at: string;
}

export interface FotoInspeccion {
  id: string;
  inspeccion_id: string;
  zona: string;
  storage_path: string;
  sha256: string | null;
  tamanio_bytes: number | null;
  tomada_at: string | null;
  lat: number | null;
  lng: number | null;
  nota: string | null;
  created_at: string;
  /** URL firmada, resuelta server-side al listar. */
  url?: string;
}

export interface Danio {
  id: string;
  unidad_id: string;
  inspeccion_id: string | null;
  batea_id: string | null;
  zona: string;
  tipo: string;
  gravedad: number;
  descripcion: string | null;
  foto_ids: string[];
  responsable: ResponsableDanio;
  estado_reclamo: EstadoReclamo;
  monto_estimado: number | null;
  monto_recuperado: number | null;
  fecha_reclamo: string | null;
  nro_reclamo: string | null;
  notas_reclamo: string | null;
  created_at: string;
}

/** Daño con contexto para el tablero de reclamos. */
export interface DanioTablero extends Danio {
  unidad: {
    stock_interno: string;
    descripcion_unidad: string;
    chasis: string;
    marca: string | null;
    sucursal: Sucursal;
  };
  batea: { numero: string; empresa_transporte: string | null; origen: OrigenBatea } | null;
}

export interface InspeccionCompleta {
  inspeccion: Inspeccion;
  unidad: {
    id: string;
    stock_interno: string;
    descripcion_unidad: string;
    chasis: string;
    marca: string | null;
    color_descripcion: string | null;
    estado_actual: string;
  };
  batea: Pick<Batea, "id" | "numero" | "empresa_transporte" | "chofer_nombre" | "chofer_dni" | "nro_remito" | "origen"> | null;
  fotos: FotoInspeccion[];
  danios: Danio[];
}

export interface ResumenTransportista {
  empresa_transporte: string;
  origen: OrigenBatea;
  marca: string | null;
  sucursal_destino: Sucursal;
  viajes: number;
  unidades: number;
  danios: number;
  danios_transporte: number;
  monto_estimado: number;
  monto_recuperado: number;
}
