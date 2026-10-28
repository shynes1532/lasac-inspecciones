"use client";

// Subida directa de evidencia al bucket privado `inspecciones` desde el
// celular. Calcula SHA-256 del archivo original (para que la foto sea
// verificable en un reclamo) y captura GPS si el usuario lo permite.

import { createClient } from "@/lib/supabase/client";

export const BUCKET = "inspecciones";

export async function sha256Hex(file: Blob): Promise<string | null> {
  try {
    const buf = await file.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

export interface Posicion {
  lat: number | null;
  lng: number | null;
}

let cachePos: Posicion | null = null;

export function obtenerPosicion(): Promise<Posicion> {
  if (cachePos) return Promise.resolve(cachePos);
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ lat: null, lng: null });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        cachePos = { lat: Number(p.coords.latitude.toFixed(6)), lng: Number(p.coords.longitude.toFixed(6)) };
        resolve(cachePos);
      },
      () => resolve({ lat: null, lng: null }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  });
}

function extension(file: Blob, fallback = "jpg"): string {
  const t = file.type;
  if (t === "image/png") return "png";
  if (t === "image/webp") return "webp";
  if (t === "image/heic") return "heic";
  if (t === "video/mp4") return "mp4";
  if (t === "video/quicktime") return "mov";
  if (t === "image/jpeg") return "jpg";
  return fallback;
}

export interface SubidaResultado {
  path: string;
  sha256: string | null;
  bytes: number;
  tomadaAt: string;
  lat: number | null;
  lng: number | null;
}

/**
 * Sube el archivo tal cual (sin recomprimir) a
 * inspecciones/<inspeccionId>/<zona>-<timestamp>.<ext>
 */
export async function subirEvidencia(
  inspeccionId: string,
  zona: string,
  file: Blob,
): Promise<SubidaResultado> {
  const supabase = createClient();
  const [sha, pos] = await Promise.all([sha256Hex(file), obtenerPosicion()]);
  const ts = Date.now();
  const path = `${inspeccionId}/${zona}-${ts}.${extension(file)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const lastMod = file instanceof File && file.lastModified ? new Date(file.lastModified) : new Date(ts);
  return {
    path,
    sha256: sha,
    bytes: file.size,
    tomadaAt: lastMod.toISOString(),
    lat: pos.lat,
    lng: pos.lng,
  };
}

export async function urlFirmada(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export function resumenDispositivo(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent.slice(0, 180);
}
