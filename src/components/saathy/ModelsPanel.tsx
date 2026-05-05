import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Workflow } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_MODEL_CONFIG, loadModelConfig, saveModelConfig } from "@/lib/modelConfig";
import type { ModelConfig, ModelId } from "@/types";

interface Props {
  config: ModelConfig;
  onChange: (cfg: ModelConfig) => void;
}

export const ModelsPanel = ({ config, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const coreIds: ModelId[] = ["kimi", "glm", "qwen", "deepseek", "nemotron", "gemini", "claude"];
  const extendedIds: ModelId[] = ["mistral", "minimax", "phi3", "solar", "yi", "zephyr"];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (id: ModelId, val: boolean) => {
    if (config[id].alwaysOn) return;
    const next: ModelConfig = { ...config, [id]: { ...config[id], enabled: val } };
    onChange(next);
    saveModelConfig(next);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-card hover:border-[hsl(var(--brand-sage))] transition whitespace-nowrap"
      >
        <Workflow className="w-3.5 h-3.5" />
        Research Pipeline
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 w-80 bg-card border border-border rounded-2xl shadow-elevated p-4 z-50"
          >
            <div className="mb-3">
              <h3 className="font-serif text-lg text-[hsl(var(--brand-forest))] leading-none">Model Arsenal</h3>
              <p className="text-[11px] text-muted-foreground mt-1">A cleaner roster of core and extended models. Always-on verification stays locked in.</p>
            </div>

            {[
              ["Core Models", coreIds],
              ["Extended Models (Free)", extendedIds],
            ].map(([label, ids]) => (
              <div key={label as string} className="mb-3 last:mb-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  {label as string}
                </div>
                <div className="space-y-2.5">
                  {(ids as ModelId[]).map((id) => {
                    const m = config[id];
                    return (
                      <div key={id} className="flex items-center gap-3">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: m.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium leading-none truncate">{m.name}</div>
                            {m.free && (
                              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[hsl(var(--bg-tertiary))] text-muted-foreground">
                                Free
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{m.role}</div>
                        </div>
                        {m.alwaysOn ? (
                          <span className="text-[10px] text-muted-foreground italic">Always on</span>
                        ) : (
                          <Switch checked={m.enabled} onCheckedChange={(v) => toggle(id, v)} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                onChange(DEFAULT_MODEL_CONFIG);
                saveModelConfig(DEFAULT_MODEL_CONFIG);
              }}
              className="mt-3 w-full text-[11px] text-muted-foreground hover:text-foreground transition"
            >
              Reset to defaults
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function useModelConfig() {
  const [config, setConfig] = useState<ModelConfig>(() => loadModelConfig());
  return [config, setConfig] as const;
}
