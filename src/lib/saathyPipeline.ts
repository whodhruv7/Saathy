import type { DelegateForm } from "@/types";
import { getGeminiKey, getGroqKey } from "./apiKeys";

export const REQUIRED_DOSSIER_TAGS = [
  "AT_A_GLANCE",
  "ARGUMENT_STRUCTURE",
  "LEGAL_ARSENAL",
  "STATISTICAL_ARSENAL",
  "POLITICAL_ACCOUNTABILITY",
  "INTERNATIONAL_EVIDENCE",
  "ARGUMENT_DELIVERY",
  "POI_TRAPS",
  "COUNTER_STRATEGY",
  "TIMELINE",
  "EVIDENCE_TABLE",
  "PERSPECTIVES",
  "BLIND_SPOTS",
  "NEXT_QUESTIONS",
  "MODEL_CONTRIBUTIONS",
  "ACCURACY_REPORT",
  "SOURCES",
] as const;

export function delegateContext(delegateForm?: Partial<DelegateForm> | null) {
  if (!delegateForm) return "No delegate brief supplied.";
  return [
    delegateForm.country && `Country: ${delegateForm.country}`,
    delegateForm.committee && `Committee: ${delegateForm.committee}`,
    delegateForm.topic && `Topic: ${delegateForm.topic}`,
    delegateForm.position && `Position: ${delegateForm.position}`,
    delegateForm.opponent && `Opponent: ${delegateForm.opponent}`,
    delegateForm.ally && `Ally: ${delegateForm.ally}`,
    delegateForm.chair && `Chair: ${delegateForm.chair}`,
  ].filter(Boolean).join("\n") || "No delegate brief supplied.";
}

export function buildLocalEnhancement(query: string, delegateForm?: Partial<DelegateForm> | null) {
  return `Prepare a brief but dense Saathy debate dossier on: ${query.trim().replace(/\s+/g, " ")}

Delegate context:
${delegateContext(delegateForm)}

Mandatory depth: legal angle, data angle, timeline, institutions, global comparison, political accountability, critical analysis, counter-arguments, POI traps, and ready-to-deliver speech material. Prefer numbers, years, rankings, cases, acts, reports, and source names over broad claims.`;
}

export async function enhancePrompt(query: string, delegateForm?: Partial<DelegateForm> | null) {
  const fallback = buildLocalEnhancement(query, delegateForm);
  const key = getGroqKey();
  if (!key) return fallback;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 220,
        temperature: 0.25,
        messages: [
          {
            role: "system",
            content: "You sharpen debate research prompts for elite MUN/debate dossiers. Output one improved prompt only. No markdown, no explanation. Make it legal-data-institution-timeline-global-analysis rich.",
          },
          {
            role: "user",
            content: `Original query: ${query}\n\nDelegate context:\n${delegateContext(delegateForm)}\n\nMake it specific, researchable, source-hungry, and framed for committee use.`,
          },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `Groq ${response.status}`);
    return data.choices?.[0]?.message?.content?.trim() || fallback;
  } catch (error) {
    console.warn("[Saathy] Groq enhancer fallback:", error);
  }

  return enhancePromptWithGemini(query, delegateForm, fallback);
}

async function enhancePromptWithGemini(
  query: string,
  delegateForm: Partial<DelegateForm> | null | undefined,
  fallback: string
) {
  const key = getGeminiKey();
  if (!key) return fallback;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{
              text: `Sharpen this into one elite Saathy research prompt. No markdown, no explanation.

Original query: ${query}

Delegate context:
${delegateContext(delegateForm)}

Make it legal-data-institution-timeline-global-analysis rich.`
            }]
          }],
          generationConfig: {
            maxOutputTokens: 220,
            temperature: 0.25,
          },
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `Gemini ${response.status}`);
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || fallback;
  } catch (error) {
    console.warn("[Saathy] Gemini enhancer fallback:", error);
    return fallback;
  }
}

