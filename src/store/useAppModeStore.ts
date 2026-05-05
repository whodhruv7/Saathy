// Saathy v6.5 — Two top-level App Modes: Normal | Research.
// Pipeline lives inside Research as a sub-mode.
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppMode = "normal" | "research";
export type ResearchSubMode =
  | "target"
  | "counter"
  | "speech"
  | "dossier"
  | "deepdive"
  | "webdive"
  | "lord"
  | "pipeline"; // full multi-stage dossier

interface AppModeState {
  appMode: AppMode;
  subMode: ResearchSubMode;
  pipelineFast: boolean; // false = full 9-stage, true = fast 4-stage
  setAppMode: (m: AppMode) => void;
  setSubMode: (m: ResearchSubMode) => void;
  setPipelineFast: (v: boolean) => void;
}

export const useAppModeStore = create<AppModeState>()(
  persist(
    (set) => ({
      appMode: "normal",
      subMode: "target",
      pipelineFast: false,
      setAppMode: (m) => set({ appMode: m }),
      setSubMode: (m) => set({ subMode: m }),
      setPipelineFast: (v) => set({ pipelineFast: v }),
    }),
    {
      name: "saathy-app-mode-v2",
      // migrate any persisted "pipeline" appMode to research+pipeline subMode
      migrate: (persisted: unknown) => {
        const s = (persisted ?? {}) as { appMode?: string; subMode?: string; pipelineFast?: boolean };
        if (s.appMode === "pipeline") {
          return { appMode: "research", subMode: "pipeline", pipelineFast: s.pipelineFast ?? false } as AppModeState;
        }
        return { appMode: (s.appMode as AppMode) ?? "normal", subMode: (s.subMode as ResearchSubMode) ?? "target", pipelineFast: s.pipelineFast ?? false } as AppModeState;
      },
      version: 2,
    }
  )
);
