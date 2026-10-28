import Link from "next/link";
import { Mail } from "lucide-react";
import { signIn } from "./actions";
import { PasswordInput } from "./password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LasacLogo } from "@/components/brand/lasac-logo";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams?.error;

  return (
    <main className="flex min-h-screen">
      {/* Panel izquierdo · branding */}
      <aside className="relative hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-gradient-to-br from-primary to-primary/80 p-12 text-primary-foreground overflow-hidden">
        <div className="relative z-10 flex items-baseline gap-2 text-4xl font-semibold tracking-tight">
          <span><span className="font-normal">Grupo</span> LASAC</span>
          <span aria-hidden className="h-3 w-3 rounded-full bg-accent" />
        </div>
        <div className="relative z-10 flex flex-col gap-4 max-w-md">
          <p className="text-xl font-medium leading-snug">
            Recepción de bateas e inspección de unidades con evidencia, desde el celular.
          </p>
          <p className="text-sm text-primary-foreground/80">
            Grupo LASAC · Forthing · FIAT · JAC · Dongfeng · CHERY · Tierra del Fuego
          </p>
        </div>
        {/* Decoración geométrica sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -bottom-40 h-[520px] w-[520px] rounded-full bg-accent/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-primary-foreground/10 blur-2xl"
        />
      </aside>

      {/* Panel derecho · formulario */}
      <section className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          {/* Logo solo en mobile */}
          <div className="mb-6 lg:hidden">
            <LasacLogo size="lg" />
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Inspecciones LASAC
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mismo usuario y clave que el DMS
            </p>
          </div>

          <form action={signIn} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="usuario@lasac.com.ar"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href="#"
                  className="text-xs text-primary hover:underline"
                  aria-disabled
                  tabIndex={-1}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <PasswordInput
                id="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="recordarme" name="recordarme" />
              <Label htmlFor="recordarme" className="text-sm font-normal">
                Recordarme en este dispositivo
              </Label>
            </div>

            {error ? (
              <p className="rounded-md bg-destructive-muted px-3 py-2 text-sm text-destructive">
                {decodeURIComponent(error)}
              </p>
            ) : null}

            <Button type="submit" className="w-full" size="lg">
              Ingresar
            </Button>
          </form>

          <p className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            ¿Problemas para acceder? Contactá a{" "}
            <a
              href="mailto:sistemas@lasac.com.ar"
              className="font-medium text-foreground hover:underline"
            >
              sistemas@lasac.com.ar
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
