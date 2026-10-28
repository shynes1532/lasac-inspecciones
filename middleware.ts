import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Sin las variables de Supabase el cliente explota en el middleware y
  // toda la app devuelve 500 sin explicación. Mejor decirlo en claro.
  const faltan = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"].filter(
    (k) => !process.env[k],
  );
  if (faltan.length > 0) {
    return new NextResponse(
      `Falta configurar en Vercel: ${faltan.join(", ")}.\n` +
        "Settings → Environment Variables → agregar → Redeploy.",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
