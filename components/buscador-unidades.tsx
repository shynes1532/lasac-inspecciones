"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function BuscadorUnidades() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        defaultValue={params.get("q") ?? ""}
        placeholder="Stock, chasis o modelo…"
        className="h-11 pl-9 text-base"
        inputMode="search"
        aria-label="Buscar unidades"
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value) next.set("q", e.target.value);
          else next.delete("q");
          router.replace(`${pathname}?${next.toString()}`);
        }}
      />
    </div>
  );
}
