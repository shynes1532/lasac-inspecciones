import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { listarDaniosTablero, resumenTransportistas } from "@/modules/logistica/data/repo";
import { DaniosTabs } from "@/modules/logistica/ui/logistica-tabs";
import { TableroDanios } from "@/modules/logistica/ui/tablero-danios";
import { TablaTransportistas } from "@/modules/logistica/ui/tabla-transportistas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Daños" };

export default async function DaniosPage({
  searchParams,
}: {
  searchParams: { vista?: string; reclamos?: string };
}) {
  const vista = searchParams.vista === "transportistas" ? "transportistas" : "danios";
  const todos = searchParams.reclamos === "todos";
  const [danios, transportistas] = await Promise.all([
    listarDaniosTablero({ estado: todos ? "todos" : "abiertos" }),
    resumenTransportistas(),
  ]);

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Daños y reclamos"
        description="Seguimiento de cada daño con su responsable, y la tasa de daño por transportista para negociar con datos."
      />
      <DaniosTabs counts={{ danios: danios.length, transportistas: transportistas.length }} />
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-x-auto">
        {vista === "danios" ? (
          <>
            <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs">
              <Link href="/danios" className={!todos ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}>
                Abiertos
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link href="/danios?reclamos=todos" className={todos ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}>
                Todos
              </Link>
            </div>
            <TableroDanios danios={danios} />
          </>
        ) : (
          <TablaTransportistas filas={transportistas} />
        )}
      </div>
    </section>
  );
}
