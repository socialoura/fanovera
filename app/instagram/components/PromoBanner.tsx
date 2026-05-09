"use client";

import { useEffect, useState } from "react";

export default function PromoBanner() {
  const [time, setTime] = useState({ h: 0, m: 14, s: 32 });
  useEffect(() => {
    const id = setInterval(() => {
      setTime((t) => {
        let { h, m, s } = t;
        s--;
        if (s < 0) {
          s = 59;
          m--;
        }
        if (m < 0) {
          m = 59;
          h--;
        }
        if (h < 0) {
          h = 0;
          m = 14;
          s = 32;
        }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="promo-banner">
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          padding: "0 16px",
        }}
      >
        <span style={{ fontWeight: 700 }}>★ Offre spéciale</span>
        <span>
          Code{" "}
          <span
            style={{
              background: "rgba(255,255,255,0.2)",
              padding: "2px 10px",
              borderRadius: 999,
              fontWeight: 800,
              letterSpacing: "0.05em",
            }}
          >
            FANO5
          </span>{" "}
          · −5% sur tout
        </span>
        <div style={{ display: "flex", gap: 4, fontFamily: "monospace", fontWeight: 700 }}>
          <span style={{ background: "rgba(0,0,0,0.25)", padding: "2px 8px", borderRadius: 6 }}>
            {pad(time.h)}h
          </span>
          <span style={{ background: "rgba(0,0,0,0.25)", padding: "2px 8px", borderRadius: 6 }}>
            {pad(time.m)}m
          </span>
          <span style={{ background: "rgba(0,0,0,0.25)", padding: "2px 8px", borderRadius: 6 }}>
            {pad(time.s)}s
          </span>
        </div>
      </div>
    </div>
  );
}
