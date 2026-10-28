/**
 * Tipos mínimos del schema compartido con grupo-lasac-admin (misma base
 * Supabase). Solo lo que esta app necesita de `unidades`.
 */

export type EstadoUnidad =
  | "compra_0km"
  | "en_transito"
  | "stock_fisico"
  | "boleto"
  | "facturada_sin_registro"
  | "en_registro"
  | "dominio_sin_entrega"
  | "entregada"
  | "anulada";

export type Sucursal = "ushuaia" | "rio_grande" | "austral" | "legacy_pendiente";

export interface UnidadResumen {
  id: string;
  stock_interno: string;
  sucursal: Sucursal;
  estado_actual: EstadoUnidad;
  tipo: "0km" | "usado";
  marca: string | null;
  descripcion_unidad: string;
  chasis: string;
  color_descripcion: string | null;
  fecha_arribo: string | null;
  fecha_despacho: string | null;
  created_at: string;
}