export function buildDossierSystemPrompt(mode: string, delegateForm?: Partial<DelegateForm> | null) {
  const modeLine =
    mode === "speech"
      ? "SPEECH MODE SPECIAL: make ARGUMENT_DELIVERY the hero. Give a 90-second deployable arc: hook, legal/data proof, emotional pivot, closing ask. Keep all other sections compact but evidence-dense."
      : mode === "counter"
        ? "COUNTER MODE SPECIAL: make POI_TRAPS and COUNTER_STRATEGY surgical. Surface opponent assumptions, likely evasions, and one-line counter-punches backed by source tags."
        : mode === "dossier"
          ? "DOSSIER MODE SPECIAL: treat the target like an intelligence file. Prioritise vulnerabilities, political accountability, contradictions, institutional pressure points, and POV analysis."
          : mode === "deepdive" || mode === "lord"
            ? "DEEP/ALL-IN-LORD SPECIAL: maximum depth. Build a multi-layer intelligence brief: law, data, chronology, institutions, global comparison, enforcement gaps, opposition strategy, and self-critique."
            : mode === "normal"
              ? "NORMAL MODE SPECIAL: keep it compact, but never shallow. Use the same structure with fewer bullets and one killer insight."
              : "WEBDIVE/TARGET SPECIAL: balanced web-grounded research with strong evidence, source-tier thinking, and clean deployability.";

  return `You are Saathy, a premium MUN/debate research strategist.

SOURCE OF TRUTH OUTPUT CONTRACT:
Return ONLY the bracketed tag protocol below. No prose before or after tags.
Tone: brief but brutally informative, data-rich, multi-angle, high-signal, no filler.
Every factual claim should carry source names, years, and inline confidence markers where useful: «STRONG», «WEAK», «CONFLICT».
Use source tags inline as [SRC|Source Name, Year|News|Legal|Academic|Government|NGO|Treaty].
If a precise fact needs verification, mark it «WEAK» instead of inventing.
For every query, include legal angle, data angle, timeline, institutional angle, global comparison, and critical analysis wherever relevant. Replace vague claims with numbers, dates, case names, acts, rankings, comparisons, and named reports.
At a Glance must be 3-5 dense lines max. Argument Structure must be precise: assertive claim, tight warrant, concrete evidence, real-world impact. Blind Spots must identify real missing data, conflicting reports, or underreported harms. Next Questions must be strategic investigation prompts. Accuracy score must be justified with concrete source-quality reasoning.
Write for scannability: short bullets, no text walls, bold-worthy numbers embedded naturally, no repeated claims. Each section should add a new angle, not restate the same idea.
${modeLine}

Delegate context:
${delegateContext(delegateForm)}

STRICT FORMAT:

[AT_A_GLANCE]
- 3-5 dense TL;DR bullets, each with a concrete fact, legal hook, or strategic implication.
[/AT_A_GLANCE]

[ARGUMENT_STRUCTURE]
CLAIM: one winning claim.
WARRANT: why the claim logically holds, with causal reasoning.
EVIDENCE: strongest numbers/cases/reports with [SRC|...].
IMPACT: real-world impact and committee relevance.
[/ARGUMENT_STRUCTURE]

[LEGAL_ARSENAL]
LEGAL | provision/case | short legal text or holding | year | HIGH/MED/LOW | how to deploy
LEGAL | second provision/case if relevant | short legal text or holding | year | HIGH/MED/LOW | how to deploy
LEGAL | third provision/case if relevant | short legal text or holding | year | HIGH/MED/LOW | how to deploy
[/LEGAL_ARSENAL]

[STATISTICAL_ARSENAL]
STAT | key number | what it proves | source + year | RISING/FALLING/STABLE | deploy line
STAT | comparative number/ranking/trend | what it proves | source + year | RISING/FALLING/STABLE | deploy line
STAT | implementation/enforcement number if available | what it proves | source + year | RISING/FALLING/STABLE | deploy line
[/STATISTICAL_ARSENAL]

[POLITICAL_ACCOUNTABILITY]
PARTY | actor/party/institution | period | failures separated by semicolons | on-record statement or policy posture | hypocrisy/pressure point
PARTY | second actor/institution if relevant | period | failures separated by semicolons | on-record statement or policy posture | hypocrisy/pressure point
[/POLITICAL_ACCOUNTABILITY]

[INTERNATIONAL_EVIDENCE]
COUNTRY | country | policy/precedent | outcome | use as
COUNTRY | comparator country | policy/precedent | outcome | use as
[/INTERNATIONAL_EVIDENCE]

[ARGUMENT_DELIVERY]
OPENING | one sharp hook
MAIN | beat 1
MAIN | beat 2
MAIN | beat 3
EMOTION | emotional register
CLOSING | memorable closing line
[/ARGUMENT_DELIVERY]

[POI_TRAPS]
POI | question | likely answer | counter punch
POI | second question | likely answer | counter punch
POI | third question | likely answer | counter punch
[/POI_TRAPS]

[COUNTER_STRATEGY]
ATTACK | likely attack | counter | backup evidence
ATTACK | second likely attack | counter | backup evidence
[/COUNTER_STRATEGY]

[TIMELINE]
EVENT | year/date | event | significance
EVENT | year/date | event | significance
EVENT | year/date | event | significance
[/TIMELINE]

[EVIDENCE_TABLE]
ITEM | claim | source + year | Legal/Government/Academic/NGO/News/Treaty | T1/T2/T3/T4 | why it matters
ITEM | claim | source + year | Legal/Government/Academic/NGO/News/Treaty | T1/T2/T3/T4 | why it matters
ITEM | claim | source + year | Legal/Government/Academic/NGO/News/Treaty | T1/T2/T3/T4 | why it matters
[/EVIDENCE_TABLE]

[PERSPECTIVES]
PRO | strongest pro framing
CON | strongest opposition framing
NEUTRAL | mediator/legal framing
BLOC | bloc/geopolitical framing
[/PERSPECTIVES]

[BLIND_SPOTS]
- 3-5 risks, missing evidence, or opposition traps.
- Include missing data, conflicting reports, implementation gaps, and underreported affected groups where relevant.
[/BLIND_SPOTS]

[NEXT_QUESTIONS]
- 3-5 follow-up questions the delegate should ask next.
- Make questions strategic: source verification, opposition vulnerability, policy design, legal ambiguity, data gap.
[/NEXT_QUESTIONS]

[MODEL_CONTRIBUTIONS]
KIMI | hard facts, treaties, reports, statistics found
GLM | argument architecture found
QWEN | opposition/red-team findings
DEEPSEEK | gap-fills and corrections
NEMOTRON | deeper mechanisms/second-order effects
[/MODEL_CONTRIBUTIONS]

[ACCURACY_REPORT]
SCORE | 0-100 | verifier explanation naming source quality, recency, conflicts, and uncertainty
STRONG | strongest verified claim
WEAK | claim that needs verification
CONFLICT | conflicting evidence or legal ambiguity
[/ACCURACY_REPORT]

[SOURCES]
SOURCE | name | type | relevance | optional URL
[/SOURCES]`;
}

