"use client";

import { Fragment } from "react";
import { useTikTokCopy } from "../i18n";

export default function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const t = useTikTokCopy();
  const steps = t.stepper.map((label, index) => ({ n: (index + 1) as 1 | 2 | 3, label }));

  return (
    <div data-i18n-skip style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
      <div className="stepper">
        {steps.map((s, i) => (
          <Fragment key={s.n}>
            <div className={`step-pill ${step === s.n ? "active" : ""} ${step > s.n ? "done" : ""}`}>
              <span className="step-num">{s.n}</span>
              <span className="step-pill-label">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className="step-divider"></div>}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
