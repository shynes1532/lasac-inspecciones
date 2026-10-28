import { cn } from "@/lib/utils";

interface LasacLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tamaño del texto. sm → base, md → lg, lg → 2xl */
  size?: "sm" | "md" | "lg";
}

/**
 * Logo textual de Grupo LASAC con punto rojo al final.
 * Ejemplo: Grupo LASAC·
 */
export function LasacLogo({ size = "md", className, ...props }: LasacLogoProps) {
  const textSize = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  }[size];
  const dotSize = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  }[size];

  return (
    <div
      className={cn("flex items-baseline gap-1 font-semibold tracking-tight", className)}
      {...props}
    >
      <span className={textSize}>
        <span className="font-normal">Grupo</span> LASAC
      </span>
      <span
        aria-hidden
        className={cn("rounded-full bg-accent", dotSize)}
      />
    </div>
  );
}
