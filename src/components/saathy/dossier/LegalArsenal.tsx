import { useState } from "react";
import { ChevronDown, Scale } from "lucide-react";
import { Section } from "./Section";
import type { LegalItem } from "@/lib/parseAIResponse";
import { cn } from "@/lib/utils";

const attackColor = (v: string) => {
  const u = v.toUpperCase();
  if (u === "HIGH") return "hsl(var(--brand-coral))";
  if (u === "MED" || u === "MEDIUM") return "hsl(var(--brand-gold))";
  return "hsl(var(--muted-foreground))";
};

export const LegalArsenal = ({ items }: { items: LegalItem[] }) => {
  const [expanded, setExpanded] = useState<number | null>(null);
  if (items.length === 0) return null;
  return (
    <Section title="Legal Arsenal" icon="⚖️">
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="grid grid-cols-[1.4fr_2.5fr_0.5fr_0.6fr] text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-[hsl(var(--bg-secondary))] px-3 py-2 border-b border-border">
          <span>Provision</span>
          <span>Key Text</span>
          <span>Year</span>
          <span className="text-right">Attack</span>
        </div>
        {items.map((it, i) => {
          const isOpen = expanded === i;
          return (
            <div key={i} className="border-b border-border last:border-b-0">
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full grid grid-cols-[1.4fr_2.5fr_0.5fr_0.6fr] items-center px-3 py-2.5 text-sm text-left hover:bg-[hsl(var(--bg-secondary))] transition"
              >
                <span className="font-semibold text-[hsl(var(--brand-forest))] flex items-center gap-1.5">
                  <Scale className="w-3 h-3 shrink-0" />
                  <span className="truncate">{it.provision}</span>
                </span>
                <span className="text-foreground/85 truncate pr-3">{it.text}</span>
                <span className="text-muted-foreground text-xs">{it.year}</span>
                <div className="flex items-center justify-end gap-1.5">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{
                      color: attackColor(it.attack),
                      backgroundColor: `color-mix(in srgb, ${attackColor(it.attack)} 15%, transparent)`,
                    }}
                  >
                    {it.attack || "—"}
                  </span>
                  <ChevronDown
                    className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                  />
                </div>
              </button>
              {isOpen && it.use && (
                <div className="px-3 pb-3 text-xs bg-[hsl(var(--bg-secondary))] border-t border-border">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--brand-forest))] mb-1 mt-2">
                    How to deploy
                  </div>
                  <p className="text-foreground/85 leading-relaxed">{it.use}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
};
