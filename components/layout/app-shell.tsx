"use client";

// Shell mobile-first: barra superior compacta y navegación inferior
// con el pulgar. En desktop la navegación pasa arriba.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck, Car, ShieldAlert, LogOut, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LasacLogo } from "@/components/brand/lasac-logo";
import { signOut } from "@/app/login/actions";

const NAV: { href: string; label: string; icon: LucideIcon; match: (p: string) => boolean }[] = [
  { href: "/", label: "Bateas", icon: Truck, match: (p) => p === "/" || p.startsWith("/bateas") || p.startsWith("/inspeccion") },
  { href: "/unidades", label: "Unidades", icon: Car, match: (p) => p.startsWith("/unidades") },
  { href: "/danios", label: "Daños", icon: ShieldAlert, match: (p) => p.startsWith("/danios") },
];

export function AppShell({ userEmail, children }: { userEmail: string | null; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-surface px-4 pt-[env(safe-area-inset-top)]">
        <Link href="/" className="flex items-center gap-2">
          <LasacLogo size="sm" />
          <span className="text-xs font-medium text-muted-foreground">Inspecciones</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Secciones">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                n.match(pathname) ? "bg-primary-muted text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            title={userEmail ?? undefined}
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{userEmail?.split("@")[0]}</span>
          </button>
        </form>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 pb-24 md:px-6 md:py-6 animate-in fade-in duration-300">
          {children}
        </div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
        aria-label="Navegación"
      >
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = n.match(pathname);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
