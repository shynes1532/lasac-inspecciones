"use client";

// Pad de firma táctil (canvas) para el chofer. Exporta PNG.

import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FirmaPad({
  onCambio,
  disabled,
}: {
  onCambio: (blob: Blob | null) => void;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const [vacio, setVacio] = useState(true);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111";
  }, []);

  const punto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const inicio = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    dibujando.current = true;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = punto(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const mover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dibujando.current) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = punto(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (vacio) setVacio(false);
  };

  const fin = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dibujando.current) return;
    dibujando.current = false;
    e.currentTarget.toBlob((b) => onCambio(b), "image/png");
  };

  const limpiar = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setVacio(true);
    onCambio(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        className="h-40 w-full touch-none rounded-md border border-border bg-white"
        onPointerDown={inicio}
        onPointerMove={mover}
        onPointerUp={fin}
        onPointerCancel={fin}
        onPointerLeave={fin}
        aria-label="Área de firma"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{vacio ? "Firmá con el dedo" : "Firma capturada"}</span>
        <Button type="button" variant="outline" size="sm" onClick={limpiar} disabled={disabled || vacio}>
          <Eraser className="h-4 w-4" />
          Borrar
        </Button>
      </div>
    </div>
  );
}
