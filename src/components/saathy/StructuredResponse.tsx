import ReactMarkdown, { type Components } from "react-markdown";
import { parseAIResponse, isStructuredResponse } from "@/lib/parseAIResponse";
import { DEFAULT_MODEL_CONFIG } from "@/lib/modelConfig";
import { cn } from "@/lib/utils";
import { Section, ConfBadge } from "./dossier/Section";
import { LegalArsenal } from "./dossier/LegalArsenal";
import { StatArsenal } from "./dossier/StatArsenal";
import { PoliticalAccountability } from "./dossier/PoliticalAccountability";
import { InternationalEvidence } from "./dossier/InternationalEvidence";
import { Timeline } from "./dossier/Timeline";
import { ArgumentDelivery } from "./dossier/ArgumentDelivery";
import { PoiTraps, CounterStrategy } from "./dossier/PoiTraps";
import { PovAnalysis } from "./dossier/PovAnalysis";
import { SourcesPanel } from "./dossier/SourcesPanel";

// Custom markdown renderers — make every link clickable + open in new tab safely.
const MD_COMPONENTS: Components = {
  a: ({ node, ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-[hsl(var(--primary))] underline underline-offset-[3px] decoration-1 hover:brightness-125 break-words"
    />
  ),
};

const tierColor = (tier: string): string => {
  if (/T1/i.test(tier)) return "hsl(var(--tier-1))";
  if (/T2/i.test(tier)) return "hsl(var(--tier-2))";
  if (/T3/i.test(tier)) return "hsl(var(--tier-3))";
  if (/T4/i.test(tier)) return "hsl(var(--tier-4))";
  return "hsl(var(--muted-foreground))";
};

export const StructuredResponse = ({ content, isStreaming }: { content: string; isStreaming?: boolean }) => {
  if (!isStructuredResponse(content)) {
    return (
      <div className="saathy-prose text-[15px] text-foreground">
        <ReactMarkdown components={MD_COMPONENTS}>{content}</ReactMarkdown>
        {isStreaming && <span className="inline-block w-1.5 h-4 ml-0.5 bg-[hsl(var(--brand-forest))] align-middle animate-pulse" />}
      </div>
    );
  }

  const p = parseAIResponse(content);
  const keyInsight =
    p.argumentStructure?.claim ||
    p.atGlance[0]?.text ||
    p.accuracyReport?.strong[0] ||
    "";

  // Intelligence header — only show when we have meaningful metadata
  const hasIntelHeader = p.accuracyReport?.score !== undefined || p.sources.length > 0;

  return (
    <div className="space-y-4 text-[15px]">
      {hasIntelHeader && (
        <div className="flex flex-wrap items-center gap-2 -mt-1">
          {p.accuracyReport?.score !== undefined && (
            <IntelChip
              label="Confidence"
              value={`${p.accuracyReport.score}%`}
              color={
                p.accuracyReport.score >= 80
                  ? "hsl(var(--brand-sage))"
                  : p.accuracyReport.score >= 60
                  ? "hsl(var(--brand-gold))"
                  : "hsl(var(--brand-coral))"
              }
            />
          )}
          {p.sources.length > 0 && (
            <IntelChip label="Sources" value={String(p.sources.length)} color="hsl(var(--tier-2))" />
          )}
          {p.legalArsenal.length > 0 && (
            <IntelChip label="Legal" value={String(p.legalArsenal.length)} color="hsl(var(--brand-forest))" />
          )}
          {p.statArsenal.length > 0 && (
            <IntelChip label="Stats" value={String(p.statArsenal.length)} color="hsl(var(--tier-3))" />
          )}
        </div>
      )}

      {keyInsight && (
        <div className="rounded-2xl border border-[hsl(var(--brand-forest))/0.22] bg-[hsl(var(--bg-secondary))] px-4 py-3 shadow-soft">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--brand-forest))] mb-1">
            🧠 Key Insight
          </div>
          <p className="text-base sm:text-[17px] leading-snug font-medium text-foreground">
            {keyInsight}
          </p>
        </div>
      )}

      {p.atGlance.length > 0 && (
        <Section title="At a Glance" icon="🔥">
          <div className="grid gap-2">
            {p.atGlance.slice(0, 5).map((b, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-[hsl(var(--bg-secondary))] px-3 py-2.5 flex gap-2.5"
              >
                <span className="mt-1 h-2 w-2 rounded-full bg-[hsl(var(--brand-sage))] shrink-0" />
                <p className="leading-snug text-foreground/95">
                  {emphasizeText(b.text)}
                  {b.confidence && <ConfBadge c={b.confidence} />}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {p.argumentStructure && (
        <Section title="Argument Structure" icon="🧱">
          <div className="grid gap-2">
            {p.argumentStructure.claim && <Row label="CLAIM" icon="🔥" value={p.argumentStructure.claim} />}
            {p.argumentStructure.warrant && <Row label="WARRANT" icon="🧠" value={p.argumentStructure.warrant} />}
            {p.argumentStructure.evidence && <Row label="EVIDENCE" icon="📊" value={p.argumentStructure.evidence} />}
            {p.argumentStructure.impact && <Row label="IMPACT" icon="⚠️" value={p.argumentStructure.impact} />}
          </div>
        </Section>
      )}

      <LegalArsenal items={p.legalArsenal} />
      <StatArsenal items={p.statArsenal} />
      <Timeline items={p.timeline} />

      <InternationalEvidence items={p.international} />

      {p.argDelivery && <ArgumentDelivery data={p.argDelivery} />}

      {p.evidence.length > 0 && (
        <Section title="Evidence" icon="📂" collapsible defaultOpen={false}>
          <div className="space-y-2">
            {p.evidence.map((e, i) => (
              <div key={i} className="border border-border rounded-xl p-3 bg-card">
                <div className="flex items-start gap-2 mb-1">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      color: tierColor(e.tier),
                      backgroundColor: `color-mix(in srgb, ${tierColor(e.tier)} 15%, transparent)`,
                    }}
                  >
                    {e.tier}
                  </span>
                  <span className="text-sm font-medium leading-snug flex-1">
                    {emphasizeText(e.claim)}
                    {e.confidence && <ConfBadge c={e.confidence} />}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground leading-snug">
                  <em>{e.source}</em> · {e.type}
                  {e.desc && <> — {e.desc}</>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {p.perspectives && (
        <Section title="Perspectives" icon="🌍">
          <div className="space-y-1.5">
            {p.perspectives.pro && <Strip label="PRO" content={p.perspectives.pro} color="hsl(var(--brand-sage))" />}
            {p.perspectives.con && <Strip label="CON" content={p.perspectives.con} color="hsl(var(--brand-coral))" />}
            {p.perspectives.neutral && <Strip label="NEUTRAL" content={p.perspectives.neutral} color="hsl(var(--brand-gold))" />}
            {p.perspectives.bloc && <Strip label="BLOC" content={p.perspectives.bloc} color="hsl(258 60% 60%)" />}
          </div>
        </Section>
      )}

      {p.povAnalysis && <PovAnalysis data={p.povAnalysis} />}

      <PoliticalAccountability items={p.political} />
      <CounterStrategy items={p.counterStrategy} />
      <PoiTraps items={p.poiTraps} />

      {p.blindSpots.length > 0 && (
        <Section title="Blind Spots" icon="⚠️">
          <ul className="space-y-1.5">
            {p.blindSpots.map((b, i) => (
              <li key={i} className="pl-5 relative leading-relaxed text-foreground/90">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-[hsl(var(--brand-coral))]" />
                {b}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {p.nextQuestions.length > 0 && (
        <Section title="Next Questions" icon="→">
          <ul className="space-y-1.5">
            {p.nextQuestions.map((b, i) => (
              <li key={i} className="pl-5 relative leading-relaxed">
                <span className="absolute left-0 top-2 text-[hsl(var(--brand-forest))] text-xs">→</span>
                {b}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {p.modelContributions && (
        <Section title="What each model found" icon="🤖" collapsible defaultOpen={false}>
          <div className="grid sm:grid-cols-2 gap-2">
            {(["kimi", "glm", "qwen", "deepseek", "nemotron"] as const).map((id) => {
              const v = p.modelContributions?.[id];
              if (!v) return null;
              const meta = DEFAULT_MODEL_CONFIG[id];
              return (
                <div key={id} className="border border-border rounded-xl p-3 bg-card">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                    <span className="text-xs font-semibold">{meta.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{v}</p>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {p.accuracyReport && (
        <Section title="Accuracy Dashboard" icon="🎯">
          <div className="border border-border rounded-2xl p-5 bg-gradient-to-br from-card to-[hsl(var(--bg-secondary))] shadow-soft">
            <div className="flex items-center gap-5 mb-4">
              {(() => {
                const raw = p.accuracyReport.score;
                const score = typeof raw === "number" && Number.isFinite(raw)
                  ? Math.max(0, Math.min(100, Math.round(raw)))
                  : null;
                if (score === null) return null;
                const color =
                  score >= 80 ? "hsl(var(--brand-sage))" :
                  score >= 60 ? "hsl(var(--brand-gold))" :
                  "hsl(var(--brand-coral))";
                const band = score >= 80 ? "HIGH" : score >= 60 ? "MEDIUM" : "LOW";
                return (
                  <div className="relative shrink-0" title={`${band} confidence — ${score}/100`}>
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="16" fill="none" strokeWidth="3" strokeLinecap="round"
                        stroke={color}
                        strokeDasharray={`${(score / 100) * 100.5} 100.5`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center font-serif font-bold" style={{ color }}>
                      <span className="text-2xl leading-none">{score}</span>
                      <span className="text-[8px] tracking-wider mt-0.5">{band}</span>
                    </div>
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Confidence Score
                </div>
                <div className="text-sm text-foreground/85 leading-snug">
                  {p.accuracyReport.explanation || "Cross-checked across the model roster."}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--brand-sage))] mb-1.5">✓ Strong</div>
                <ul className="space-y-1">
                  {p.accuracyReport.strong.map((s, i) => (
                    <li key={`s${i}`} className="leading-snug text-foreground/85">{s}</li>
                  ))}
                  {p.accuracyReport.strong.length === 0 && <li className="text-muted-foreground italic">—</li>}
                </ul>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--brand-gold))] mb-1.5">⚠ Weak</div>
                <ul className="space-y-1">
                  {p.accuracyReport.weak.map((s, i) => (
                    <li key={`w${i}`} className="leading-snug text-foreground/85">{s}</li>
                  ))}
                  {p.accuracyReport.weak.length === 0 && <li className="text-muted-foreground italic">—</li>}
                </ul>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--brand-coral))] mb-1.5">⚡ Conflicts</div>
                <ul className="space-y-1">
                  {p.accuracyReport.conflicts.map((s, i) => (
                    <li key={`c${i}`} className="leading-snug text-foreground/85">{s}</li>
                  ))}
                  {p.accuracyReport.conflicts.length === 0 && <li className="text-muted-foreground italic">none</li>}
                </ul>
              </div>
            </div>
          </div>
        </Section>
      )}

      {isStreaming && (
        <span className="inline-block w-1.5 h-4 ml-0.5 bg-[hsl(var(--brand-forest))] align-middle animate-pulse" />
      )}

      {p.trailing && (
        <div className="saathy-prose text-sm text-muted-foreground border-t border-border pt-3">
          <ReactMarkdown components={MD_COMPONENTS}>{p.trailing}</ReactMarkdown>
        </div>
      )}

      <SourcesPanel sources={p.sources} />
    </div>
  );
};

const IntelChip = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
    style={{
      borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
      backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
    }}
  >
    <span className="text-muted-foreground uppercase tracking-wider text-[9px] font-bold">{label}</span>
    <span className="font-bold" style={{ color }}>{value}</span>
  </div>
);

const Row = ({ label, value, icon }: { label: string; value: string; icon?: string }) => (
  <div className="rounded-xl border border-border bg-[hsl(var(--bg-secondary))] p-3">
    <div className="text-[10px] font-bold text-[hsl(var(--brand-forest))] tracking-wider mb-1 flex items-center gap-1.5">
      {icon && <span>{icon}</span>}
      {label}
    </div>
    <div className="text-foreground/90 leading-snug">{emphasizeText(value)}</div>
  </div>
);

const Strip = ({ label, content, color }: { label: string; content: string; color: string }) => (
  <div
    className={cn("pl-3 py-2 pr-3 rounded-r-lg")}
    style={{ borderLeft: `3px solid ${color}`, background: `color-mix(in srgb, ${color} 6%, transparent)` }}
  >
    <span className="text-[10px] font-bold tracking-wider mr-2" style={{ color }}>
      {label}
    </span>
    <span className="text-sm text-foreground/90 leading-snug">{content}</span>
  </div>
);

function emphasizeText(text: string) {
  const parts = text.split(/(\b\d+(?:\.\d+)?%?|\b(?:19|20)\d{2}\b|T[1-4]\b|HIGH|MEDIUM|MED|LOW|RISING|FALLING|STABLE)/g);
  return (
    <>
      {parts.map((part, index) => {
        const isSignal = /^(\d+(?:\.\d+)?%?|(?:19|20)\d{2}|T[1-4]|HIGH|MEDIUM|MED|LOW|RISING|FALLING|STABLE)$/.test(part);
        if (!isSignal) return part;
        return (
          <strong key={index} className="font-semibold text-[hsl(var(--brand-forest))]">
            {part}
          </strong>
        );
      })}
    </>
  );
}
