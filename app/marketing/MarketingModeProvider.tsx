"use client";

import { createContext, useContext, useMemo } from "react";
import type { MarketingMode } from "../lib/marketingModeTypes";

type MarketingModeContextValue = {
  mode: MarketingMode;
};

const MarketingModeContext = createContext<MarketingModeContextValue>({ mode: "clean" });

export function MarketingModeProvider({
  children,
  initialMode = "clean",
}: {
  children: React.ReactNode;
  initialMode?: MarketingMode;
}) {
  const value = useMemo<MarketingModeContextValue>(() => ({ mode: initialMode }), [initialMode]);
  return <MarketingModeContext.Provider value={value}>{children}</MarketingModeContext.Provider>;
}

export function useMarketingMode() {
  return useContext(MarketingModeContext);
}
