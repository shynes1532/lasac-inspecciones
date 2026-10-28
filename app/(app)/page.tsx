import Link from "next/link";
import { Plus, Truck, PackageCheck, ClipboardList, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import type { Sucursal } from "@/lib/types/database";
import { contarBateas, listarBateas } from "@/modules/logistica/data/repo";
import type { EstadoBatea, OrigenBatea } from "@/modules/logistica/domain/constants";
import { FiltrosBateas } from "@/modules/logistica/ui/filtros-bateas";
import { TablaBateas } from "@/modules/logistica/ui/tabla-bateas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bateas" };

interface SearchParams {
  estado?: string;
  origen?: string;
  marca?: string;
  sucursal?: string;
  q?: string;
}

export default async function BateasPage({ searchParams }: { searchParams: SearchParams }) {
  const [kpis, bateas] = await Promise.all([
    contarBateas(),
    listarBateas({
      estado: (searchParams.estado as EstadoBatea | "abiertas" | "todas" | undefined) ?? "abiertas",
      origen: searchParams.origen as OrigenBatea | undefined,
      marca: searchParams.marca,
      sucursal: searchParams.sucursal as Sucursal | undefined,
      q: searchParams.q,
    }),
  ]);

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Bateas"
        description="Desde Buenos Aires y traslados internos. Cada unidad se inspecciona con fotos al bajar."
        actions={
          <Button asChild>
            <Link href="/bateas/nueva">
              <Plus className="h-4 w-4" />
              Nueva batea
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="En ruta" value={kpis.enRuta} icon={Truck} tono="info" />
        <StatCard label="Arribadas sin cerrar" value={kpis.arribadas} icon={PackageCheck} tono="warning" />
        <StatCard label="Sin inspeccionar" value={kpis.unidadesPendientes} icon={ClipboardList} tono={kpis.unidadesPendientes > 0 ? "warning" : "success"} />
        <StatCard label="Reclamos abiertos" value={kpis.reclamosAbiertos} icon={ShieldAlert} tono={kpis.reclamosAbiertos > 0 ? "destructive" : "success"} />
      </div>

      <FiltrosBateas />

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-x-auto">
        <TablaBateas bateas={bateas} />
      </div>
    </section>
  );
}
