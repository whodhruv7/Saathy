import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Link2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SourceItem } from "@/lib/parseAIResponse";

const reliabilityColor = (type: string): string => {
  const t = type.toLowerCase();
  if (/treaty|legal|government|peer|academic/.test(t)) return "hsl(var(--brand-sage))";
  if (/news|ngo|igo/.test(t)) return "hsl(var(--brand-gold))";
  if (/op-ed|blog|opinion/.test(t)) return "hsl(var(--brand-coral))";
  return "hsl(var(--muted-foreground))";
};

const reliabilityLabel = (type: string): string => {
  const t = type.toLowerCase();
  if (/treaty|legal|government|peer|academic/.test(t)) return "HIGH";
  if (/news|ngo|igo/.test(t)) return "MED";
  if (/op-ed|blog|opinion/.test(t)) return "LOW";
  return "MED";
};

export const SourcesPanel = ({ sources }: { sources: SourceItem[] }) => {
  const [open, setOpen] = useState(false);
  if (sources.length === 0) return null;
  return (
    <div className="mt-4 rounded-2xl border border-border bg-card/95 shadow-soft overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-[hsl(var(--bg-secondary))] hover:bg-[hsl(var(--bg-tertiary))] transition text-xs font-medium"
      >
        <span className="inline-flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5 text-[hsl(var(--brand-forest))]" />
          <span className="text-[hsl(var(--brand-forest))]">📚 Sources · {sources.length} used</span>
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-1.5">
              {sources.map((s, i) => {
                const color = reliabilityColor(s.type);
                const label = reliabilityLabel(s.type);
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-card border border-border text-xs hover:border-[hsl(var(--brand-sage))/0.5] transition"
                  >
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
                    >
                      {label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {s.url ? (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-[hsl(var(--brand-forest))] hover:underline truncate inline-flex items-center gap-1"
                          >
                            {s.source}
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="font-medium text-foreground truncate">{s.source}</span>
                        )}
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          · {s.type}
                        </span>
                      </div>
                      {s.relevance && (
                        <div className="text-muted-foreground text-[11px] leading-snug mt-0.5">
                          {s.relevance}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
