import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type Tono = "primary" | "accent" | "success" | "warning" | "info" | "destructive";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tono?: Tono;
  delta?: {
    value: number;
    label?: string;
  };
}

const TONO_CLASSES: Record<Tono, { bg: string; text: string }> = {
  primary: { bg: "bg-primary-muted", text: "text-primary" },
  accent: { bg: "bg-accent-muted", text: "text-accent" },
  success: { bg: "bg-success-muted", text: "text-success" },
  warning: { bg: "bg-warning-muted", text: "text-warning" },
  info: { bg: "bg-info-muted", text: "text-info" },
  destructive: { bg: "bg-destructive-muted", text: "text-destructive" },
};

/**
 * Tarjeta de métrica para dashboards.
 * Muestra label + valor grande + delta opcional con flecha de tendencia.
 */
export function StatCard({ label, value, icon: Icon, tono = "primary", delta }: StatCardProps) {
  const tonoCls = TONO_CLASSES[tono];
  const DeltaIcon = delta ? (delta.value > 0 ? TrendingUp : delta.value < 0 ? TrendingDown : Minus) : null;
  const deltaColor = delta
    ? delta.value > 0
      ? "text-success"
      : delta.value < 0
        ? "text-destructive"
        : "text-muted-foreground"
    : "";

  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
            {value}
          </div>
          {delta && DeltaIcon ? (
            <div className={cn("mt-1 flex items-center gap-1 text-xs font-medium", deltaColor)}>
              <DeltaIcon className="h-3.5 w-3.5" />
              <span>
                {delta.value > 0 ? "+" : ""}
                {delta.value}%
              </span>
              {delta.label ? (
                <span className="text-muted-foreground">· {delta.label}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            tonoCls.bg,
            tonoCls.text,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </CardContent>
    </Card>
  );
}
