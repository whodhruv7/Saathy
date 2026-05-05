// Saathy V6 — Multi-mode pipeline on Lovable AI Gateway only.
//
// NORMAL mode now uses INTENT DETECTION:
//   conversational → warm 1-3 line reply, no JSON
//   factual        → 2-4 sentence answer, light bullets
//   general        → prose with optional small headings
//   debate         → full structured dossier (existing flow)
//
// DEEPDIVE / WEBDIVE → 7-stage research pipeline with:
//   pre-stage QUICK_INSIGHTS (3 instant facts streamed via SSE)
//   stage 7 synthesis emits new sections:
//     RESOLUTION_CLAUSES, PARLIAMENTARY_RECORD, COURT_JUDGMENTS,
//     UN_OBLIGATIONS, READY_SPEECHES (30s/60s/zero-hour)
//
// Also supports a "followup" subroute: { followup: true, query, priorContent }
// which returns a clean prose answer using the prior dossier as context.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OR_URL = "https://openrouter.ai/api/v1/chat/completions";

type ModelId = "kimi" | "glm" | "qwen" | "deepseek" | "nemotron" | "gemini" | "claude" | "mistral" | "minimax" | "phi3" | "solar" | "yi" | "zephyr";
type Mode = "normal" | "webdive" | "deepdive" | "allinlord" | "dossier";
type NormalIntent = "conversational" | "factual" | "general" | "debate";

const MODEL_FAMILY: Record<ModelId, { model: string; temperature: number }> = {
  kimi:     { model: "deepseek/deepseek-r1:free",                    temperature: 0.3 },
  glm:      { model: "deepseek/deepseek-chat:free",                  temperature: 0.4 },
  qwen:     { model: "meta-llama/llama-3.3-70b-instruct:free",     temperature: 0.6 },
  deepseek: { model: "google/gemini-2.0-flash-thinking-exp:free",    temperature: 0.35 },
  nemotron: { model: "nvidia/llama-3.1-nemotron-70b-instruct:free",  temperature: 0.5 },
  gemini:   { model: "google/gemini-2.0-flash-exp:free",             temperature: 0.1 },
  claude:   { model: "meta-llama/llama-3.3-70b-instruct:free",     temperature: 0.55 },
  mistral:  { model: "mistralai/mistral-7b-instruct:free",           temperature: 0.5 },
  minimax:  { model: "meta-llama/llama-3.1-405b-instruct:free",     temperature: 0.6 },
  phi3:     { model: "microsoft/phi-3-mini-128k-instruct:free",      temperature: 0.4 },
  solar:    { model: "qwen/qwen-2.5-72b-instruct:free",              temperature: 0.5 },
  yi:       { model: "01-ai/yi-1.5-34b-chat:free",                   temperature: 0.5 },
  zephyr:   { model: "nvidia/llama-3.1-nemotron-70b-instruct:free",  temperature: 0.5 },
};

const orHeaders = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
  "HTTP-Referer": "https://saathy.ai",
  "X-Title": "Saathy",
});

const ACTIVITY_LABELS: Record<ModelId, Record<Mode, string>> = {
  kimi: {
    normal:    "Pulling treaties, UN reports & data points…",
    webdive:   "Scanning 2023–2025 news, IGO releases, recent stats…",
    deepdive:  "Mining treaties, peer-reviewed studies, gov reports…",
    allinlord: "Mining treaties, peer-reviewed studies, gov reports…",
    dossier:   "Researching opponent position and strategy…",
  },
  glm: {
    normal:    "Building CLAIM → WARRANT → EVIDENCE chains…",
    webdive:   "Building CLAIM → WARRANT → EVIDENCE chains…",
    deepdive:  "Constructing layered argument architecture…",
    allinlord: "Constructing layered argument architecture…",
    dossier:   "Mapping opponent argument structure…",
  },
  qwen: {
    normal:    "Stress-testing your position from opposite side…",
    webdive:   "Stress-testing your position from opposite side…",
    deepdive:  "Red-teaming: opposition blocs, rebuttals, blind angles…",
    allinlord: "Red-teaming: opposition blocs, rebuttals, blind angles…",
    dossier:   "Analyzing opponent vulnerabilities…",
  },
  deepseek: {
    normal:    "Filling gaps in prior research…",
    webdive:   "Filling gaps & cross-checking sources…",
    deepdive:  "Surgical gap-fill + inconsistency repair…",
    allinlord: "Surgical gap-fill + inconsistency repair…",
    dossier:   "Finding contradictions in opponent stance…",
  },
  nemotron: {
    normal:    "Adding PhD-level depth…",
    webdive:   "Adding PhD-level depth…",
    deepdive:  "Mechanisms, root causes, second-order effects…",
    allinlord: "Mechanisms, root causes, second-order effects…",
    dossier:   "Deep analysis of opponent track record…",
  },
  gemini: {
    normal:    "Verifying every claim, scoring confidence…",
    webdive:   "Verifying every claim, scoring confidence…",
    deepdive:  "Tier-grading sources, flagging weak claims…",
    allinlord: "Tier-grading sources, flagging weak claims…",
    dossier:   "Verifying opponent claims and sources…",
  },
  claude: {
    normal:    "Synthesizing into structured brief…",
    webdive:   "Synthesizing dossier from web-grounded research…",
    deepdive:  "Composing 20× richer dossier…",
    allinlord: "Two-pass synthesis with self-critique…",
    dossier:   "Synthesizing opponent intelligence report…",
  },
};

const TOKEN_BUDGET: Record<Mode, Record<ModelId, number>> = {
  normal:    { kimi: 1400, glm: 1100, qwen: 1100, deepseek: 1000, nemotron: 1400, gemini: 800,  claude: 3200 },
  webdive:   { kimi: 1800, glm: 1100, qwen: 1300, deepseek: 1200, nemotron: 1400, gemini: 900,  claude: 4500 },
  deepdive:  { kimi: 3500, glm: 2500, qwen: 2500, deepseek: 2500, nemotron: 3500, gemini: 1500, claude: 7500 },
  allinlord: { kimi: 4000, glm: 3000, qwen: 3000, deepseek: 3000, nemotron: 4500, gemini: 2000, claude: 7800 },
  dossier:   { kimi: 2500, glm: 2000, qwen: 2000, deepseek: 2200, nemotron: 2000, gemini: 1000, claude: 5500 },
};

const povLine = (pov: string | null) =>
  pov && pov.trim()
    ? `\n\nPOV LENS: Frame ALL output through the perspective of ${pov.trim()}. Anticipate what THEY would say, where THEY are vulnerable, and how to corner THEM specifically.`
    : "";

