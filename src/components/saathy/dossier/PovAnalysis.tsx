import { Eye } from "lucide-react";
import { Section } from "./Section";
import type { PovAnalysis as PovAnalysisType } from "@/lib/parseAIResponse";

export const PovAnalysis = ({ data }: { data: PovAnalysisType }) => {
  return (
    <Section title="POV Analysis" icon="👁">
      <div className="border-2 border-[hsl(258_60%_60%)/0.3] rounded-2xl p-4 bg-gradient-to-br from-[hsl(258_60%_60%)/0.06] to-transparent">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[hsl(258_60%_60%)/0.2]">
          <Eye className="w-4 h-4 text-[hsl(258_60%_60%)]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(258_60%_60%)]">
            Target
          </span>
          <span className="font-serif text-lg text-[hsl(var(--brand-forest))]">{data.target}</span>
        </div>

        {data.known.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Known positions
            </div>
            <ul className="space-y-1">
              {data.known.map((k, i) => (
                <li key={i} className="text-[13px] text-foreground/90 pl-4 relative leading-snug">
                  <span className="absolute left-0 top-2 w-1 h-1 rounded-full bg-[hsl(258_60%_60%)]" />
                  {k}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.strategy && (
          <div className="mb-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--brand-gold))] mb-1">
              Likely strategy
            </div>
            <div className="text-[13px] text-foreground/90 leading-snug">{data.strategy}</div>
          </div>
        )}

        {data.vulnerabilities.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--brand-coral))] mb-1.5">
              Vulnerabilities
            </div>
            <ul className="space-y-1">
              {data.vulnerabilities.map((v, i) => (
                <li key={i} className="text-[13px] text-foreground/90 pl-4 relative leading-snug">
                  <span className="absolute left-0 top-2 text-[hsl(var(--brand-coral))]">⚡</span>
                  {v}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.traps.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--brand-forest))] mb-1.5">
              Trap questions designed for them
            </div>
            <ol className="space-y-1.5">
              {data.traps.map((t, i) => (
                <li
                  key={i}
                  className="text-[13px] text-foreground/90 pl-6 relative leading-snug font-medium"
                >
                  <span className="absolute left-0 top-0 text-[10px] font-bold text-[hsl(258_60%_60%)] bg-[hsl(258_60%_60%)/0.1] px-1.5 py-0.5 rounded">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </Section>
  );
};
