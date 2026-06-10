import type { ProductMeta } from "../products";

export function ProdIcon({ kind, size = 20, color = "currentColor" }: { kind: ProductMeta["icon"]; size?: number; color?: string }) {
  const s = { fill: "none", stroke: color, strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "user":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" {...s} />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" {...s} />
        </svg>
      );
    case "heart":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M12 20C5 15 3 11 4.5 8 6 5.2 9.5 5.5 12 8.5 14.5 5.5 18 5.2 19.5 8 21 11 19 15 12 20z" {...s} />
        </svg>
      );
    case "play":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" {...s} />
          <path d="M10 9l5 3-5 3z" fill={color} stroke={color} />
        </svg>
      );
  }
}

export function ArrowRight({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Check({ size = 13, color = "white" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M3 7l3 3 5-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