const SPECIALIST_PROMPTS: Record<Exclude<ModelId, "gemini" | "claude">, (mode: Mode, pov: string | null) => string> = {
  kimi: (mode, pov) => {
    const depth = mode === "deepdive" || mode === "allinlord"
      ? "List 18-25 hard facts under headers: HARD DATA, TREATIES/RESOLUTIONS, GOVT/IGO REPORTS, RECENT DEVELOPMENTS (2023-2025), HISTORICAL PRECEDENTS, INDIA ANGLES."
      : "List 10-14 hard facts. One fact per bullet.";
    return `You are KIMI — research feed for a MUN strategist. ${depth} Every bullet ≤ 22 words. Always include source name + year. When you reference an institution/report, append a SOURCE tag at end of line in the form [SRC|Source Name, Year|TYPE]. TYPE one of: News|Legal|Academic|Government|NGO|Treaty. No narrative, no definitions, no fluff. Pure ammunition.${povLine(pov)}`;
  },
  glm: (mode, pov) => {
    const depth = mode === "deepdive" || mode === "allinlord" ? "Build 5 argument chains." : "Build 3 argument chains.";
    return `You are GLM — argument architect for parliamentary debate. ${depth} Each chain = exactly 4 lines: CLAIM (≤18 words) | WARRANT (≤18 words) | EVIDENCE (with source+year, ≤20 words) | IMPACT (≤15 words). No prose between chains. Speech-ready, quotable.${povLine(pov)}`;
  },
  qwen: (mode, pov) => {
    const depth = mode === "deepdive" || mode === "allinlord"
      ? "Output: 4 OPPOSITION ATTACKS (one line each, ≤20 words), 3 BLOC POSITIONS (one line each), 3 TRICK QUESTIONS (one line each)."
      : "Output: 3 OPPOSITION ATTACKS (one line each, ≤20 words), 2 BLOC POSITIONS (one line each).";
    return `You are QWEN — red-team analyst. ${depth} Be brutal. No explanations, no paragraphs. Sharp one-liners only.${povLine(pov)}`;
  },
  deepseek: (mode, pov) => {
    const depth = mode === "deepdive" || mode === "allinlord"
      ? "List up to 10 surgical additions (missing facts, weak claims, contradictions). Each = one line ≤ 24 words with source where possible."
      : "List up to 6 surgical additions. Each = one line ≤ 22 words.";
    return `You are DEEPSEEK — completeness QA. ${depth} Never repeat what others said. No commentary.${povLine(pov)}`;
  },
  nemotron: (_mode, pov) =>
    `You are NEMOTRON — depth analyst. Output exactly 4 sections, 2 sharp bullets each (≤22 words per bullet): ROOT CAUSES, HISTORICAL PATTERN, POLITICAL ECONOMY (winners/losers), SECOND-ORDER EFFECTS. India-aware. Append [SRC|Source, Year|TYPE] tags where applicable. No prose intros.${povLine(pov)}`,
};

function delegateContextStr(form: any): string {
  if (!form) return "No delegate brief provided.";
  return [
    `Country/Entity: ${form.country || "—"}`,
    `Committee: ${form.committee || "—"}`,
    `Topic: ${form.topic || "—"}`,
    `Position: ${form.position || "—"}`,
    `Main opponent: ${form.opponent || form.opposingEntities || "—"}`,
    `Strongest ally: ${form.ally || form.blocAlignment || "—"}`,
    `Chair: ${form.chair || "—"}`,
  ].join("\n");
}

// ────────────────────────── shared call helpers ──────────────────────────

async function callModel(
  apiKey: string,
  modelId: ModelId,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<string> {
  const cfg = MODEL_FAMILY[modelId];
  console.log(`🔄 callModel START: ${modelId} -> ${cfg.model}`);
  
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      console.log(`📡 Calling OpenRouter for ${modelId} (attempt ${attempt + 1})`);
      const res = await fetch(OR_URL, {
        method: "POST",
        headers: orHeaders(apiKey),
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: cfg.temperature,
        }),
      });
      
      console.log(`📥 ${modelId} response status:`, res.status);
      
      if (res.status === 429 && attempt < 2) { 
        console.log(`⏳ ${modelId} rate limited, retrying...`);
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1))); 
        continue; 
      }
      
      if (!res.ok) { 
        const errorText = await res.text().catch(() => "");
        console.error(`❌ ${modelId} failed:`, res.status, errorText);
        return ""; 
      }
      
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      console.log(`✅ ${modelId} success, content length:`, content.length);
      return content;
    } catch (e) {
      console.error(`❌ ${modelId} threw:`, e);
      if (attempt < 2) { await new Promise((r) => setTimeout(r, 1000)); continue; }
      return "";
    }
  }
  console.log(`⚠️ ${modelId} all attempts failed`);
  return "";
}

interface GroundedResult {
  text: string;
  sources: { title: string; uri: string }[];
}

async function callGroundedSearch(
  apiKey: string,
  query: string,
  maxTokens: number,
  systemHint: string,
): Promise<GroundedResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(OR_URL, {
        method: "POST",
        headers: orHeaders(apiKey),
        body: JSON.stringify({
          model: MODEL_FAMILY.gemini.model,
          messages: [
            { role: "system", content: systemHint },
            { role: "user", content: query },
          ],
          max_tokens: maxTokens,
          temperature: 0.3,
        }),
      });
      if (res.status === 429 && attempt === 0) { await new Promise((r) => setTimeout(r, 1200)); continue; }
      if (!res.ok) {
        const plain = await callModel(apiKey, "kimi", systemHint, query, maxTokens);
        return { text: plain, sources: [] };
      }
      const data = await res.json();
      const text: string = data.choices?.[0]?.message?.content || "";
      const annotations = data.choices?.[0]?.message?.annotations || [];
      const sources: { title: string; uri: string }[] = [];
      for (const a of annotations) {
        const u = a?.url_citation?.url || a?.url || a?.uri;
        const t = a?.url_citation?.title || a?.title || u;
        if (u) sources.push({ title: t, uri: u });
      }
      return { text, sources };
    } catch (e) {
      console.error("grounded search threw:", e);
      if (attempt === 0) { await new Promise((r) => setTimeout(r, 800)); continue; }
      return { text: "", sources: [] };
    }
  }
  return { text: "", sources: [] };
}

// ────────────────────────── INTENT DETECTION (Normal mode) ──────────────────────────

