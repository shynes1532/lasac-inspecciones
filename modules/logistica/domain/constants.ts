// =============================================================
// Logística · catálogos del dominio
// Zonas de foto obligatorias, catálogo de daños estilo AIAG/ECG
// (área + tipo + gravedad) y labels de estados.
// =============================================================

export type OrigenBatea = "buenos_aires" | "interna" | "otro";
export type EstadoBatea = "programada" | "en_ruta" | "arribada" | "cerrada" | "cancelada";
export type TipoInspeccion =
  | "recepcion_batea"
  | "traslado_interno"
  | "test_drive"
  | "pre_entrega"
  | "otro";
export type EstadoInspeccion = "abierta" | "cerrada" | "anulada";
export type ResultadoInspeccion = "ok" | "con_danios" | "faltantes";
export type ResponsableDanio = "transporte" | "fabrica" | "interno" | "cliente" | "desconocido";
export type EstadoReclamo =
  | "detectado"
  | "reclamado"
  | "aceptado"
  | "rechazado"
  | "reparado"
  | "cerrado";

export const ORIGEN_LABEL: Record<OrigenBatea, string> = {
  buenos_aires: "Buenos Aires",
  interna: "Interna (entre sucursales)",
  otro: "Otro",
};

export const ESTADO_BATEA_LABEL: Record<EstadoBatea, string> = {
  programada: "Programada",
  en_ruta: "En ruta",
  arribada: "Arribada",
  cerrada: "Cerrada",
  cancelada: "Cancelada",
};

export const TIPO_INSPECCION_LABEL: Record<TipoInspeccion, string> = {
  recepcion_batea: "Recepción de batea",
  traslado_interno: "Traslado interno",
  test_drive: "Test drive",
  pre_entrega: "Pre-entrega",
  otro: "Otro",
};

export const RESULTADO_LABEL: Record<ResultadoInspeccion, string> = {
  ok: "Sin novedades",
  con_danios: "Con daños",
  faltantes: "Con faltantes",
};

export const RESPONSABLE_LABEL: Record<ResponsableDanio, string> = {
  transporte: "Transporte",
  fabrica: "Fábrica / terminal",
  interno: "Interno (sucursal)",
  cliente: "Cliente",
  desconocido: "Sin determinar",
};

export const ESTADO_RECLAMO_LABEL: Record<EstadoReclamo, string> = {
  detectado: "Detectado",
  reclamado: "Reclamado",
  aceptado: "Aceptado",
  rechazado: "Rechazado",
  reparado: "Reparado",
  cerrado: "Cerrado",
};

// -------------------------------------------------------------
// Fotos obligatorias por inspección. Orden = guía en el celular.
// Las primeras son las que valen en un reclamo al transportista.
// -------------------------------------------------------------
export interface ZonaFoto {
  codigo: string;
  label: string;
  ayuda: string;
  obligatoria: boolean;
  /** Solo aplica a recepción de batea (foto de la batea cargada, remito). */
  soloRecepcion?: boolean;
}

export const ZONAS_FOTO: ZonaFoto[] = [
  { codigo: "batea_cargada", label: "Batea cargada", ayuda: "Antes de bajar la unidad, que se vea la patente de la batea.", obligatoria: true, soloRecepcion: true },
  { codigo: "vin", label: "VIN / chasis", ayuda: "Etiqueta o grabado legible.", obligatoria: true },
  { codigo: "frente", label: "Frente", ayuda: "De frente, a 2 m, paragolpes completo.", obligatoria: true },
  { codigo: "lat_del_izq", label: "¾ delantero izquierdo", ayuda: "Esquina delantera izquierda.", obligatoria: true },
  { codigo: "lateral_izq", label: "Lateral izquierdo", ayuda: "Puertas y zócalo completos.", obligatoria: true },
  { codigo: "lat_tras_izq", label: "¾ trasero izquierdo", ayuda: "Esquina trasera izquierda.", obligatoria: true },
  { codigo: "trasera", label: "Trasera", ayuda: "Portón y paragolpes completos.", obligatoria: true },
  { codigo: "lat_tras_der", label: "¾ trasero derecho", ayuda: "Esquina trasera derecha.", obligatoria: true },
  { codigo: "lateral_der", label: "Lateral derecho", ayuda: "Puertas y zócalo completos.", obligatoria: true },
  { codigo: "lat_del_der", label: "¾ delantero derecho", ayuda: "Esquina delantera derecha.", obligatoria: true },
  { codigo: "techo", label: "Techo", ayuda: "Desde arriba o en ángulo, incluye antena.", obligatoria: true },
  { codigo: "parabrisas", label: "Parabrisas", ayuda: "De frente, con luz de costado para ver fisuras.", obligatoria: true },
  { codigo: "odometro", label: "Odómetro y combustible", ayuda: "Tablero encendido con km y nivel.", obligatoria: true },
  { codigo: "interior", label: "Interior", ayuda: "Asientos y tablero desde la puerta del conductor.", obligatoria: false },
  { codigo: "llantas", label: "Llantas", ayuda: "Las 4 llantas (una foto por llanta si hay daño).", obligatoria: false },
  { codigo: "remito", label: "Remito firmado", ayuda: "Con la reserva escrita si hubo daño.", obligatoria: false, soloRecepcion: true },
  { codigo: "video_360", label: "Video 360°", ayuda: "60 segundos caminando alrededor, sin cortes.", obligatoria: false },
];

