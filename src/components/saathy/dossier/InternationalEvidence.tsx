import { Globe } from "lucide-react";
import { Section } from "./Section";
import type { CountryItem } from "@/lib/parseAIResponse";

export const InternationalEvidence = ({ items }: { items: CountryItem[] }) => {
  if (items.length === 0) return null;
  return (
    <Section title="International Evidence" icon="🌍">
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="grid grid-cols-[1fr_1.6fr_1.4fr_1.6fr] text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-[hsl(var(--bg-secondary))] px-3 py-2 border-b border-border">
          <span>Country</span>
          <span>Policy / Law</span>
          <span>Outcome</span>
          <span>Use as</span>
        </div>
        {items.map((c, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1.6fr_1.4fr_1.6fr] gap-2 px-3 py-2.5 text-[13px] border-b border-border last:border-b-0 items-start"
          >
            <span className="font-semibold text-[hsl(var(--brand-forest))] flex items-center gap-1.5">
              <Globe className="w-3 h-3 shrink-0" />
              {c.country}
            </span>
            <span className="text-foreground/85 leading-snug">{c.policy}</span>
            <span className="text-foreground/85 leading-snug">{c.outcome}</span>
            <span className="text-foreground/90 leading-snug italic">{c.useAs}</span>
          </div>
        ))}
      </div>
    </Section>
  );
};
