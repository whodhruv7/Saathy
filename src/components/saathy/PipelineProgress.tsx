import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, X, Minus } from "lucide-react";
import { DEFAULT_MODEL_CONFIG } from "@/lib/modelConfig";
import type { ModelId, PipelineStage } from "@/types";

const ORDER: ModelId[] = ["kimi", "glm", "qwen", "deepseek", "nemotron", "gemini", "claude"];

export const PipelineProgress = ({ stages }: { stages: PipelineStage[] }) => {
  if (!stages || stages.length === 0) return null;
  const byId = new Map(stages.map((s) => [s.id, s]));

  // Live activity caption: whatever is currently running, with its label.
  const running = stages.find((s) => s.status === "running");
  const meta = running ? DEFAULT_MODEL_CONFIG[running.id] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 space-y-2"
    >
      <div className="flex flex-wrap gap-1.5">
        {ORDER.filter((id) => byId.has(id)).map((id) => {
          const s = byId.get(id)!;
          const m = DEFAULT_MODEL_CONFIG[id];
          return (
            <div
              key={id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-card border text-[10px] font-medium transition-colors"
              style={{
                borderColor:
                  s.status === "running" ? m.color :
                  s.status === "done" ? "hsl(var(--brand-sage) / 0.4)" :
                  "hsl(var(--border))",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
              <span className="text-foreground">{m.name}</span>
              {s.status === "running" && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
              {s.status === "done" && <Check className="w-3 h-3 text-[hsl(var(--brand-sage))]" />}
              {s.status === "error" && <X className="w-3 h-3 text-[hsl(var(--destructive))]" />}
              {s.status === "skipped" && <Minus className="w-3 h-3 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {running && meta && (
          <motion.div
            key={`${running.id}-${running.label}`}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.18 }}
            className="text-[11px] text-muted-foreground flex items-center gap-1.5 pl-1"
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: meta.color }} />
            <span className="font-medium" style={{ color: meta.color }}>{meta.name}</span>
            <span>·</span>
            <span className="italic">{running.label || `${meta.role.toLowerCase()}…`}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
