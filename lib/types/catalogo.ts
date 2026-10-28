// Fuente única de marcas del grupo (espejo de grupo-lasac-admin).
export const MARCAS = ["Forthing", "FIAT", "JAC", "Dongfeng", "CHERY"] as const;
export type Marca = (typeof MARCAS)[number];

export const MARCA_BADGE: Record<Marca, string> = {
  FIAT: "bg-[#a4133c]/10 text-[#a4133c] border-[#a4133c]/30",
  JAC: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  Dongfeng: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  Forthing: "bg-[#4aa485]/10 text-[#2e7a5e] border-[#4aa485]/30",
  CHERY: "bg-purple-500/10 text-purple-600 border-purple-500/30",
};
