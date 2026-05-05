import { Section } from "./Section";
import type { TimelineItem } from "@/lib/parseAIResponse";

export const Timeline = ({ items }: { items: TimelineItem[] }) => {
  if (items.length === 0) return null;
  return (
    <Section title="Timeline" icon="🕰️">
      <ol className="relative pl-6 space-y-3 border-l-2 border-[hsl(var(--brand-sage))/0.4]">
        {items.map((t, i) => (
          <li key={i} className="relative">
            <span
              className="absolute -left-[1.85rem] top-1 w-3 h-3 rounded-full border-2 border-background"
              style={{ background: "hsl(var(--brand-forest))" }}
            />
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-serif text-lg font-bold text-[hsl(var(--brand-forest))] leading-none">
                {t.year}
              </span>
              <span className="font-medium text-foreground text-[14px]">{t.event}</span>
            </div>
            {t.significance && (
              <div className="text-xs text-muted-foreground italic mt-1 leading-snug">
                → {t.significance}
              </div>
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
};
