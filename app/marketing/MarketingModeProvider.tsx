"use client";

import { createContext, useContext, useMemo } from "react";
import type { MarketingMode, SurfaceMarketingMode } from "../lib/marketingModeTypes";

type MarketingModeContextValue = {
  mode: MarketingMode;
  surfaceMode: SurfaceMarketingMode;
};

const MarketingModeContext = createContext<MarketingModeContextValue>({ mode: "clean", surfaceMode: "whitehat" });

export function MarketingModeProvider({
  children,
  initialMode = "clean",
  initialSurfaceMode = "whitehat",
}: {
  children: React.ReactNode;
  initialMode?: MarketingMode;
  initialSurfaceMode?: SurfaceMarketingMode;
}) {
  const value = useMemo<MarketingModeContextValue>(
    () => ({ mode: initialMode, surfaceMode: initialSurfaceMode }),
    [initialMode, initialSurfaceMode],
  );
  return <MarketingModeContext.Provider value={value}>{children}</MarketingModeContext.Provider>;
}

export function useMarketingMode() {
  return useContext(MarketingModeContext);
}
