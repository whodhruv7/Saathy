// Parser for Saathy V5 structured response tags.
// Handles legacy tags (AT_A_GLANCE, ARGUMENT_STRUCTURE, EVIDENCE_TABLE, PERSPECTIVES,
// BLIND_SPOTS, NEXT_QUESTIONS, SOURCES, MODEL_CONTRIBUTIONS, ACCURACY_REPORT)
// and new V5 dossier tags (LEGAL_ARSENAL, STATISTICAL_ARSENAL, POLITICAL_ACCOUNTABILITY,
// INTERNATIONAL_EVIDENCE, TIMELINE, ARGUMENT_DELIVERY, POI_TRAPS, COUNTER_STRATEGY, POV_ANALYSIS).

export type Confidence = "STRONG" | "WEAK" | "CONFLICT";
export type AttackValue = "HIGH" | "MEDIUM" | "MED" | "LOW";
export type StatTrend = "RISING" | "FALLING" | "STABLE" | "WORSENING" | "IMPROVING";

export interface EvidenceItem {
  claim: string;
  source: string;
  type: string;
  tier: string;
  desc: string;
  confidence?: Confidence;
}

export interface SourceItem {
  source: string;
  type: string;
  relevance: string;
  url?: string;
}

export interface LegalItem { provision: string; text: string; year: string; attack: string; use: string; }
export interface StatItem { number: string; what: string; source: string; trend: string; deploy: string; }
export interface PartyItem { party: string; period: string; failures: string[]; statement: string; hypocrisy: string; }
export interface CountryItem { country: string; policy: string; outcome: string; useAs: string; }
export interface TimelineItem { year: string; event: string; significance: string; }
export interface PoiItem { question: string; theySay: string; counter: string; }
export interface AttackItem { attack: string; counter: string; backup: string; }
export interface ArgDelivery { opening?: string; main: string[]; emotion?: string; closing?: string; }
export interface PovAnalysis {
  target: string;
  known: string[];
  strategy: string;
  vulnerabilities: string[];
  traps: string[];
}

export interface ParsedResponse {
  atGlance: { text: string; confidence?: Confidence }[];
  argumentStructure:
    | { claim?: string; warrant?: string; evidence?: string; impact?: string; confidence?: Confidence }
    | null;
  evidence: EvidenceItem[];
  perspectives: { pro?: string; con?: string; neutral?: string; bloc?: string } | null;
  blindSpots: string[];
  nextQuestions: string[];
  sources: SourceItem[];
  modelContributions: { kimi?: string; glm?: string; qwen?: string; deepseek?: string; nemotron?: string } | null;
  accuracyReport: {
    score?: number;
    explanation?: string;
    strong: string[];
    weak: string[];
    conflicts: string[];
  } | null;
  // V5 dossier
  legalArsenal: LegalItem[];
  statArsenal: StatItem[];
  political: PartyItem[];
  international: CountryItem[];
  timeline: TimelineItem[];
  argDelivery: ArgDelivery | null;
  poiTraps: PoiItem[];
  counterStrategy: AttackItem[];
  povAnalysis: PovAnalysis | null;
  trailing: string;
}

const KNOWN_TAGS = [
  "AT_A_GLANCE", "ARGUMENT_STRUCTURE", "EVIDENCE_TABLE", "PERSPECTIVES", "BLIND_SPOTS",
  "NEXT_QUESTIONS", "SOURCES", "MODEL_CONTRIBUTIONS", "ACCURACY_REPORT",
  "LEGAL_ARSENAL", "STATISTICAL_ARSENAL", "POLITICAL_ACCOUNTABILITY", "INTERNATIONAL_EVIDENCE",
  "TIMELINE", "ARGUMENT_DELIVERY", "POI_TRAPS", "COUNTER_STRATEGY", "POV_ANALYSIS",
] as const;

function normalizeResponse(src: string): string {
  let out = src;
  for (const t of KNOWN_TAGS) {
    out = out.replace(new RegExp(`\\s*(\\[/?${t}\\])\\s*`, "gi"), "\n$1\n");
  }

  // Models often put rows on one line. Split known row/key prefixes into parser-friendly lines.
  out = out
    .replace(/\s+(CLAIM|WARRANT|EVIDENCE|IMPACT):\s*/g, "\n$1: ")
    .replace(/\s+(LEGAL|STAT|PARTY|COUNTRY|OPENING|MAIN|EMOTION|CLOSING|POI|ATTACK|EVENT|ITEM|SOURCE|SCORE|STRONG|WEAK|CONFLICT|KIMI|GLM|QWEN|DEEPSEEK|NEMOTRON)\s*\|/g, "\n$1 |")
    .replace(/\s+(PRO|CON|NEUTRAL|BLOC)\s*\|/g, "\n$1 |")
    .replace(/\n{3,}/g, "\n\n");

  return out.trim();
}

