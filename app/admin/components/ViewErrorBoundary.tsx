"use client";

import { Component, type ReactNode } from "react";

/**
 * Catches render/runtime errors in a single admin view so one broken view
 * (e.g. malformed API data) shows an inline fallback instead of white-screening
 * the entire admin. Reset it by changing the `key` prop (we key by view id, so
 * navigating to another tab clears the error).
 */
export default class ViewErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[admin] view crashed:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            margin: 24,
            padding: 24,
            borderRadius: 14,
            background: "rgba(220,38,38,0.06)",
            border: "1px solid rgba(220,38,38,0.35)",
            color: "#b91c1c",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>
            Cette vue a planté
          </div>
          <div style={{ fontSize: 13, color: "#7f1d1d", marginBottom: 14, lineHeight: 1.5 }}>
            Le reste de l&apos;admin fonctionne — change d&apos;onglet puis reviens, ou recharge la page.
            Détail technique : <code>{this.state.error.message}</code>
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => this.setState({ error: null })}
            style={{ fontWeight: 700 }}
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
