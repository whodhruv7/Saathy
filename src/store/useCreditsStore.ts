// Saathy V5 — Credit + Model Usage stores (localStorage, daily reset at midnight local time)
import { create } from "zustand";
import { persist } from "zustand/middleware";

const DAILY_ALLOWANCE = 100;

export const CREDIT_COSTS = {
  // Normal mode
  normal_chat: 0,
  normal_factual: 0,
  normal_debate: 1,
  // Research sub-modes
  target: 5,
  counter: 2,
  speech: 4,
  deepdive: 8,
  webdive: 6,
  lord: 12,
  // Pipeline
  pipeline_full: 15,
  pipeline_fast: 8,
} as const;

export type CostKey = keyof typeof CREDIT_COSTS;

interface CreditsState {
  credits: number;
  lastReset: string;        // toDateString
  cost: { key: CostKey; amount: number; ts: number } | null; // last consumed (for inline indicator)
  ensureFresh: () => void;
  consume: (key: CostKey) => boolean; // false if insufficient
  refund: (amount: number) => void;
  reset: () => void;
  remaining: () => number;
}

export const useCreditsStore = create<CreditsState>()(
  persist(
    (set, get) => ({
      credits: DAILY_ALLOWANCE,
      lastReset: new Date().toDateString(),
      cost: null,

      ensureFresh: () => {
        const today = new Date().toDateString();
        if (get().lastReset !== today) {
          set({ credits: DAILY_ALLOWANCE, lastReset: today, cost: null });
        }
      },

      // v6: credits UI removed — consume always succeeds, kept as no-op for handler compatibility.
      consume: (_key) => {
        get().ensureFresh();
        return true;
      },

      refund: (amount) => {
        if (amount <= 0) return;
        const next = Math.min(DAILY_ALLOWANCE, get().credits + amount);
        set({ credits: next });
      },

      reset: () => set({ credits: DAILY_ALLOWANCE, lastReset: new Date().toDateString(), cost: null }),

      remaining: () => {
        get().ensureFresh();
        return get().credits;
      },
    }),
    { name: "saathy-credits-v1" }
  )
);

export const DAILY_MAX = DAILY_ALLOWANCE;
