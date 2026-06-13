"use client";

import Image from "next/image";
import IgSprinkle from "./IgSprinkle";
import { formatQty } from "../data";
import Stepper from "./Stepper";
import { ProdIcon, ArrowRight, Check } from "./icons";
import { useI2Copy } from "../copy";
import { PRODUCT_META, type Selection } from "../products";
import type { IgPost } from "../types";

// IG-flavoured tile placeholders for posts without a usable thumbnail.
const GRADS = [
  ["#feda75", "#d62976"], ["#962fbf", "#d62976"], ["#4f5bd5", "#962fbf"], ["#fa7e1e", "#d62976"],
  ["#d62976", "#4f5bd5"], ["#962fbf", "#feda75"], ["#fa7e1e", "#962fbf"], ["#4f5bd5", "#d62976"],
  ["#d62976", "#fa7e1e"], ["#962fbf", "#4f5bd5"], ["#feda75", "#fa7e1e"], ["#4f5bd5", "#962fbf"],
];

type Props = {
  posts: IgPost[];
  sel: Selection;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  needsPosts: boolean;
  onNext: () => void;
  onBack: () => void;
};

export default function Step3Posts({ posts, sel, selectedIds, setSelectedIds, needsPosts, onNext, onBack }: Props) {
  const c = useI2Copy().step3;
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
      <IgSprinkle count={4} seed={4} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={3} needsPosts={needsPosts} />

        <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 28px" }}>
          <h1 className="display" style={{ fontSize: "clamp(30px,3.6vw,46px)", margin: "0 0 10px" }}>
            {c.titleBefore} <span className="squiggle ig">{c.titleFocus}</span>{c.titleAfter}
          </h1>
          <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.5, maxWidth: 540, margin: "0 auto" }}>{c.intro}</p>
        </div>

        <div className="checkout-grid ig2-two-col" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, maxWidth: 1100, margin: "0 auto", alignItems: "start" }}>
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

            {/* Posts grid — IG posts are square */}
            <div className="ig2-posts-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {posts.map((p, i) => {
                const isSel = selectedIds.includes(p.id);
                const g = GRADS[i % GRADS.length];
                return (
                  <div
                    key={p.id}
                    className={`ig2-post-tile ${isSel ? "sel" : ""}`}
                    onClick={() => toggle(p.id)}
                    style={{ background: `linear-gradient(150deg, ${g[0]}, ${g[1]})` }}
                  >
                    {p.thumbnailUrl && (
                      <Image src={p.thumbnailUrl} alt={p.caption?.slice(0, 50) || "Instagram post"} fill unoptimized style={{ objectFit: "cover" }} />
                    )}
                    <div className="ig2-post-check">{isSel && <Check size={13} />}</div>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 10, background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 55%)", color: "white" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 20C5 15 3 11 4.5 8 6 5.2 9.5 5.5 12 8.5 14.5 5.5 18 5.2 19.5 8 21 11 19 15 12 20z" /></svg>
                        {p.likeCount >= 1000 ? (p.likeCount / 1000).toFixed(0) + "k" : p.likeCount}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky distribution panel */}
          <div className="ig2-sticky">
            <div style={{ background: "white", border: "2px solid var(--ig-2)", borderRadius: 22, padding: 24, boxShadow: "0 18px 40px -18px rgba(214,41,118,0.25)" }}>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>{c.distribution}</div>

              {n === 0 ? (
                <div style={{ padding: "20px 12px", textAlign: "center", color: "var(--ink-3)", fontSize: 14 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>👆</div>
                  {c.empty}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {likesPack && (
                    <div style={{ padding: 14, background: "rgba(214,41,118,0.10)", borderRadius: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--ig-2)" }}>
                        <ProdIcon kind="heart" size={16} color="var(--ig-2)" /> {formatQty(likesPack.qty)} {c.likesUnit}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6 }}>{c.perVideoLikes(perPostLikes)}</div>
                    </div>
                  )}
                  {viewsPack && (
                    <div style={{ padding: 14, background: "rgba(79,91,213,0.12)", borderRadius: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#4f5bd5" }}>
                        <ProdIcon kind="play" size={16} color="#4f5bd5" /> {formatQty(viewsPack.qty)} {c.viewsUnit}
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

              <button className="btn-primary btn-ig" onClick={onNext} disabled={n === 0} style={{ width: "100%", padding: 15, fontSize: 16, marginTop: 18 }}>
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
