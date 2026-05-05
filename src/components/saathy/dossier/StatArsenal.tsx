import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Section } from "./Section";
import type { StatItem } from "@/lib/parseAIResponse";

const trendIcon = (t: string) => {
  const u = t.toUpperCase();
  if (u === "RISING" || u === "IMPROVING") return { icon: TrendingUp, color: "hsl(var(--brand-sage))" };
  if (u === "FALLING" || u === "WORSENING") return { icon: TrendingDown, color: "hsl(var(--brand-coral))" };
  return { icon: Minus, color: "hsl(var(--muted-foreground))" };
};

export const StatArsenal = ({ items }: { items: StatItem[] }) => {
  if (items.length === 0) return null;
  return (
    <Section title="Statistical Arsenal" icon="📊">
      <div className="grid sm:grid-cols-2 gap-2.5">
        {items.map((s, i) => {
          const { icon: Icon, color } = trendIcon(s.trend);
          return (
            <div
              key={i}
              className="border border-border rounded-xl p-3.5 bg-card hover:shadow-soft transition"
            >
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <span
                  className="font-serif text-3xl font-bold leading-none"
                  style={{ color: "hsl(var(--brand-forest))" }}
                >
                  {s.number}
                </span>
                {s.trend && (
                  <span
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color }}
                  >
                    <Icon className="w-3 h-3" />
                    {s.trend}
                  </span>
                )}
              </div>
              <div className="text-sm font-medium text-foreground/90 leading-snug mb-1">{s.what}</div>
              <div className="text-[11px] text-muted-foreground italic mb-2">{s.source}</div>
              {s.deploy && (
                <div className="text-xs pt-2 border-t border-border">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--brand-forest))] mr-1.5">
                    Use as
                  </span>
                  <span className="text-foreground/85">{s.deploy}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
};
