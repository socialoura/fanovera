"use client";

import { useEffect, useState } from "react";

export default function StatusBadge() {
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    setToday(
      new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    );
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginBottom: 22,
        minHeight: 38,
      }}
    >
      {today && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 16px",
            background: "white",
            border: "1px solid var(--line)",
            borderRadius: 999,
            fontSize: 13,
            color: "var(--ink-2)",
            fontWeight: 500,
            maxWidth: "100%",
          }}
        >
          <span className="ping-dot" />
          <span>
            Tous nos services sont opérationnels ·{" "}
            <strong style={{ color: "var(--ink)", fontWeight: 700 }}>au {today}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