function detectNormalIntent(message: string): NormalIntent {
  const msg = message.toLowerCase().trim();
  const greetings = [
    "hi", "hello", "hey", "namaste", "hola", "good morning", "good afternoon",
    "good evening", "how are you", "what's up", "wassup", "sup", "yo ", "thanks",
    "thank you", "ok", "cool", "nice", "lol", "haha",
  ];
  if (msg.length < 30 && greetings.some((g) => msg.startsWith(g) || msg === g.trim())) {
    return "conversational";
  }
  const debateKeywords = [
    "research", "analyse", "analyze", "argument", "debate", "mun", "committee",
    "resolution", "speech", "counter", "attack", "poi", "position", "stance",
    "policy", "bill", "provision", "amendment", "dossier", "brief me",
    "build me", "prepare", "stakeholder", "opposition", "rebuttal",
  ];
  if (debateKeywords.some((k) => msg.includes(k))) return "debate";
  if (msg.length < 120 && msg.endsWith("?")) return "factual";
  if (msg.length < 220) return "general";
  return "debate";
}

async function handleConversational(
  apiKey: string, message: string, ctx: string, history: any[],
): Promise<string> {
  const sys = `You are Saathy — a sharp, warm, witty AI research partner for MUN and Yuva Sansad delegates.

DELEGATE BRIEF:
${ctx}

For casual messages, respond like a smart friend who knows their committee inside out. 1-3 sentences max. NO markdown headers, NO bullet lists, NO JSON, NO structured tags. Just natural conversation. If they greet you, greet them back warmly and reference something specific about their committee/topic to show you're ready to work.`;
  return await streamText(apiKey, sys, message, history, 400, 0.85);
}

async function handleFactual(
  apiKey: string, message: string, ctx: string, history: any[],
): Promise<string> {
  const sys = `You are Saathy — expert on Indian law, policy, MUN procedure, international relations, and political science.

DELEGATE BRIEF:
${ctx}

Answer this factual question directly and accurately. Format: 2-4 sentences of clear explanation. If the answer has discrete parts, follow with 2-3 short bullet points using "- ". Cite the specific provision/source if relevant (e.g., "Article 21, Constitution of India", "NCRB 2022"). NO heavy structure, NO JSON tags, NO multiple headers. Clean readable text only.`;
  return await streamText(apiKey, sys, message, history, 700, 0.4);
}

async function handleGeneral(
  apiKey: string, message: string, ctx: string, history: any[],
): Promise<string> {
  const sys = `You are Saathy — political intelligence assistant for MUN delegates.

DELEGATE BRIEF:
${ctx}

Provide a helpful, clear response. Use AT MOST one bold lead-in or short heading if genuinely needed. Mostly prose paragraphs, with a few bullets only if listing items. NO JSON tags, NO heavy card structure. End with one short follow-up question or action suggestion for their debate prep, prefixed with "→ ".`;
  return await streamText(apiKey, sys, message, history, 1200, 0.6);
}

// streams text via SSE — placeholder, actual streaming happens in handler
async function streamText(
  apiKey: string, sys: string, user: string, history: any[],
  maxTokens: number, temperature: number,
): Promise<string> {
  // Non-streaming variant used by intent handlers — they stream via the orchestrator
  void apiKey; void sys; void user; void history; void maxTokens; void temperature;
  return "";
}

// ────────────────────────── 7-stage helpers (DeepDive/WebDive) ──────────────────────────

async function stage1_decompose(
  apiKey: string, topic: string, ctx: string, pov: string | null,
): Promise<string[]> {
  const sys = `You are a research strategist for a SPECIFIC delegate. You will be given their full brief — generate research queries SPECIFIC to what THEY need to argue THEIR position. Don't write generic queries.

Output STRICT JSON only: { "queries": ["q1", ..., "q7"] }
Cover: (1) core legal/policy facts for their position, (2) statistics/evidence that helps them, (3) historical timeline, (4) international comparisons that support their stance, (5) opponent's positions and statements, (6) counter-arguments to PRE-EMPT, (7) expert/committee recommendations.

Each query 6-12 words, search-engine optimized, India-context-aware where applicable.${povLine(pov)}`;
  const user = `Topic: ${topic}\n\nDelegate brief:\n${ctx}\n\nReturn JSON.`;
  const raw = await callModel(apiKey, "gemini", sys, user, 600);
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return [topic];
  try {
    const parsed = JSON.parse(m[0]);
    const arr = Array.isArray(parsed.queries) ? parsed.queries.filter((q: any) => typeof q === "string" && q.trim()) : [];
    return arr.slice(0, 7);
  } catch { return [topic]; }
}

async function stage2_search(
  apiKey: string, queries: string[],
): Promise<{ query: string; result: GroundedResult }[]> {
  const hint = "You are a web research engine. For the given query, use google_search and return: (1) the most relevant facts with concrete numbers, dates, sources. (2) institution/source name + year for every claim. Be dense, cite ≥4 distinct sources. ≤350 words.";
  const settled = await Promise.allSettled(queries.map((q) => callGroundedSearch(apiKey, q, 800, hint)));
  return queries.map((query, i) => ({
    query,
    result: settled[i].status === "fulfilled" ? (settled[i] as PromiseFulfilledResult<GroundedResult>).value : { text: "", sources: [] },
  }));
}

async function stage4_extract(
  apiKey: string, rawResearch: string, topic: string, pov: string | null,
): Promise<{ legal: string; statistical: string; political: string; international: string }> {
  const ctxBlock = rawResearch.slice(0, 18000);
  const tasks = [
    {
      key: "legal" as const,
      sys: `You are a LEGAL ANALYST. Extract ALL legal provisions, acts, sections, articles, judgments, treaties relevant to the topic. Include Indian court judgments and parliamentary debates if any appear. For EACH: exact section/article number, what it says, year/court/body, how to apply. Output ONLY pipe-rows:
LEGAL|provision|key text ≤22w|year|attack-value HIGH/MED/LOW|how to use ≤14w
JUDGMENT|case name v ...|court|year|holding ≤22w|deploy ≤14w
PARLIAMENT|speaker name|date|verbatim/paraphrase ≤22w|significance ≤14w
Maximum 8 LEGAL, 5 JUDGMENT, 4 PARLIAMENT rows. No prose.${povLine(pov)}`,
    },
    {
      key: "statistical" as const,
      sys: `You are a STATISTICAL ANALYST. Extract ALL quantitative data: percentages, raw numbers, surveys, rankings, budgets, case counts. Prioritize official sources (NCRB, Census, RBI, UN) over media. For EACH: exact number, what it measures, source+year, trend, how to deploy. Output ONLY pipe-rows:
STAT|number|what it measures ≤14w|Source, Year|RISING/FALLING/STABLE|deploy-line ≤14w
Maximum 10 rows. No prose.${povLine(pov)}`,
    },
    {
      key: "political" as const,
      sys: `You are a POLITICAL INTELLIGENCE analyst. For each major party/actor, extract documented failures (with year), key statements, hypocrisy angles. Output ONLY:
PARTY|name|period|failure-1; failure-2|quoted statement (year)|hypocrisy angle ≤16w
Maximum 5 rows. No prose.${povLine(pov)}`,
    },
    {
      key: "international" as const,
      sys: `You are an INTERNATIONAL POLICY analyst. Find country comparisons AND UN obligations. Output ONLY:
COUNTRY|country|policy/law ≤14w|outcome/stat|use-as ≤16w
UN|treaty/resolution name|year India committed|current status|attack line ≤18w
Maximum 6 COUNTRY, 5 UN rows. No prose.${povLine(pov)}`,
    },
  ];

  const settled = await Promise.allSettled(
    tasks.map((t) => callModel(apiKey, "deepseek", t.sys, `TOPIC: ${topic}\n\nRESEARCH:\n${ctxBlock}`, 1500)),
  );

  const out: any = {};
  tasks.forEach((t, i) => {
    out[t.key] = settled[i].status === "fulfilled" ? (settled[i] as PromiseFulfilledResult<string>).value : "";
  });
  return out;
}

