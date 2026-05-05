import { useState } from "react";
import { ChevronDown, Flag } from "lucide-react";
import { Section } from "./Section";
import type { PartyItem } from "@/lib/parseAIResponse";
import { cn } from "@/lib/utils";

export const PoliticalAccountability = ({ items }: { items: PartyItem[] }) => {
  const [open, setOpen] = useState<number | null>(0);
  if (items.length === 0) return null;
  return (
    <Section title="Political Accountability" icon="🏛️">
      <div className="space-y-2">
        {items.map((p, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="border border-border rounded-xl overflow-hidden bg-card">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[hsl(var(--bg-secondary))] transition"
              >
                <span className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-[hsl(var(--brand-coral))]" />
                  <span className="font-semibold text-[hsl(var(--brand-forest))]">{p.party}</span>
                  {p.period && (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.period}</span>
                  )}
                </span>
                <ChevronDown
                  className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 space-y-3 text-sm border-t border-border bg-[hsl(var(--bg-secondary))/0.5]">
                  {p.failures.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--brand-coral))] mb-1.5">
                        Documented failures
                      </div>
                      <ul className="space-y-1">
                        {p.failures.map((f, j) => (
                          <li key={j} className="pl-4 relative leading-snug text-foreground/90">
                            <span className="absolute left-0 top-2 w-1 h-1 rounded-full bg-[hsl(var(--brand-coral))]" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {p.statement && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Key statement
                      </div>
                      <blockquote
                        className="border-l-2 pl-3 italic text-foreground/85 text-[13px]"
                        style={{ borderColor: "hsl(var(--brand-gold))" }}
                      >
                        "{p.statement}"
                      </blockquote>
                    </div>
                  )}
                  {p.hypocrisy && (
                    <div className="bg-[hsl(var(--brand-coral))/0.08] rounded-lg p-2.5 border border-[hsl(var(--brand-coral))/0.2]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--brand-coral))] mb-1">
                        Hypocrisy angle
                      </div>
                      <div className="text-foreground/90 text-[13px] leading-snug">{p.hypocrisy}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
};
