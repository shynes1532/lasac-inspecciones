"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ShieldAlert, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type VistaDanios = "danios" | "transportistas";

export function DaniosTabs({ counts }: { counts: Record<VistaDanios, number> }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const vista = (params.get("vista") as VistaDanios | null) ?? "danios";

  const tabs: { key: VistaDanios; label: string; icon: typeof ShieldAlert; href: string }[] = [
    { key: "danios", label: "Daños y reclamos", icon: ShieldAlert, href: pathname },
    { key: "transportistas", label: "Por transportista", icon: Building2, href: `${pathname}?vista=transportistas` },
  ];

  return (
    <nav className="flex gap-1 border-b border-border overflow-x-auto" aria-label="Vistas de daños">
      {tabs.map((t) => {
        const active = vista === t.key;
        const Icon = t.icon;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 px-3 pb-2.5 pt-1.5 text-sm font-medium -mb-px transition-colors whitespace-nowrap",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border-strong",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {t.label}
            <span
              className={cn(
                "ml-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                active ? "bg-primary-muted text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              {counts[t.key]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
