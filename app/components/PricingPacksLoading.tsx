"use client";

export default function PricingPacksLoading({ accent = "var(--primary)" }: { accent?: string }) {
  return (
    <section
      data-testid="pricing-loading"
      aria-busy="true"
      aria-label="Chargement des offres"
      style={{ padding: "40px 0 56px", position: "relative" }}
    >
      <div className="container">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              height: 22,
              width: "min(420px, 70%)",
              margin: "0 auto 24px",
              borderRadius: 999,
              background: "linear-gradient(90deg, var(--paper-2), white, var(--paper-2))",
            }}
          />
          <div className="pack-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 32 }}>
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                style={{
                  minHeight: 146,
                  borderRadius: 18,
                  border: "1px solid var(--line)",
                  background: "white",
                  padding: 16,
                  boxShadow: "0 14px 28px -22px rgba(29,29,44,0.28)",
                }}
              >
                <div style={{ height: 10, width: "42%", borderRadius: 999, background: "var(--paper-2)", marginBottom: 14 }} />
                <div style={{ height: 26, width: "68%", borderRadius: 999, background: "var(--paper-2)", marginBottom: 20 }} />
                <div style={{ height: 9, width: "56%", borderRadius: 999, background: "rgba(77,191,138,0.16)", marginBottom: 18 }} />
                <div style={{ height: 1, background: "var(--line)", marginBottom: 16 }} />
                <div style={{ height: 20, width: "62%", borderRadius: 999, background: accent, opacity: 0.16 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