const tag = (name: string, src: string): string | null => {
  const normalized = normalizeResponse(src);
  const re = new RegExp(`\\[${name}\\]([\\s\\S]*?)\\[\\/${name}\\]`, "i");
  const m = normalized.match(re);
  if (m) return m[1].trim();

  // Tolerate provider output that opens tags but forgets closing tags.
  const open = new RegExp(`\\[${name}\\]`, "i").exec(normalized);
  if (!open) return null;
  const start = open.index + open[0].length;
  const rest = normalized.slice(start);
  const next = rest.search(new RegExp(`\\[/?(?:${KNOWN_TAGS.filter((t) => t !== name).join("|")})\\]`, "i"));
  return (next === -1 ? rest : rest.slice(0, next)).trim() || null;
};

// Strip inline badge token «STRONG» / «WEAK» / «CONFLICT» (also tolerates [STRONG] variants)
const BADGE_RE = /\s*[«[]\s*(STRONG|WEAK|CONFLICT)\s*[»\]]\s*/i;
function extractBadge(line: string): { text: string; confidence?: Confidence } {
  const m = line.match(BADGE_RE);
  if (!m) return { text: line };
  return { text: line.replace(BADGE_RE, " ").trim(), confidence: m[1].toUpperCase() as Confidence };
}

const bullets = (block: string | null): { text: string; confidence?: Confidence }[] => {
  if (!block) return [];
  return block
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
    .map(extractBadge);
};

const plainBullets = (block: string | null): string[] => bullets(block).map((b) => b.text);

const kvLines = (block: string | null): Record<string, string> => {
  if (!block) return {};
  const out: Record<string, string> = {};
  block.split("\n").forEach((l) => {
    const m = l.match(/^([A-Z_]+):\s*(.+)$/);
    if (m) out[m[1].toLowerCase()] = m[2].trim();
  });
  return out;
};

const pipeRows = (block: string | null, prefix: string): string[][] => {
  if (!block) return [];
  return block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => new RegExp(`^${prefix}\\s*\\|`, "i").test(l))
    .map((l) => l.split("|").slice(1).map((p) => p.trim()));
};