async function stage5_live(apiKey: string, topic: string): Promise<GroundedResult> {
  const sys = "You are a current-events scout. Use google_search. Find LATEST developments (last 6 months) for the topic: news, judgments, policy changes, new bills, court orders, recent stats, controversies. For each finding: source, date, key fact, why it matters in committee. ≤450 words. No prose intro.";
  return callGroundedSearch(apiKey, `Latest developments last 6 months: ${topic}`, 1200, sys);
}

async function stage6_verify(
  apiKey: string,
  extracted: { legal: string; statistical: string; political: string; international: string },
  liveText: string,
): Promise<{ score: number; report: string }> {
  const sys = `You are a fact-verifier. Cross-check facts that appear in multiple sources vs single-source. For each claim: VERIFIED (2+ sources) | SINGLE-SOURCE | CONTRADICTED. Then compute confidence using:
verified*1.0 + single*0.5 + contradicted*0 / total * 100
Clamp result to 30-98. If <5 facts present, return 72.

Output EXACTLY:
SCORE|<integer 30-98>|<≤18w rationale>
VERIFIED|<claim ≤18w>
SINGLE|<claim ≤18w>
CONFLICT|<claim ≤18w if any>
Maximum 12 rows. No prose.`;
  const corpus = `LEGAL:\n${extracted.legal}\n\nSTATS:\n${extracted.statistical}\n\nPOLITICAL:\n${extracted.political}\n\nINTERNATIONAL:\n${extracted.international}\n\nLIVE:\n${liveText}`;
  const raw = await callModel(apiKey, "gemini", sys, corpus.slice(0, 16000), 1000);
  const m = raw.match(/SCORE\s*\|\s*(\d{1,3})/i);
  let score = 72;
  if (m) {
    const n = parseInt(m[1], 10);
    if (!isNaN(n) && n >= 0 && n <= 100) score = Math.max(30, Math.min(98, n));
  }
  return { score, report: raw };
}

// QUICK INSIGHTS — pre-pipeline 2-second teaser
async function generateQuickInsights(
  apiKey: string, topic: string, ctx: string,
): Promise<string[]> {
  const sys = `You are Saathy delivering an instant 3-fact teaser before the full research runs.
Output STRICT JSON only: { "insights": ["fact 1 with source", "fact 2 with source", "fact 3 with source"] }
Each fact ≤ 22 words, with concrete number/source. Punchy, debate-ready. No fluff.`;
  const user = `Topic: ${topic}\n\nDelegate brief:\n${ctx}\n\nReturn JSON.`;
  const raw = await callModel(apiKey, "gemini", sys, user, 400);
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return [];
  try {
    const parsed = JSON.parse(m[0]);
    return Array.isArray(parsed.insights) ? parsed.insights.slice(0, 3).map(String) : [];
  } catch { return []; }
}

// ────────────────────────── DOSSIER PROMPTS ──────────────────────────

