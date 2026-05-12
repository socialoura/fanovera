"use client";

import { Fragment } from "react";
import { useFacebookCopy } from "../i18n";

export default function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = useFacebookCopy().stepper.map((label, index) => ({ n: (index + 1) as 1 | 2 | 3, label }));

  return (
    <div data-i18n-skip style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
      <div className="stepper">
        {steps.map((s, i) => (
          <Fragment key={s.n}>
            <div className={`step-pill ${step === s.n ? "active" : ""} ${step > s.n ? "done" : ""}`}>
              <span className="step-num">
                {step > s.n ? (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M2 5.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  s.n
                )}
              </span>
              <span className="step-pill-label">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className="step-divider"></div>}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
