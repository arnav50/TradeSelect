import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Exchange, MarketCap } from "@/types/candidate";

type FiltersState = {
  minConviction: number;          // 0..10
  exchange: Exchange | "ALL";
  mcap: MarketCap | "ALL";
  sector: string | "ALL";
  hideIlliquid: boolean;
  set: (patch: Partial<Omit<FiltersState, "set" | "reset">>) => void;
  reset: () => void;
};

const defaults = {
  minConviction: 0,
  exchange: "ALL" as const,
  mcap: "ALL" as const,
  sector: "ALL" as const,
  hideIlliquid: false,
};

export const useFilters = create<FiltersState>()(
  persist(
    (set) => ({
      ...defaults,
      set: (patch) => set(patch),
      reset: () => set(defaults),
    }),
    { name: "tradeselect.filters" },
  ),
);