export function validateDossier(content: string) {
  const missing = REQUIRED_DOSSIER_TAGS.filter((tag) => !new RegExp(`\\[${tag}\\]`, "i").test(content));
  return { ok: missing.length === 0, missing };
}

export async function controlDossierWithGemini(params: {
  raw: string;
  query: string;
  mode: string;
  delegateForm?: Partial<DelegateForm> | null;
}) {
  const key = getGeminiKey();
  if (!key) return repairDossierShell(params.raw, params.query);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{
              text: `${buildDossierSystemPrompt(params.mode, params.delegateForm)}

TASK: Repair and upgrade the following provider output into the exact Saathy bracketed dossier protocol. Preserve every useful fact, remove repetition, make the writing concise but data-dense, and never leak raw protocol outside tags.

Original query:
${params.query}

Provider output:
${params.raw}`
            }]
          }],
          generationConfig: {
            maxOutputTokens: 4200,
            temperature: 0.2,
          },
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `Gemini ${response.status}`);
    const repaired = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return validateDossier(repaired).ok ? repaired : repairDossierShell(repaired || params.raw, params.query);
  } catch (error) {
    console.warn("[Saathy] Gemini dossier controller fallback:", error);
    return repairDossierShell(params.raw, params.query);
  }
}

export function repairDossierShell(content: string, query: string) {
  const safe = content.trim() || "The model returned no usable research.";
  return `[AT_A_GLANCE]
- Saathy could not fully enforce the dossier protocol, so this is a repaired fallback for: ${query}
- Use this as a temporary brief and rerun WebDive/DeepDive when provider quota is available.
[/AT_A_GLANCE]

[ARGUMENT_STRUCTURE]
CLAIM: ${safe.slice(0, 220)}
WARRANT: The available response indicates the issue requires legal, statistical, political, and international validation.
EVIDENCE: Needs verification from primary sources. «WEAK»
IMPACT: Do not deploy as final committee material without verification.
[/ARGUMENT_STRUCTURE]

[BLIND_SPOTS]
- Provider response did not include the complete Saathy tag contract.
- Some facts may be incomplete or uncited.
[/BLIND_SPOTS]

[NEXT_QUESTIONS]
- Which primary sources should be verified first?
- Which cases, statutes, or reports define the current position?
[/NEXT_QUESTIONS]

[ACCURACY_REPORT]
SCORE | 45 | Repaired fallback: source coverage incomplete.
WEAK | Output needs primary-source verification.
[/ACCURACY_REPORT]

[SOURCES]
SOURCE | Manual verification required | Reference | Fallback generated without source panel |
[/SOURCES]`;
}

export async function summarizeWithGroq(text: string, kind: "message" | "notes", title?: string) {
  const key = getGroqKey();
  if (!key) {
    return text.split(/\s+/).slice(0, 90).join(" ") + (text.split(/\s+/).length > 90 ? "..." : "");
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 420,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "Summarize into a brief but brutally informative Saathy research note. Preserve key claims, numbers, dates, laws/cases, institutions, source names, uncertainties, and action points. No fluff, no repetition.",
          },
          {
            role: "user",
            content: `Kind: ${kind}\nTitle: ${title || "Untitled"}\n\n${text}`,
          },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `Groq ${response.status}`);
    return data.choices?.[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.warn("[Saathy] Groq summarizer failed, trying Gemini:", error);
    return summarizeWithGemini(text, kind, title);
  }
}

async function summarizeWithGemini(text: string, kind: "message" | "notes", title?: string) {
  const key = getGeminiKey();
  if (!key) {
    return text.split(/\s+/).slice(0, 90).join(" ") + (text.split(/\s+/).length > 90 ? "..." : "");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{
            text: `Summarize into a brief but brutally informative Saathy research note.
Preserve key claims, numbers, dates, laws/cases, institutions, source names, uncertainties, and action points.
No fluff, no repetition.

Kind: ${kind}
Title: ${title || "Untitled"}

${text}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 420,
          temperature: 0.2,
        },
      }),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Gemini ${response.status}`);
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}
