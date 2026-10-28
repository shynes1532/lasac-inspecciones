import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { listarUnidadesParaBatea } from "@/modules/logistica/data/repo";
import { FormBatea } from "@/modules/logistica/ui/form-batea";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nueva batea" };

export default async function NuevaBateaPage() {
  const unidades = await listarUnidadesParaBatea();
  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Nueva batea"
        description="Registrá el viaje antes de que llegue: así la recepción es solo inspeccionar y firmar."
        actions={
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
        }
      />
      <FormBatea unidades={unidades} />
    </section>
  );
}
