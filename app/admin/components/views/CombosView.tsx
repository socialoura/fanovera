import { Ic } from "../icons";
import { ADMIN_DATA as D } from "../../data";

export default function CombosView() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: "var(--a-ink-3)", fontWeight: 600 }}>
          {D.combos.length} packs combinés · Multi-langue (FR / EN)
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn">{Ic.filter()} Toutes plateformes</button>
          <button className="btn primary">{Ic.plus()} Nouveau combo</button>
        </div>
      </div>

      <div className="grid-2">
        {D.combos.map((c) => {
          const plat = D.platforms.find((p) => p.name === c.plat);
          return (
            <div className="card" key={c.id} style={{ padding: 0, overflow: "hidden", position: "relative" }}>
              {/* Brand strip */}
              <div style={{ height: 4, background: plat ? `linear-gradient(90deg, ${plat.color}, ${plat.color}AA)` : "linear-gradient(90deg, #E04A8C, #FF8A3D)" }} />
              <div style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {plat ? (
                      <div className="plat-icon" style={{ background: plat.color, color: plat.color === "#FFFC00" ? "#000" : "white", width: 42, height: 42, fontSize: 14, borderRadius: 11 }}>{plat.icon}</div>
                    ) : (
                      <div className="plat-icon" style={{ background: "linear-gradient(135deg,#E04A8C,#FF8A3D)", color: "white", width: 42, height: 42, fontSize: 14, borderRadius: 11 }}>×{c.items.length}</div>
                    )}
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "var(--a-ink-3)", marginTop: 2, fontStyle: "italic" }}>EN: {c.name_en}</div>
                      <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                        <span className="pill">{c.plat}</span>
                        <span className="pill ink">−{c.discount}%</span>
                        <span className={"pill " + (c.active ? "green" : "red")}>
                          <span className="dot" />
                          {c.active ? "Actif" : "Inactif"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="icon-btn" style={{ width: 30, height: 30, borderRadius: 8 }}>{Ic.edit()}</button>
                    <button className="icon-btn" style={{ width: 30, height: 30, borderRadius: 8, color: "var(--a-red)" }}>{Ic.trash()}</button>
                  </div>
                </div>

                <div style={{ marginTop: 16, padding: 12, background: "var(--a-paper-2)", borderRadius: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--a-ink-3)", letterSpacing: "0.08em", marginBottom: 8 }}>ITEMS DU COMBO</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {c.items.map((it, i) => (
                      <span key={i} className="pill" style={{ background: "white", borderColor: "var(--a-line)" }}>+ {it}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
