// Saathy V5 — Per-model daily usage counter (localStorage). Used by ModelRotator.
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ModelUsageState {
  // map of `${modelKey}|${dateStr}` -> count
  usage: Record<string, number>;
  todayStr: string;
  ensureFresh: () => void;
  get: (key: string) => number;
  record: (key: string, n?: number) => void;
  prune: () => void; // drop entries from prior days
  resetAll: () => void;
}

export const useModelUsageStore = create<ModelUsageState>()(
  persist(
    (set, get) => ({
      usage: {},
      todayStr: new Date().toDateString(),

      ensureFresh: () => {
        const today = new Date().toDateString();
        if (get().todayStr !== today) {
          // keep counters but switch day; pruning happens lazily
          set({ todayStr: today });
          get().prune();
        }
      },

      get: (key) => {
        get().ensureFresh();
        return get().usage[`${key}|${get().todayStr}`] || 0;
      },

      record: (key, n = 1) => {
        get().ensureFresh();
        const k = `${key}|${get().todayStr}`;
        set({ usage: { ...get().usage, [k]: (get().usage[k] || 0) + n } });
      },

      prune: () => {
        const today = get().todayStr;
        const next: Record<string, number> = {};
        for (const [k, v] of Object.entries(get().usage)) {
          if (k.endsWith(`|${today}`)) next[k] = v;
        }
        set({ usage: next });
      },

      resetAll: () => set({ usage: {} }),
    }),
    { name: "saathy-model-usage-v1" }
  )
);
