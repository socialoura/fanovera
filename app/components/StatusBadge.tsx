"use client";

import { useEffect, useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { getDictionary } from "../i18n/dictionaries";

export default function StatusBadge() {
  const [today, setToday] = useState<string | null>(null);
  const { locale } = useI18n();
  const dict = getDictionary(locale);

  useEffect(() => {
    setToday(
      new Intl.DateTimeFormat(dict.htmlLang, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    );
  }, [dict.htmlLang, locale]);

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
          <span data-i18n-skip>
            {dict.status.operational} ·{" "}
            <strong style={{ color: "var(--ink)", fontWeight: 700 }}>
              {dict.status.asOf} {today}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
