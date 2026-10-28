import Link from "next/link";
import { Car, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { EstadoBadge } from "@/components/domain/estado-badge";
import { SucursalBadge } from "@/components/domain/sucursal-badge";
import { createClient } from "@/lib/supabase/server";
import type { UnidadResumen } from "@/lib/types/database";
import { BuscadorUnidades } from "@/components/buscador-unidades";

export const dynamic = "force-dynamic";
export const metadata = { title: "Unidades" };

export default async function UnidadesPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const supabase = createClient();
  let query = supabase
    .from("unidades")
    .select("id, stock_interno, sucursal, estado_actual, tipo, marca, descripcion_unidad, chasis, color_descripcion, fecha_arribo, fecha_despacho, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(60);
  if (q) {
    query = query.or(`stock_interno.ilike.%${q}%,chasis.ilike.%${q}%,descripcion_unidad.ilike.%${q}%`);
  } else {
    query = query.in("estado_actual", ["compra_0km", "en_transito", "stock_fisico"]);
  }
  const { data } = await query;
  const unidades = (data ?? []) as UnidadResumen[];

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Unidades"
        description="Buscá por stock, chasis o modelo para ver su historial o abrir una inspección (traslado, test drive, pre-entrega)."
      />
      <BuscadorUnidades />
      {unidades.length === 0 ? (
        <EmptyState icon={q ? Search : Car} title={q ? "Sin resultados" : "No hay unidades compradas, en tránsito ni en stock"} />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface shadow-sm">
          {unidades.map((u) => (
            <li key={u.id}>
              <Link href={`/unidades/${u.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs">{u.stock_interno}</span>
                    <EstadoBadge estado={u.estado_actual} />
                    <SucursalBadge sucursal={u.sucursal} />
                  </div>
                  <div className="truncate text-sm">{u.descripcion_unidad}</div>
                  <div className="truncate font-mono text-xs text-muted-foreground">
                    {u.chasis || "sin chasis"} {u.color_descripcion ? `· ${u.color_descripcion}` : ""}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{u.marca ?? ""}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
