import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obtenerInspeccionCompleta } from "@/modules/logistica/data/repo";
import { InspeccionMobile } from "@/modules/logistica/ui/inspeccion-mobile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inspección" };

export default async function InspeccionPage({ params }: { params: { id: string } }) {
  const data = await obtenerInspeccionCompleta(params.id);
  if (!data) notFound();

  const volver = data.batea ? `/bateas/${data.batea.id}` : `/unidades/${data.unidad.id}`;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <Button variant="outline" size="sm" asChild>
          <Link href={volver}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>
      <InspeccionMobile data={data} />
    </section>
  );
}
