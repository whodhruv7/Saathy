import { Section } from "./Section";
import type { PoiItem, AttackItem } from "@/lib/parseAIResponse";

export const PoiTraps = ({ items }: { items: PoiItem[] }) => {
  if (items.length === 0) return null;
  return (
    <Section title="POI Trap Chains" icon="🎯" collapsible defaultOpen={false}>
      <div className="space-y-2.5">
        {items.map((p, i) => (
          <div key={i} className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="grid grid-cols-[auto_1fr] gap-2 px-3 py-2 bg-[hsl(var(--brand-forest))/0.06] items-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--brand-forest))] px-1.5 py-0.5 rounded bg-[hsl(var(--brand-forest))/0.1]">
                Q{i + 1}
              </span>
              <span className="text-[14px] font-medium text-[hsl(var(--brand-forest))] leading-snug">
                {p.question}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-px bg-border">
              <div className="bg-card p-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--brand-gold))] mb-1">
                  ↩ They'll likely say
                </div>
                <div className="text-[13px] text-foreground/85 leading-snug italic">{p.theySay}</div>
              </div>
              <div className="bg-card p-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--brand-coral))] mb-1">
                  ⚡ Your counter
                </div>
                <div className="text-[13px] text-foreground/90 leading-snug font-medium">{p.counter}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

export const CounterStrategy = ({ items }: { items: AttackItem[] }) => {
  if (items.length === 0) return null;
  return (
    <Section title="Counter Strategy" icon="⚔️" collapsible defaultOpen={false}>
      <div className="space-y-2">
        {items.map((a, i) => (
          <div key={i} className="border border-border rounded-xl p-3 bg-card">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--brand-coral))] px-1.5 py-0.5 rounded bg-[hsl(var(--brand-coral))/0.1] shrink-0">
                Attack
              </span>
              <span className="text-[13px] text-foreground/90 leading-snug">{a.attack}</span>
            </div>
            <div className="flex items-start gap-2 mb-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--brand-sage))] px-1.5 py-0.5 rounded bg-[hsl(var(--brand-sage))/0.1] shrink-0">
                Counter
              </span>
              <span className="text-[13px] text-foreground/90 leading-snug font-medium">{a.counter}</span>
            </div>
            {a.backup && (
              <div className="flex items-start gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--tier-2))] px-1.5 py-0.5 rounded bg-[hsl(var(--tier-2))/0.1] shrink-0">
                  Backup
                </span>
                <span className="text-[12px] text-muted-foreground italic leading-snug">{a.backup}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
};
