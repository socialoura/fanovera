"use client";

import { Fragment } from "react";
import { useI2Copy } from "../copy";
import { Check } from "./icons";

// Dynamic stepper: the "Vos posts" step only appears when the order contains
// likes/views (needsPosts). Step numbers stay 1..N visually.
export default function Stepper({ step, needsPosts }: { step: number; needsPosts: boolean }) {
  const c = useI2Copy().stepper;
  const steps = [
    { n: 1, label: c.instagram },
    { n: 2, label: c.quantities },
    ...(needsPosts ? [{ n: 3, label: c.posts }] : []),
    { n: 4, label: c.payment },
  ];

  return (
    <div data-i18n-skip style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
      <div className="stepper">
        {steps.map((s, i) => (
          <Fragment key={s.n}>
            <div className={`step-pill ${step === s.n ? "active" : ""} ${step > s.n ? "done" : ""} ${step !== s.n ? "ig2-inactive-md" : ""}`}>
              <span className="step-num">{step > s.n ? <Check size={11} /> : i + 1}</span>
              <span className="step-pill-label">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className="step-divider" />}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