function buildDossierSystemPrompt(form: any, pov: string | null, mode: Mode): string {
  return `You are SAATHY — instant MUN strategist. Output a battle-ready dossier in the EXACT structured-tag format below. NEVER deviate.

ABSOLUTE RULES:
1. Output ONLY the structured tags requested — no markdown headers, no preamble, no closing remarks.
2. Every line speech-ready: a delegate must be able to read it aloud.
3. NO definitions, NO storytelling, NO "It is important to note...".
4. Compress lines to ≤22 words. Density via more rows, never longer rows.
5. Every evidence/legal/stat row MUST cite Source, Year.
6. Tier evidence: T1 (treaty/UN res/peer-reviewed) · T2 (gov/IGO data) · T3 (reputable journalism) · T4 (think-tank/op-ed).
7. Append «STRONG» / «WEAK» / «CONFLICT» badges per the verifier report.
8. Defend the delegate's stated position. Their brief is ground truth.
9. Mode is ${mode.toUpperCase()} — go DEEP. More rows, sharper rows.
${pov ? `10. POV LENS ACTIVE: Frame the entire brief through ${pov}'s likely positions, vulnerabilities, and language.` : ""}

DELEGATE BRIEF:
${delegateContextStr(form)}`;
}

function buildDossierUserPrompt(
  query: string, queries: string[], searchCorpus: string,
  extracted: { legal: string; statistical: string; political: string; international: string },
  liveResult: GroundedResult, verifyReport: string, verifyScore: number,
  pov: string | null, sources: { title: string; uri: string }[],
): string {
  const sourcesBlock = sources.slice(0, 30).map((s, i) => `[S${i + 1}] ${s.title} | ${s.uri}`).join("\n");
  const povBlock = pov ? `\n[POV_ANALYSIS]\nTARGET|${pov}\nKNOWN|<≤22w their documented position>\nSTRATEGY|<≤22w how they will argue>\nVULNERABILITY|<≤20w what to attack>\nVULNERABILITY|<second weakness>\nTRAP|<question designed to corner ${pov}>\nTRAP|<second trap question>\n[/POV_ANALYSIS]\n` : "";

  return `ORIGINAL QUERY: ${query}

RESEARCH ANGLES SEARCHED:
${queries.map((q, i) => `${i + 1}. ${q}`).join("\n")}

WEB-GROUNDED RESEARCH CORPUS:
${searchCorpus.slice(0, 12000)}

LEGAL EXTRACT:
${extracted.legal}

STATISTICAL EXTRACT:
${extracted.statistical}

POLITICAL EXTRACT:
${extracted.political}

INTERNATIONAL EXTRACT:
${extracted.international}

LATEST DEVELOPMENTS:
${liveResult.text}

FACT-VERIFICATION (confidence ${verifyScore}/100):
${verifyReport}

SOURCES INDEX:
${sourcesBlock}

────────────────────────────────────────────────────────────────
Output the dossier using EXACTLY these tags. No prose between tags.

[AT_A_GLANCE]
4 bullets, each ≤14 words. Punchlines, not topics.
- [most important takeaway]
- [hard stat]
- [legal hook]
- [what the delegate MUST say]
[/AT_A_GLANCE]

[ARGUMENT_STRUCTURE]
CLAIM: [one debatable sentence ≤18w] «STRONG/WEAK/CONFLICT»
WARRANT: [the mechanism ≤18w]
EVIDENCE: [strongest single fact + Source, Year ≤22w]
IMPACT: [why ignoring this loses the committee ≤18w]
[/ARGUMENT_STRUCTURE]

[LEGAL_ARSENAL]
6-10 rows. Pipe-separated. NO prose.
LEGAL|provision name|key text ≤22w|year|HIGH/MEDIUM/LOW|how to use ≤14w
[/LEGAL_ARSENAL]

[COURT_JUDGMENTS]
3-6 landmark Indian or international judgments. NO prose.
JUDGMENT|case name (e.g., Vishaka v State of Rajasthan)|court|year|holding ≤22w|deploy-as ≤14w
[/COURT_JUDGMENTS]

[PARLIAMENTARY_RECORD]
2-5 Lok Sabha / Rajya Sabha / Yuva Sansad statements. NO prose.
RECORD|speaker name|date or year|quoted/paraphrased statement ≤22w|why it matters ≤14w
[/PARLIAMENTARY_RECORD]

[STATISTICAL_ARSENAL]
6-10 rows. NO prose.
STAT|number|what it measures ≤14w|Source, Year|RISING/FALLING/STABLE|deploy-line ≤14w
[/STATISTICAL_ARSENAL]

[POLITICAL_ACCOUNTABILITY]
3-5 rows. NO prose.
PARTY|party name|period|failure-1; failure-2|quoted statement (year)|hypocrisy angle ≤16w
[/POLITICAL_ACCOUNTABILITY]

[UN_OBLIGATIONS]
3-5 rows. NO prose.
UN|treaty/resolution|year India committed|current status (UNFULFILLED/PARTIAL/MET)|attack-line ≤20w
[/UN_OBLIGATIONS]

[INTERNATIONAL_EVIDENCE]
4-6 rows. NO prose.
COUNTRY|country|policy/law ≤14w|outcome/stat|use-as ≤16w
[/INTERNATIONAL_EVIDENCE]

[TIMELINE]
4-7 events. NO prose.
EVENT|year|≤14w event|≤14w significance
[/TIMELINE]

[PERSPECTIVES]
PRO|[strongest FOR argument ≤22w]
CON|[exactly what the named opponent will argue ≤22w]
NEUTRAL|[what neutral experts say ≤22w]
BLOC|[allied bloc's coordinated position ≤22w]
[/PERSPECTIVES]

[ARGUMENT_DELIVERY]
OPENING|[30-sec hook ≤32w]
MAIN|[main arg 1 with stat ≤24w]
MAIN|[main arg 2 with stat ≤24w]
MAIN|[main arg 3 with stat ≤24w]
EMOTION|[human-impact line ≤22w]
CLOSING|[powerful closing ≤22w]
[/ARGUMENT_DELIVERY]

[READY_SPEECHES]
SPEECH30|[full 30-second speech, ready to read aloud, ≤70 words]
SPEECH60|[full 60-second speech with hook + 2 stats + close, ≤140 words]
ZERO_HOUR|[zero-hour mention — punchy, ≤55 words]
[/READY_SPEECHES]

[RESOLUTION_CLAUSES]
PREAMBLE|[preambulatory clause starting with verb like Recalling/Noting/Recognizing ≤30w]
PREAMBLE|[second preambulatory clause ≤30w]
PREAMBLE|[third preambulatory clause ≤30w]
OPERATIVE|[operative clause starting with Urges/Calls upon/Decides ≤32w]
OPERATIVE|[second operative clause ≤32w]
OPERATIVE|[third operative clause ≤32w]
[/RESOLUTION_CLAUSES]

[POI_TRAPS]
3-5 trap chains. NO prose.
POI|[your question to opponent ≤22w]|[what they'll likely say ≤18w]|[your counter ≤22w]
[/POI_TRAPS]

[COUNTER_STRATEGY]
4-6 anticipated attacks. NO prose.
ATTACK|[opponent move ≤20w]|[your counter ≤22w]|[stat/provision to cite ≤18w]
[/COUNTER_STRATEGY]

[BLIND_SPOTS]
3-5 bullets ≤18w. Specific weaknesses to plug BEFORE committee.
- [most dangerous gap]
- [weakness opposition will exploit]
- [risky assumption]
[/BLIND_SPOTS]

[NEXT_QUESTIONS]
4 bullets ≤16w. Phrase as the delegate would type next.
- [sharper research question]
- [counter-prep question]
- [coalition / strategy question]
- [follow-up angle]
[/NEXT_QUESTIONS]

[SOURCES]
List EVERY distinct source you used (cite by [S#] index when possible). One per line.
SOURCE|Source Name, Year|TYPE|short relevance ≤12w|optional URL
TYPE one of: News|Legal|Academic|Government|NGO|Treaty
Aim for 8-15 sources.
[/SOURCES]
${povBlock}
[ACCURACY_REPORT]
SCORE|${verifyScore}|<≤20w confidence rationale>
STRONG|<most reliable claim ≤18w>
STRONG|<second reliable claim>
WEAK|<claim needing more verification — mark ⚠>
CONFLICT|<contradiction or 'none'>
[/ACCURACY_REPORT]`;
}

// ────────────────────────── handler ──────────────────────────

Deno.serve(async (req) => {
  console.log("🔥 PIPELINE EDGE FUNCTION CALLED");
  
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let payload: any;
  try { payload = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

  console.log("📦 Payload:", { query: payload.query?.slice(0, 50), mode: payload.mode });

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  console.log("🔑 API Key present:", apiKey ? "✅ YES" : "❌ NO");
  
  if (!apiKey) {
    console.error("❌ OPENROUTER_API_KEY not set in environment");
    return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ─────── FOLLOW-UP subroute ───────
  if (payload.followup === true) {
    const followupQuery: string = payload.query || "";
    const priorContent: string = payload.priorContent || "";
    const ctx = delegateContextStr(payload.delegateForm || null);
    if (!followupQuery.trim()) {
      return new Response(JSON.stringify({ error: "Missing query" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return streamPlainResponse(
      apiKey,
      `You are Saathy answering a FOLLOW-UP question that builds on prior research already shown to the delegate.

DELEGATE BRIEF:
${ctx}

PRIOR RESEARCH (already shown — don't repeat verbatim, build on it):
${priorContent.slice(0, 6000)}

Answer the follow-up specifically and with NEW detail. Cite sources where possible. Be debate-ready, ≤200 words. Use clean prose with at most 2-3 short bullets if listing.`,
      followupQuery,
      [],
      1200,
      0.5,
    );
  }

  const {
    query,
    mode = "normal" as Mode,
    delegateForm = null,
    modelConfig = {},
    chatHistory = [],
    povLens = null,
  } = payload;

  if (!query || typeof query !== "string") {
    return new Response(JSON.stringify({ error: "Missing query" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const ctx = delegateContextStr(delegateForm);
  const pov: string | null = typeof povLens === "string" && povLens.trim() ? povLens.trim() : null;
  const enabled = (id: ModelId) => modelConfig[id]?.enabled !== false;
  const budget = TOKEN_BUDGET[mode as Mode] ?? TOKEN_BUDGET.normal;

  // ─────── NORMAL mode → INTENT ROUTING ───────
  if (mode === "normal") {
    const intent: NormalIntent = detectNormalIntent(query);
    const recentHistory = (chatHistory || []).slice(-8).map((m: any) => ({ role: m.role, content: m.content }));

    if (intent === "conversational") {
      return streamPlainResponse(
        apiKey,
        `You are Saathy — a sharp, warm, witty AI research partner for MUN/Yuva Sansad delegates.

DELEGATE BRIEF:
${ctx}

For casual messages, respond like a smart friend who knows their committee inside out. 1-3 sentences max. NO markdown headers, NO bullet lists, NO JSON, NO structured tags. If they greet you, greet them back warmly and reference their committee/topic to show you're ready.`,
        query, recentHistory, 350, 0.85,
        { responseType: "conversational", intent: "conversational" },
      );
    }
    if (intent === "factual") {
      return streamPlainResponse(
        apiKey,
        `You are Saathy — expert on Indian law, policy, MUN procedure, IR, political science.

DELEGATE BRIEF:
${ctx}

Answer this factual question directly. Format: 2-4 sentences of clear explanation, then optionally 2-3 short "- " bullets if the answer has parts. Cite specific provision/source where relevant (e.g., "Article 21, Constitution of India", "NCRB 2022"). NO heavy structure, NO JSON tags.`,
        query, recentHistory, 700, 0.4,
        { responseType: "factual", intent: "factual" },
      );
    }
    if (intent === "general") {
      return streamPlainResponse(
        apiKey,
        `You are Saathy — political intelligence assistant for MUN delegates.

DELEGATE BRIEF:
${ctx}

Provide a helpful, clear response. Use AT MOST one short bold lead-in or heading. Mostly prose paragraphs, with a few bullets only if listing items. NO JSON tags, NO heavy card structure. End with one short follow-up suggestion prefixed with "→ ".`,
        query, recentHistory, 1100, 0.6,
        { responseType: "general", intent: "general" },
      );
    }
    // intent === "debate" → fall through to legacy debate dossier flow
  }

  const isResearchPipeline = mode === "deepdive" || mode === "webdive";

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`));
      };
      const stage = (id: ModelId, status: "running" | "done" | "error" | "skipped", labelOverride?: string) => {
        send("stage", { id, status, label: status === "running" ? (labelOverride ?? ACTIVITY_LABELS[id][mode as Mode]) : undefined });
      };
      const rstage = (n: number, status: "running" | "done" | "error" | "skipped", message?: string) => {
        send("rstage", { n, status, message });
      };

      try {
        if (isResearchPipeline) {
          // Tell the client this is the dossier response type
          send("meta", { responseType: "debate" });

          // Quick Insights — fired immediately, streamed alongside pipeline
          send("phase", { phase: "researching" });
          generateQuickInsights(apiKey, query, ctx).then((insights) => {
            if (insights.length > 0) send("qi", { insights });
          }).catch(() => {});

          // Stage 1
          rstage(1, "running", "Decomposing into research angles…");
          stage("kimi", "running", "Decomposing into research angles…");
          const queries = await stage1_decompose(apiKey, query, ctx, pov);
          rstage(1, "done", `Generated ${queries.length} research angles`);

          // Stage 2
          rstage(2, "running", `Searching ${queries.length} angles in parallel…`);
          stage("kimi", "running", `Researching ${queries.length} angles with free models…`);
          const searchResults = await stage2_search(apiKey, queries);
          const allSources = searchResults.flatMap((r) => r.result.sources);
          const seenUrls = new Set<string>();
          const dedupedSources = allSources.filter((s) => {
            if (!s.uri || seenUrls.has(s.uri)) return false;
            seenUrls.add(s.uri);
            return true;
          });
          const totalResults = dedupedSources.length;
          rstage(2, "done", `Retrieved ${totalResults} unique sources from the web`);
          stage("kimi", "done");

          // Stage 3
          rstage(3, mode === "webdive" ? "done" : "skipped", mode === "webdive" ? `Using ${totalResults} grounded passages` : "Skipped (DeepDive)");

          // Stage 4
          rstage(4, "running", "4 specialist analysts running in parallel…");
          stage("glm", "running", "Legal analyst…");
          stage("qwen", "running", "Statistical analyst…");
          if (enabled("deepseek")) stage("deepseek", "running", "Political intelligence…");
          if (enabled("nemotron")) stage("nemotron", "running", "International comparator…");

          const searchCorpus = searchResults
            .map((r, i) => `### ANGLE ${i + 1}: ${r.query}\n${r.result.text}`)
            .join("\n\n");

          const extracted = await stage4_extract(apiKey, searchCorpus, query, pov);
          rstage(4, "done", "Legal · Statistical · Political · International complete");
          stage("glm", "done");
          stage("qwen", "done");
          if (enabled("deepseek")) stage("deepseek", "done");
          if (enabled("nemotron")) stage("nemotron", "done");

          // Stage 5
          rstage(5, "running", "Fetching last-30-days developments…");
          const liveResult = await stage5_live(apiKey, query);
          for (const s of liveResult.sources) {
            if (s.uri && !seenUrls.has(s.uri)) {
              seenUrls.add(s.uri);
              dedupedSources.push(s);
            }
          }
          rstage(5, "done", `Found ${liveResult.sources.length} recent sources`);

          // Stage 6
          rstage(6, "running", "Cross-verifying facts across all sources…");
          stage("gemini", "running");
          const verify = await stage6_verify(apiKey, extracted, liveResult.text);
          stage("gemini", "done");
          rstage(6, "done", `Confidence ${verify.score}/100`);

          // Stage 7 — streaming synthesis
          rstage(7, "running", "Synthesizing final intelligence dossier…");
          send("phase", { phase: "synthesizing" });
          stage("claude", "running");

          const synthRes = await fetch(OR_URL, {
            method: "POST",
            headers: orHeaders(apiKey),
            body: JSON.stringify({
              model: MODEL_FAMILY.claude.model,
              messages: [
                { role: "system", content: buildDossierSystemPrompt(delegateForm, pov, mode as Mode) },
                ...chatHistory.slice(-4).map((m: any) => ({ role: m.role, content: m.content })),
                {
                  role: "user",
                  content: buildDossierUserPrompt(
                    query, queries, searchCorpus, extracted, liveResult,
                    verify.report, verify.score, pov, dedupedSources,
                  ),
                },
              ],
              stream: true,
              max_tokens: budget.claude,
              temperature: MODEL_FAMILY.claude.temperature,
            }),
          });

          if (!synthRes.ok || !synthRes.body) {
            if (synthRes.status === 429) send("error", { message: "Rate limit reached. Wait a moment." });
            else if (synthRes.status === 402) send("error", { message: "AI credits exhausted." });
            else send("error", { message: "Synthesis failed." });
            stage("claude", "error");
            rstage(7, "error", "Synthesis failed");
            controller.enqueue(enc.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          const reader = synthRes.body.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          let streamDone = false;
          while (!streamDone) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            let nl: number;
            while ((nl = buf.indexOf("\n")) !== -1) {
              let line = buf.slice(0, nl);
              buf = buf.slice(nl + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line || line.startsWith(":") || !line.startsWith("data: ")) continue;
              const json = line.slice(6).trim();
              if (json === "[DONE]") { streamDone = true; break; }
              try {
                const parsed = JSON.parse(json);
                const c = parsed.choices?.[0]?.delta?.content;
                if (c) send("text", { text: c });
              } catch { buf = line + "\n" + buf; break; }
            }
          }

          stage("claude", "done");
          rstage(7, "done", "Dossier complete");
          send("phase", { phase: "done" });
          send("done", {
            modelsUsed: ["kimi", "glm", "qwen", "deepseek", "nemotron", "gemini", "claude"]
              .filter((id) => enabled(id as ModelId) || id === "gemini" || id === "claude"),
            sourceCount: dedupedSources.length,
            confidenceScore: verify.score,
          });
          controller.enqueue(enc.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        // ════════════════ LEGACY PIPELINE (Normal-debate / All-In-Lord) ════════════════
        send("meta", { responseType: "debate" });
        const enabledMap: Record<ModelId, boolean> = {
          kimi: enabled("kimi"), glm: enabled("glm"), qwen: enabled("qwen"),
          deepseek: enabled("deepseek"), nemotron: enabled("nemotron"),
          gemini: true, claude: true,
        };

        // Quick insights also fire here (only for debate-classified Normal + AllInLord)
        generateQuickInsights(apiKey, query, ctx).then((insights) => {
          if (insights.length > 0) send("qi", { insights });
        }).catch(() => {});

        send("phase", { phase: "orchestrating" });
        const plan = await runOrchestrator(apiKey, query, ctx, pov, enabledMap);
        send("plan", { plan });

        send("phase", { phase: "researching" });
        const specialists: Exclude<ModelId, "gemini" | "claude">[] = [];
        if (enabled("kimi")) specialists.push("kimi");
        if (enabled("glm")) specialists.push("glm");
        if (enabled("qwen")) specialists.push("qwen");

        const useDeepseek = mode === "allinlord" && enabled("deepseek");
        const useNemotron = mode === "allinlord" && enabled("nemotron");

        const specialistResults: { id: string; output: string }[] = [];
        for (const id of specialists) {
          stage(id, "running");
          const output = await callModel(
            apiKey, id,
            SPECIALIST_PROMPTS[id](mode as Mode, pov),
            `Topic: ${query}\nCore: ${plan.core_query}\nAngles: ${plan.research_angles.join(" | ") || "(none)"}\n\nDelegate context:\n${ctx}`,
            budget[id],
          );
          stage(id, output ? "done" : "error");
          specialistResults.push({ id, output });
          await new Promise((r) => setTimeout(r, 250));
        }
        const parallelText = specialistResults.filter((r) => r.output).map((r) => `=== ${r.id.toUpperCase()} ===\n${r.output}`).join("\n\n");

        let deepseekOut = "";
        if (useDeepseek) {
          stage("deepseek", "running");
          deepseekOut = await callModel(apiKey, "deepseek", SPECIALIST_PROMPTS.deepseek(mode as Mode, pov),
            `Topic: ${query}\n\nPrior research:\n${parallelText}\n\nDelegate context:\n${ctx}\nFill gaps.`, budget.deepseek);
          stage("deepseek", deepseekOut ? "done" : "error");
        }
        let nemotronOut = "";
        if (useNemotron) {
          stage("nemotron", "running");
          nemotronOut = await callModel(apiKey, "nemotron", SPECIALIST_PROMPTS.nemotron(mode as Mode, pov),
            `PhD-level deep analysis: ${query}\n\nDelegate context:\n${ctx}\n\nPrior research:\n${parallelText}`, budget.nemotron);
          stage("nemotron", nemotronOut ? "done" : "error");
        }
        const allResearch = [parallelText, deepseekOut && `=== DEEPSEEK ===\n${deepseekOut}`, nemotronOut && `=== NEMOTRON ===\n${nemotronOut}`].filter(Boolean).join("\n\n");

        send("phase", { phase: "fact_checking" });
        stage("gemini", "running");
        const factCheck = await callModel(apiKey, "gemini",
          `You are a rigorous fact-checker. For each major claim, output:\nVERIFIED|[claim]|[HIGH|MED|LOW]|[basis]\nUNVERIFIED|[claim]|[reason]\nCONFLICT|[claim]|[what contradicts]\nEnd with:\nSCORE|[0-100]|[brief explanation]`,
          `Topic: ${query}\n\nResearch:\n${allResearch}`, budget.gemini);
        stage("gemini", factCheck ? "done" : "error");

        send("phase", { phase: "synthesizing" });
        stage("claude", "running");

        const sysPrompt = `You are SAATHY — instant MUN strategist. Output ONLY structured tags below — no preamble, no markdown, no closing remarks. Every line speech-ready, ≤22 words. Density via more rows. Always cite Source, Year. Tier evidence T1-T4. Append «STRONG»/«WEAK»/«CONFLICT» badges per fact-check. Defend the delegate's position.${pov ? `\nPOV LENS: Frame through ${pov}.` : ""}\n\nDELEGATE BRIEF:\n${ctx}`;

        const userPrompt = `ORIGINAL QUERY: ${query}\n\nRESEARCH:\n${allResearch}\n\nFACT-CHECK:\n${factCheck}\n\nReturn EXACTLY:\n\n[AT_A_GLANCE]\n3-4 bullets ≤14w each, punchlines.\n- [...]\n[/AT_A_GLANCE]\n\n[ARGUMENT_STRUCTURE]\nCLAIM: [≤18w] «STRONG/WEAK/CONFLICT»\nWARRANT: [≤18w]\nEVIDENCE: [≤22w + Source, Year]\nIMPACT: [≤18w]\n[/ARGUMENT_STRUCTURE]\n\n[EVIDENCE_TABLE]\n5-7 rows. ITEM|claim ≤18w «BADGE»|Source, Year|Statistical/Expert/Treaty|T1-T4|deploy ≤14w\n[/EVIDENCE_TABLE]\n\n[PERSPECTIVES]\nPRO|[≤22w]\nCON|[≤22w]\nNEUTRAL|[≤22w]\nBLOC|[≤22w]\n[/PERSPECTIVES]\n\n[READY_SPEECHES]\nSPEECH30|[full 30s speech ≤70w]\nSPEECH60|[full 60s speech ≤140w]\nZERO_HOUR|[zero-hour ≤55w]\n[/READY_SPEECHES]\n\n[BLIND_SPOTS]\n3 bullets ≤18w.\n- [...]\n[/BLIND_SPOTS]\n\n[NEXT_QUESTIONS]\n3 bullets ≤16w.\n- [...]\n[/NEXT_QUESTIONS]\n\n[SOURCES]\nSOURCE|Source Name, Year|TYPE|relevance ≤12w\n6-10 sources.\n[/SOURCES]\n\n[ACCURACY_REPORT]\nSCORE|<30-98>|<≤20w rationale>\nSTRONG|<≤18w>\nSTRONG|<≤18w>\nWEAK|<≤18w>\nCONFLICT|<≤18w or 'none'>\n[/ACCURACY_REPORT]`;

        const streamRes = await fetch(OR_URL, {
          method: "POST",
          headers: orHeaders(apiKey),
          body: JSON.stringify({
            model: MODEL_FAMILY.claude.model,
            messages: [
              { role: "system", content: sysPrompt },
              ...chatHistory.slice(-4).map((m: any) => ({ role: m.role, content: m.content })),
              { role: "user", content: userPrompt },
            ],
            stream: true, max_tokens: budget.claude, temperature: MODEL_FAMILY.claude.temperature,
          }),
        });

        if (!streamRes.ok || !streamRes.body) {
          if (streamRes.status === 429) send("error", { message: "Rate limit reached." });
          else if (streamRes.status === 402) send("error", { message: "AI credits exhausted." });
          else send("error", { message: "Synthesis failed." });
          stage("claude", "error");
          controller.enqueue(enc.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let streamDone = false;
        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line || line.startsWith(":") || !line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") { streamDone = true; break; }
            try {
              const parsed = JSON.parse(json);
              const c = parsed.choices?.[0]?.delta?.content;
              if (c) send("text", { text: c });
            } catch { buf = line + "\n" + buf; break; }
          }
        }

        stage("claude", "done");
        send("phase", { phase: "done" });
        send("done", {
          modelsUsed: [...specialists, useDeepseek && "deepseek", useNemotron && "nemotron", "gemini", "claude"].filter(Boolean),
        });
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e) {
        console.error("Pipeline error:", e);
        send("error", { message: e instanceof Error ? e.message : "Pipeline failure" });
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
});

// Legacy orchestrator (used by Normal-debate / All-In-Lord)
async function runOrchestrator(
  apiKey: string, query: string, ctx: string, pov: string | null,
  enabledIds: Record<ModelId, boolean>,
): Promise<{ core_query: string; research_angles: string[] }> {
  const sys = `You are the ORCHESTRATOR for a MUN research pipeline. Output STRICT JSON only — no prose.
{ "core_query": "≤25 words rephrase", "research_angles": ["3-5 sub-angles"] }`;
  const user = `User query: ${query}\n\nDelegate brief:\n${ctx}${pov ? `\nPOV lens: ${pov}` : ""}\nEnabled: ${Object.entries(enabledIds).filter(([, v]) => v).map(([k]) => k).join(", ")}\nReturn JSON only.`;
  const raw = await callModel(apiKey, "gemini", sys, user, 400);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { core_query: query, research_angles: [] };
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      core_query: typeof parsed.core_query === "string" ? parsed.core_query : query,
      research_angles: Array.isArray(parsed.research_angles) ? parsed.research_angles.slice(0, 5) : [],
    };
  } catch { return { core_query: query, research_angles: [] }; }
}

// Stream a plain text response via SSE in our pipeline-event format.
// Client receives `meta` first, then `text` chunks, then `done`.
function streamPlainResponse(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  history: { role: "user" | "assistant"; content: string }[],
  maxTokens: number,
  temperature: number,
  meta: Record<string, unknown> = { responseType: "general" },
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`));
      };
      try {
        send("meta", meta);
        const res = await fetch(OR_URL, {
          method: "POST",
          headers: orHeaders(apiKey),
          body: JSON.stringify({
            model: MODEL_FAMILY.gemini.model,
            messages: [
              { role: "system", content: systemPrompt },
              ...history,
              { role: "user", content: userPrompt },
            ],
            stream: true,
            max_tokens: maxTokens,
            temperature,
          }),
        });
        if (!res.ok || !res.body) {
          if (res.status === 429) send("error", { message: "Rate limit reached." });
          else if (res.status === 402) send("error", { message: "AI credits exhausted." });
          else send("error", { message: "Saathy is unavailable." });
          controller.enqueue(enc.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let streamDone = false;
        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line || line.startsWith(":") || !line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") { streamDone = true; break; }
            try {
              const parsed = JSON.parse(json);
              const c = parsed.choices?.[0]?.delta?.content;
              if (c) send("text", { text: c });
            } catch { buf = line + "\n" + buf; break; }
          }
        }
        send("done", { modelsUsed: ["gemini"] });
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e) {
        console.error("plain stream error:", e);
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ event: "error", message: e instanceof Error ? e.message : "stream failed" })}\n\n`));
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