export const ZONA_FOTO_DANIO = "danio";
export const ZONA_FOTO_FIRMA = "firma";

export function zonasPara(tipo: TipoInspeccion): ZonaFoto[] {
  return ZONAS_FOTO.filter((z) => !z.soloRecepcion || tipo === "recepcion_batea");
}

export function zonasObligatorias(tipo: TipoInspeccion): string[] {
  return zonasPara(tipo)
    .filter((z) => z.obligatoria)
    .map((z) => z.codigo);
}

// -------------------------------------------------------------
// Catálogo de daños: áreas y tipos siguiendo el esquema AIAG/ECG
// (código 5 dígitos: AA área · TT tipo · S gravedad). Los códigos
// numéricos de área siguen la numeración AIAG donde la conocemos
// y una numeración interna consecutiva donde no.
// -------------------------------------------------------------
export interface ItemCatalogo {
  codigo: string;
  label: string;
}

export const AREAS_DANIO: ItemCatalogo[] = [
  { codigo: "03", label: "Paragolpes delantero" },
  { codigo: "04", label: "Paragolpes trasero" },
  { codigo: "05", label: "Capot" },
  { codigo: "06", label: "Parrilla" },
  { codigo: "07", label: "Guardabarros delantero izq." },
  { codigo: "08", label: "Guardabarros delantero der." },
  { codigo: "09", label: "Puerta delantera izq." },
  { codigo: "10", label: "Puerta delantera der." },
  { codigo: "11", label: "Puerta trasera izq." },
  { codigo: "12", label: "Puerta trasera der." },
  { codigo: "13", label: "Lateral / guardabarros trasero izq." },
  { codigo: "14", label: "Lateral / guardabarros trasero der." },
  { codigo: "15", label: "Zócalo izq." },
  { codigo: "16", label: "Zócalo der." },
  { codigo: "17", label: "Tapa de baúl / portón" },
  { codigo: "20", label: "Parabrisas" },
  { codigo: "21", label: "Luneta" },
  { codigo: "22", label: "Vidrio lateral" },
  { codigo: "23", label: "Espejo izq." },
  { codigo: "24", label: "Espejo der." },
  { codigo: "25", label: "Óptica delantera" },
  { codigo: "26", label: "Óptica trasera" },
  { codigo: "30", label: "Llanta / cubierta" },
  { codigo: "37", label: "Techo" },
  { codigo: "40", label: "Interior" },
  { codigo: "50", label: "Bajos / carrocería inferior" },
  { codigo: "60", label: "Accesorios / faltantes" },
  { codigo: "62", label: "Vehículo completo" },
];

export const TIPOS_DANIO: ItemCatalogo[] = [
  { codigo: "01", label: "Doblado" },
  { codigo: "02", label: "Roto / inoperable" },
  { codigo: "03", label: "Corte" },
  { codigo: "04", label: "Abolladura con pintura dañada" },
  { codigo: "05", label: "Saltadura de pintura" },
  { codigo: "06", label: "Fisura" },
  { codigo: "12", label: "Rayón" },
  { codigo: "14", label: "Abolladura sin daño de pintura" },
  { codigo: "18", label: "Faltante" },
  { codigo: "20", label: "Mancha / contaminación" },
  { codigo: "30", label: "Suciedad excesiva" },
];

export const GRAVEDADES: { valor: number; label: string }[] = [
  { valor: 1, label: "1 · hasta 2,5 cm" },
  { valor: 2, label: "2 · 2,5 a 7,5 cm" },
  { valor: 3, label: "3 · 7,5 a 15 cm" },
  { valor: 4, label: "4 · 15 a 30 cm" },
  { valor: 5, label: "5 · más de 30 cm / faltante" },
];

export function labelArea(codigo: string): string {
  return AREAS_DANIO.find((a) => a.codigo === codigo)?.label ?? codigo;
}
export function labelTipo(codigo: string): string {
  return TIPOS_DANIO.find((t) => t.codigo === codigo)?.label ?? codigo;
}
export function codigoDanio(zona: string, tipo: string, gravedad: number): string {
  return `${zona}-${tipo}-${gravedad}`;
}

export const FALTANTES_CATALOGO: ItemCatalogo[] = [
  { codigo: "llave_2", label: "Segunda llave" },
  { codigo: "manual", label: "Manual / documentación" },
  { codigo: "kit_herramientas", label: "Kit de herramientas / gato" },
  { codigo: "rueda_auxilio", label: "Rueda de auxilio" },
  { codigo: "alfombras", label: "Alfombras" },
  { codigo: "antena", label: "Antena" },
  { codigo: "tapa_combustible", label: "Tapa de combustible" },
  { codigo: "accesorio", label: "Accesorio pactado" },
];
