"use client";

import Image from "next/image";
import TtSprinkle from "../../tiktok/components/TtSprinkle";
import { formatQty } from "../../tiktok/data";
import Stepper from "./Stepper";
import { ProdIcon, ArrowRight, Check } from "./icons";
import { useT2Copy } from "../copy";
import { PRODUCT_META, type Selection } from "../products";
import type { TtPost } from "../types";

const GRADS = [
  ["#fe2c55", "#25f4ee"], ["#7b2ff7", "#fe2c55"], ["#25f4ee", "#0a9b96"], ["#ff8a4c", "#fe2c55"],
  ["#fe2c55", "#7b2ff7"], ["#0a9b96", "#25f4ee"], ["#f5b800", "#fe2c55"], ["#4f5bd5", "#25f4ee"],
  ["#fe2c55", "#ff8a4c"], ["#7b2ff7", "#25f4ee"], ["#25f4ee", "#fe2c55"], ["#0a9b96", "#7b2ff7"],
];

type Props = {
  posts: TtPost[];
  sel: Selection;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  needsPosts: boolean;
  onNext: () => void;
  onBack: () => void;
};

export default function Step3Posts({ posts, sel, selectedIds, setSelectedIds, needsPosts, onNext, onBack }: Props) {
  const c = useT2Copy().step3;
  const likesPack = sel.likes != null ? PRODUCT_META.likes.packs[sel.likes] : null;
  const viewsPack = sel.views != null ? PRODUCT_META.views.packs[sel.views] : null;
  const n = selectedIds.length;

  const toggle = (id: string) =>
    setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  const selectAll = () => setSelectedIds(posts.map((p) => p.id));
  const clearAll = () => setSelectedIds([]);

  const likesTotal = likesPack ? likesPack.qty + likesPack.bonus : 0;
  const viewsTotal = viewsPack ? viewsPack.qty + viewsPack.bonus : 0;
  const perPostLikes = n ? Math.floor(likesTotal / n) : 0;
  const perPostViews = n ? Math.floor(viewsTotal / n) : 0;

  return (
    <section className="slide-in" style={{ padding: "40px 0 0", position: "relative" }}>
      <TtSprinkle count={4} seed={4} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={3} needsPosts={needsPosts} />

        <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 28px" }}>
          <h1 className="display" style={{ fontSize: "clamp(30px,3.6vw,46px)", margin: "0 0 10px" }}>
            {c.titleBefore} <span className="squiggle tt">{c.titleFocus}</span>{c.titleAfter}
          </h1>
          <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.5, maxWidth: 540, margin: "0 auto" }}>{c.intro}</p>
        </div>

        <div className="checkout-grid tt2-two-col" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, maxWidth: 1100, margin: "0 auto", alignItems: "start" }}>
          <div>
            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {c.selected(n)} <span style={{ color: "var(--ink-3)", fontWeight: 500 }}>{c.last}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={selectAll} className="btn-soft" style={{ padding: "8px 14px", fontSize: 13 }}>{c.selectAll}</button>
                {n > 0 && <button onClick={clearAll} className="btn-soft" style={{ padding: "8px 14px", fontSize: 13 }}>{c.clear}</button>}
              </div>
            </div>

            {/* Posts grid */}
            <div className="tt2-posts-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {posts.map((p, i) => {
                const isSel = selectedIds.includes(p.id);
                const g = GRADS[i % GRADS.length];
                return (
                  <div
                    key={p.id}
                    className={`tt2-post-tile ${isSel ? "sel" : ""}`}
                    onClick={() => toggle(p.id)}
                    style={{ background: `linear-gradient(150deg, ${g[0]}, ${g[1]})` }}
                  >
                    {p.thumbnailUrl && (
                      <Image src={p.thumbnailUrl} alt={p.desc?.slice(0, 50) || "TikTok video"} fill unoptimized style={{ objectFit: "cover" }} />
                    )}
                    <div className="tt2-post-check">{isSel && <Check size={13} />}</div>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 10, background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 55%)", color: "white" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                        {p.playCount >= 1000 ? (p.playCount / 1000).toFixed(0) + "k" : p.playCount}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky distribution panel */}
          <div className="tt2-sticky">
            <div style={{ background: "white", border: "2px solid var(--tt-ink)", borderRadius: 22, padding: 24, boxShadow: "0 18px 40px -18px rgba(1,1,1,0.25)" }}>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>{c.distribution}</div>

              {n === 0 ? (
                <div style={{ padding: "20px 12px", textAlign: "center", color: "var(--ink-3)", fontSize: 14 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>👆</div>
                  {c.empty}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {likesPack && (
                    <div style={{ padding: 14, background: "var(--tt-red-soft)", borderRadius: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--tt-red)" }}>
                        <ProdIcon kind="heart" size={16} color="var(--tt-red)" /> {formatQty(likesPack.qty)} {c.likesUnit}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6 }}>{c.perVideoLikes(perPostLikes)}</div>
                    </div>
                  )}
                  {viewsPack && (
                    <div style={{ padding: 14, background: "var(--tt-cyan-soft)", borderRadius: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#0a9b96" }}>
                        <ProdIcon kind="play" size={16} color="#0a9b96" /> {formatQty(viewsPack.qty)} {c.viewsUnit}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6 }}>{c.perVideoViews(perPostViews)}</div>
                    </div>
                  )}
                  {sel.followers != null && (
                    <div style={{ padding: "12px 14px", background: "var(--paper-2)", borderRadius: 14, fontSize: 13, color: "var(--ink-2)", display: "flex", gap: 8, alignItems: "center" }}>
                      <ProdIcon kind="user" size={16} color="var(--ink-2)" /> {c.followersNote(formatQty(PRODUCT_META.followers.packs[sel.followers].qty))}
                    </div>
                  )}
                </div>
              )}

              <button className="btn-primary btn-tt" onClick={onNext} disabled={n === 0} style={{ width: "100%", padding: 15, fontSize: 16, marginTop: 18 }}>
                {c.goToPayment}
                <ArrowRight />
              </button>
              <button onClick={onBack} style={{ width: "100%", textAlign: "center", marginTop: 12, fontSize: 13, fontWeight: 600, color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer" }}>
                {c.editQuantities}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
