import type { CSSProperties } from "react";
import NetIcon from "../../components/NetIcon";

type Pos = {
  top?: string;
  left?: string;
  right?: string;
  size: number;
  rot: number;
  anim: "drift-a" | "drift-b";
  tint: "" | "tinted-dark";
};

const POSITIONS: Pos[] = [
  { top: "6%", left: "4%", size: 56, rot: -14, anim: "drift-a", tint: "" },
  { top: "14%", right: "5%", size: 72, rot: 10, anim: "drift-b", tint: "tinted-dark" },
  { top: "42%", left: "2%", size: 44, rot: 18, anim: "drift-b", tint: "" },
  { top: "52%", right: "2%", size: 64, rot: -8, anim: "drift-a", tint: "tinted-dark" },
  { top: "78%", left: "6%", size: 50, rot: 4, anim: "drift-a", tint: "" },
  { top: "86%", right: "7%", size: 40, rot: -20, anim: "drift-b", tint: "tinted-dark" },
  { top: "24%", left: "11%", size: 32, rot: 22, anim: "drift-b", tint: "" },
  { top: "64%", right: "12%", size: 36, rot: -16, anim: "drift-a", tint: "tinted-dark" },
];

export default function SpoSprinkle({ count = 6, seed = 0 }: { count?: number; seed?: number }) {
  const start = seed % POSITIONS.length;
  const items: Pos[] = [];
  for (let i = 0; i < count; i++) items.push(POSITIONS[(start + i) % POSITIONS.length]);
  return (
    <>
      {items.map((p, i) => (
        <div
          key={i}
          className={`spo-deco ${p.anim} ${p.tint}`}
          style={{ top: p.top, left: p.left, right: p.right, ["--rot" as string]: p.rot + "deg" } as CSSProperties}
        >
          <NetIcon kind="spotify" color="currentColor" size={p.size} />
        </div>
      ))}
    </>
  );
}
