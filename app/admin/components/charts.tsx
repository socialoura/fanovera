type SeriesPoint = { d: number; rev: number; smm: number; ads: number };

export function LineChart({ series, height = 260 }: { series: SeriesPoint[]; height?: number }) {
  const W = 880, H = height, pad = { t: 16, r: 12, b: 28, l: 44 };
  const data = series;
  const allVals = data.flatMap((d) => [d.rev, d.smm, d.ads]);
  const maxY = Math.max(...allVals) * 1.1;
  const minY = 0;
  const xAt = (i: number) => pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r);
  const yAt = (v: number) => pad.t + (1 - (v - minY) / (maxY - minY)) * (H - pad.t - pad.b);

  const buildPath = (key: keyof SeriesPoint) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(d[key]).toFixed(1)}`).join(" ");
  const buildArea = (key: keyof SeriesPoint) =>
    `M ${xAt(0)} ${H - pad.b} ` +
    data.map((d, i) => `L ${xAt(i).toFixed(1)} ${yAt(d[key]).toFixed(1)}`).join(" ") +
    ` L ${xAt(data.length - 1)} ${H - pad.b} Z`;

  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => (maxY * i) / ticks);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E04A8C" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#E04A8C" stopOpacity="0" />
        </linearGradient>
      </defs>
      {tickVals.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={yAt(v)} y2={yAt(v)} stroke="#E8E4D8" strokeDasharray={i === 0 ? "0" : "3 4"} />
          <text x={pad.l - 8} y={yAt(v) + 4} fontSize="10" fill="#9A9285" textAnchor="end" fontFamily="Plus Jakarta Sans">
            {v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(0)}
          </text>
        </g>
      ))}
      {data.map((d, i) =>
        i % 5 === 0 ? (
          <text key={i} x={xAt(i)} y={H - 8} fontSize="10" fill="#9A9285" textAnchor="middle" fontFamily="Plus Jakarta Sans">
            J-{29 - i}
          </text>
        ) : null,
      )}
      <path d={buildArea("rev")} fill="url(#revGrad)" />
      <path d={buildPath("rev")} fill="none" stroke="#E04A8C" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <path d={buildPath("smm")} fill="none" stroke="#3B5BDB" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <path d={buildPath("ads")} fill="none" stroke="#C68A19" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 3" />
      <circle cx={xAt(data.length - 1)} cy={yAt(data[data.length - 1].rev)} r="4" fill="#E04A8C" stroke="white" strokeWidth="2" />
    </svg>
  );
}

export function Sparkline({ values, color = "#E04A8C", w = 90, h = 30 }: { values: number[]; color?: string; w?: number; h?: number }) {
  const max = Math.max(...values),
    min = Math.min(...values);
  const path = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="spark">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type DonutDatum = { key?: string; label: string; value: number; color: string };

export function Donut({ data, size = 160, thickness = 24 }: { data: DonutDatum[]; size?: number; thickness?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0EDE3" strokeWidth={thickness} />
      {data.map((d, i) => {
        const frac = d.value / total;
        const dash = frac * C;
        const offset = -acc * C;
        acc += frac;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${C - dash}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="800" fill="#14110D" fontFamily="Plus Jakarta Sans" letterSpacing="-0.02em">
        {total.toLocaleString("fr-FR")}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fontWeight="700" fill="#6B6256" fontFamily="Plus Jakarta Sans" letterSpacing="0.1em">
        COMMANDES
      </text>
    </svg>
  );
}

export function Heatmap({ values }: { values: number[] }) {
  const max = Math.max(...values);
  return (
    <div>
      <div className="heatmap">
        {values.map((v, i) => {
          const t = v / max;
          const bg =
            t < 0.05
              ? "#F5F1E5"
              : `color-mix(in oklab, #E04A8C ${(t * 90).toFixed(0)}%, #F5F1E5)`;
          return (
            <div key={i} className="heatmap-cell" style={{ background: bg }} title={`${i}h UTC — ${v} cmd`}>
              {v === max && (
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "white", fontSize: 9, fontWeight: 800 }}>
                  ★
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(24, 1fr)", gap: 4, marginTop: 6 }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} style={{ fontSize: 9, textAlign: "center", color: "#9A9285", fontWeight: 600, fontFamily: "Plus Jakarta Sans" }}>
            {i % 3 === 0 ? `${i}h` : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
