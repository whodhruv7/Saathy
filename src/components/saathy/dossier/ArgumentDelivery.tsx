import { Section } from "./Section";
import type { ArgDelivery } from "@/lib/parseAIResponse";

const Block = ({ label, color, children }: { label: string; color: string; children: React.ReactNode }) => (
  <div
    className="rounded-lg p-3 border-l-[3px]"
    style={{
      borderLeftColor: color,
      background: `color-mix(in srgb, ${color} 5%, transparent)`,
    }}
  >
    <div className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color }}>
      {label}
    </div>
    <div className="text-[14px] leading-relaxed text-foreground/90">{children}</div>
  </div>
);

export const ArgumentDelivery = ({ data }: { data: ArgDelivery }) => {
  return (
    <Section title="Speech-Ready Delivery" icon="🎤">
      <div className="space-y-2">
        {data.opening && <Block label="Opening hook (30s)" color="hsl(var(--brand-forest))">{data.opening}</Block>}
        {data.main.map((m, i) => (
          <Block key={i} label={`Main argument ${i + 1}`} color="hsl(var(--tier-2))">{m}</Block>
        ))}
        {data.emotion && <Block label="Emotional appeal" color="hsl(var(--brand-coral))">{data.emotion}</Block>}
        {data.closing && <Block label="Closing line" color="hsl(var(--brand-gold))">{data.closing}</Block>}
      </div>
    </Section>
  );
};