export function parseAIResponse(raw: string): ParsedResponse {
  const normalizedRaw = normalizeResponse(raw);
  const atGlance = bullets(tag("AT_A_GLANCE", normalizedRaw));

  const argBlock = tag("ARGUMENT_STRUCTURE", normalizedRaw);
  const argKv = kvLines(argBlock);
  let argumentStructure: ParsedResponse["argumentStructure"] = null;
  if (argBlock) {
    let conf: Confidence | undefined;
    const strip = (v?: string) => {
      if (!v) return v;
      const e = extractBadge(v);
      if (e.confidence && !conf) conf = e.confidence;
      return e.text;
    };
    argumentStructure = {
      claim: strip(argKv.claim),
      warrant: strip(argKv.warrant),
      evidence: strip(argKv.evidence),
      impact: strip(argKv.impact),
      confidence: conf,
    };
  }

  const evidenceBlock = tag("EVIDENCE_TABLE", normalizedRaw);
  const evidence: EvidenceItem[] = [];
  if (evidenceBlock) {
    for (const rawLine of evidenceBlock.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("[") || line.startsWith("//")) continue;
      if (!line.includes("|")) continue;
      const cleaned = line.replace(/^ITEM\s*[|:]\s*/i, "").replace(/^[-•*]\s*/, "");
      const parts = cleaned.split("|").map((p) => p.trim());
      if (parts.length < 2 || !parts[0]) continue;
      const claimWithBadge = extractBadge(parts[0]);
      evidence.push({
        claim: claimWithBadge.text,
        source: parts[1] || "Unknown",
        type: parts[2] || "Research",
        tier: parts[3] || "T2",
        desc: parts[4] || "",
        confidence: claimWithBadge.confidence,
      });
    }
  }

  const perspBlock = tag("PERSPECTIVES", normalizedRaw);
  let persp: ParsedResponse["perspectives"] = null;
  if (perspBlock) {
    const getPersp = (prefix: string) => {
      const m = perspBlock.match(new RegExp(`^\\s*${prefix}\\s*[|:\\-]\\s*(.+)$`, "im"));
      return m?.[1] ? extractBadge(m[1]).text : undefined;
    };
    const pro = getPersp("PRO");
    const con = getPersp("CON");
    const neutral = getPersp("NEUTRAL");
    const bloc = getPersp("BLOC");
    if (pro || con || neutral || bloc) persp = { pro, con, neutral, bloc };
  }

  const blindSpots = plainBullets(tag("BLIND_SPOTS", normalizedRaw));
  const nextQuestions = plainBullets(tag("NEXT_QUESTIONS", normalizedRaw));

  // SOURCES — supports optional URL as 4th column
  const sourcesBlock = tag("SOURCES", normalizedRaw);
  const sources: SourceItem[] = [];
  if (sourcesBlock) {
    const seen = new Set<string>();
    for (const rawLine of sourcesBlock.split("\n")) {
      const line = rawLine.trim();
      if (!line || !line.includes("|")) continue;
      const cleaned = line.replace(/^SOURCE\s*[|:]\s*/i, "").replace(/^[-•*]\s*/, "");
      const parts = cleaned.split("|").map((p) => p.trim());
      if (!parts[0]) continue;
      const key = parts[0].toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      // url may be in parts[2] or parts[3]
      let url: string | undefined;
      for (let i = 1; i < parts.length; i++) {
        if (/^https?:\/\//i.test(parts[i])) { url = parts[i]; break; }
      }
      sources.push({
        source: parts[0],
        type: parts[1] || "Reference",
        relevance: parts[2] && !/^https?:\/\//i.test(parts[2]) ? parts[2] : (parts[3] || ""),
        url,
      });
    }
  }

  const mcBlock = tag("MODEL_CONTRIBUTIONS", normalizedRaw);
  const modelContributions = mcBlock
    ? {
        kimi: pipeRows(mcBlock, "KIMI")[0]?.[0],
        glm: pipeRows(mcBlock, "GLM")[0]?.[0],
        qwen: pipeRows(mcBlock, "QWEN")[0]?.[0],
        deepseek: pipeRows(mcBlock, "DEEPSEEK")[0]?.[0],
        nemotron: pipeRows(mcBlock, "NEMOTRON")[0]?.[0],
      }
    : null;

  const accBlock = tag("ACCURACY_REPORT", normalizedRaw);
  let accuracyReport: ParsedResponse["accuracyReport"] = null;
  if (accBlock) {
    const scoreRow = pipeRows(accBlock, "SCORE")[0];
    let score: number | undefined;
    if (scoreRow?.[0]) {
      const m = scoreRow[0].match(/(\d{1,3})/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n) && n >= 0 && n <= 100) score = n;
      }
    }
    accuracyReport = {
      score,
      explanation: scoreRow?.[1],
      strong: pipeRows(accBlock, "STRONG").map((r) => r[0]).filter(Boolean),
      weak: pipeRows(accBlock, "WEAK").map((r) => r[0]).filter(Boolean),
      conflicts: pipeRows(accBlock, "CONFLICT").map((r) => r[0]).filter(Boolean),
    };
  }

  // ─────── V5 dossier sections ───────
  const legalArsenal: LegalItem[] = pipeRows(tag("LEGAL_ARSENAL", normalizedRaw), "LEGAL").map((p) => ({
    provision: p[0] || "", text: p[1] || "", year: p[2] || "", attack: (p[3] || "").toUpperCase(), use: p[4] || "",
  })).filter((x) => x.provision);

  const statArsenal: StatItem[] = pipeRows(tag("STATISTICAL_ARSENAL", normalizedRaw), "STAT").map((p) => ({
    number: p[0] || "", what: p[1] || "", source: p[2] || "", trend: (p[3] || "").toUpperCase(), deploy: p[4] || "",
  })).filter((x) => x.number);

  const political: PartyItem[] = pipeRows(tag("POLITICAL_ACCOUNTABILITY", normalizedRaw), "PARTY").map((p) => ({
    party: p[0] || "",
    period: p[1] || "",
    failures: (p[2] || "").split(/;|\u2022/).map((s) => s.trim()).filter(Boolean),
    statement: p[3] || "",
    hypocrisy: p[4] || "",
  })).filter((x) => x.party);

  const international: CountryItem[] = pipeRows(tag("INTERNATIONAL_EVIDENCE", normalizedRaw), "COUNTRY").map((p) => ({
    country: p[0] || "", policy: p[1] || "", outcome: p[2] || "", useAs: p[3] || "",
  })).filter((x) => x.country);

  const timeline: TimelineItem[] = pipeRows(tag("TIMELINE", normalizedRaw), "EVENT").map((p) => ({
    year: p[0] || "", event: p[1] || "", significance: p[2] || "",
  })).filter((x) => x.year || x.event);

  const argDeliveryBlock = tag("ARGUMENT_DELIVERY", normalizedRaw);
  let argDelivery: ArgDelivery | null = null;
  if (argDeliveryBlock) {
    const opening = pipeRows(argDeliveryBlock, "OPENING")[0]?.[0];
    const main = pipeRows(argDeliveryBlock, "MAIN").map((r) => r[0]).filter(Boolean);
    const emotion = pipeRows(argDeliveryBlock, "EMOTION")[0]?.[0];
    const closing = pipeRows(argDeliveryBlock, "CLOSING")[0]?.[0];
    if (opening || main.length || emotion || closing) {
      argDelivery = { opening, main, emotion, closing };
    }
  }

  const poiTraps: PoiItem[] = pipeRows(tag("POI_TRAPS", normalizedRaw), "POI").map((p) => ({
    question: p[0] || "", theySay: p[1] || "", counter: p[2] || "",
  })).filter((x) => x.question);

  const counterStrategy: AttackItem[] = pipeRows(tag("COUNTER_STRATEGY", normalizedRaw), "ATTACK").map((p) => ({
    attack: p[0] || "", counter: p[1] || "", backup: p[2] || "",
  })).filter((x) => x.attack);

  const povBlock = tag("POV_ANALYSIS", normalizedRaw);
  let povAnalysis: PovAnalysis | null = null;
  if (povBlock) {
    const target = pipeRows(povBlock, "TARGET")[0]?.[0] || "";
    const known = pipeRows(povBlock, "KNOWN").map((r) => r[0]).filter(Boolean);
    const strategy = pipeRows(povBlock, "STRATEGY")[0]?.[0] || "";
    const vulnerabilities = pipeRows(povBlock, "VULNERABILITY").map((r) => r[0]).filter(Boolean);
    const traps = pipeRows(povBlock, "TRAP").map((r) => r[0]).filter(Boolean);
    if (target || known.length || strategy || vulnerabilities.length || traps.length) {
      povAnalysis = { target, known, strategy, vulnerabilities, traps };
    }
  }

  // Build trailing — strip ALL known tags
  let trailing = normalizedRaw;
  KNOWN_TAGS.forEach((t) => {
    trailing = trailing.replace(new RegExp(`\\[${t}\\][\\s\\S]*?\\[\\/${t}\\]`, "gi"), "");
    trailing = trailing.replace(new RegExp(`\\[/?${t}\\]`, "gi"), "");
  });
  trailing = trailing.trim();

  const parsedSomething =
    atGlance.length > 0 || argumentStructure || evidence.length > 0 || legalArsenal.length > 0 ||
    statArsenal.length > 0 || political.length > 0 || international.length > 0 || timeline.length > 0 ||
    argDelivery || poiTraps.length > 0 || counterStrategy.length > 0 || persp || blindSpots.length > 0 ||
    nextQuestions.length > 0 || modelContributions || accuracyReport || sources.length > 0;

  // If the provider forgot closing tags, the raw tag bodies may remain in trailing.
  // Hide that duplicate protocol spill once we successfully parsed useful sections.
  if (parsedSomething && /\b(CLAIM|LEGAL|STAT|PARTY|COUNTRY|POI|ATTACK|EVENT|ITEM|SOURCE|SCORE)\s*[|:]/i.test(trailing)) {
    trailing = "";
  }

  return {
    atGlance, argumentStructure, evidence, perspectives: persp, blindSpots, nextQuestions,
    sources, modelContributions, accuracyReport,
    legalArsenal, statArsenal, political, international, timeline,
    argDelivery, poiTraps, counterStrategy, povAnalysis,
    trailing,
  };
}

export function isStructuredResponse(raw: string): boolean {
  return /\[(?:AT_A_GLANCE|ARGUMENT_STRUCTURE|EVIDENCE_TABLE|PERSPECTIVES|LEGAL_ARSENAL|STATISTICAL_ARSENAL|POLITICAL_ACCOUNTABILITY|TIMELINE|POI_TRAPS|COUNTER_STRATEGY|POV_ANALYSIS|INTERNATIONAL_EVIDENCE|ARGUMENT_DELIVERY)\]/i.test(raw);
}
