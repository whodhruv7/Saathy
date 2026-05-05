import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, X, Minus } from "lucide-react";

export type ResearchStageStatus = "waiting" | "running" | "done" | "error" | "skipped";

export interface ResearchStage {
  n: number;
  status: ResearchStageStatus;
  message?: string;
}

const STAGE_META = [
  { n: 1, label: "Query Decomposer", model: "Gemini Flash-Lite" },
  { n: 2, label: "Web Search Engine", model: "Gemini Flash + Google Search" },
  { n: 3, label: "Deep URL Reader", model: "Grounding citations" },
  { n: 4, label: "Specialist Analysts", model: "4 models · parallel" },
  { n: 5, label: "Live Google Search", model: "Gemini Flash" },
  { n: 6, label: "Fact Verifier", model: "Gemini Flash-Lite" },
  { n: 7, label: "Master Synthesis", model: "Gemini 2.5 Pro" },
];

export const ResearchPipelineProgress = ({
  stages,
  elapsedMs,
}: {
  stages: ResearchStage[];
  elapsedMs?: number;
}) => {
  if (!stages || stages.length === 0) return null;
  const byN = new Map(stages.map((s) => [s.n, s]));
  const allDone = STAGE_META.every((s) => {
    const st = byN.get(s.n)?.status;
    return st === "done" || st === "skipped";
  });
  const elapsedSec = elapsedMs ? Math.floor(elapsedMs / 1000) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 border border-border rounded-2xl bg-gradient-to-br from-card to-[hsl(var(--bg-secondary))] overflow-hidden shadow-soft"
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-serif text-sm text-[hsl(var(--brand-forest))]">
            {allDone ? "Research Pipeline · Complete" : "Research Pipeline · Running"}
          </span>
        </div>
        {elapsedSec !== null && (
          <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
            {elapsedSec}s · target ~25-45s
          </span>
        )}
      </div>
      <ol className="p-2 space-y-0.5">
        {STAGE_META.map((meta) => {
          const s = byN.get(meta.n);
          const status: ResearchStageStatus = s?.status || "waiting";
          return (
            <li
              key={meta.n}
              className="flex items-start gap-2.5 px-2 py-1.5 rounded-lg transition"
              style={{
                background:
                  status === "running"
                    ? "color-mix(in srgb, hsl(var(--brand-sage)) 8%, transparent)"
                    : "transparent",
              }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5"
                style={{
                  background:
                    status === "done"
                      ? "hsl(var(--brand-sage))"
                      : status === "running"
                      ? "hsl(var(--brand-forest))"
                      : status === "error"
                      ? "hsl(var(--destructive))"
                      : status === "skipped"
                      ? "hsl(var(--muted))"
                      : "hsl(var(--bg-tertiary))",
                  color:
                    status === "waiting" || status === "skipped"
                      ? "hsl(var(--muted-foreground))"
                      : "hsl(var(--primary-foreground))",
                }}
              >
                {status === "done" && <Check className="w-3 h-3" strokeWidth={3} />}
                {status === "running" && <Loader2 className="w-3 h-3 animate-spin" />}
                {status === "error" && <X className="w-3 h-3" strokeWidth={3} />}
                {status === "skipped" && <Minus className="w-3 h-3" />}
                {status === "waiting" && meta.n}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className={
                      status === "waiting"
                        ? "text-xs text-muted-foreground"
                        : "text-xs font-semibold text-foreground"
                    }
                  >
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{meta.model}</span>
                </div>
                <AnimatePresence mode="wait">
                  {s?.message && (
                    <motion.div
                      key={s.message}
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-[11px] italic text-muted-foreground leading-snug mt-0.5"
                    >
                      {s.message}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </li>
          );
        })}
      </ol>
    </motion.div>
  );
};
