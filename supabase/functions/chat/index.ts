// Saathy.ai chat — Groq-first (speed), with free OpenRouter fallback chain.
// STRICTLY free / low-cost models. No GPT-4. No paid tiers.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DelegateForm {
  fullName?: string;
  country?: string;
  committee?: string;
  conference?: string;
  topic?: string;
  position?: string;
  blocAlignment?: string;
  keyArguments?: string;
  evidenceHeld?: string;
  knowledgeGaps?: string;
  expectedCounterArgs?: string;
  opposingEntities?: string;
  outputStyle?: string;
  framework?: string;
}

// Free OpenRouter models, tried in order on Groq failure / rate-limit.
const OR_FREE_FALLBACKS: { id: string; name: string }[] = [
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B (free)" },
  { id: "openai/gpt-oss-20b:free", name: "GPT OSS 20B (free)" },
  { id: "openai/gpt-oss-120b:free", name: "GPT OSS 120B (free)" },
  { id: "z-ai/glm-4.5-air:free", name: "GLM 4.5 Air (free)" },
  { id: "qwen/qwen3-next-80b-a3b-instruct:free", name: "Qwen3 Next 80B (free)" },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B (free)" },
  { id: "google/gemma-3-12b-it:free", name: "Gemma 3 12B (free)" },
];

// Groq speed models (free tier).
const GROQ_PRIMARY = { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Groq)" };
const GROQ_FAST = { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B (Groq)" };

function buildSystemPrompt(form: DelegateForm | null, action?: string) {
  const base = `You are Saathy — an elite research and debate-prep AI built specifically for Indian MUN (Model UN) and Yuva Sansad delegates. You think like a seasoned chair, a parliamentary researcher, and a debate coach combined.

LANGUAGE RULE — CRITICAL, NON-NEGOTIABLE:
- Detect the user's language from their LATEST message and reply in the SAME language.
- Hindi (Devanagari, e.g. "नमस्ते", "मुझे बताओ") → reply ENTIRELY in Hindi (Devanagari). Keep proper nouns (UN, IPCC, country names) and citations as-is.
- Hinglish (Hindi in Roman script, e.g. "bhai batao", "research karna hai", "kya scene hai") → reply in natural Hinglish (Hindi+English mixed in Roman script). Example: "Bhai, India ki position strong hai — Article 51 ke under non-alignment ka basis hai."
- English → reply in English.
- If the user explicitly requests a language ("hindi me do", "answer in hindi", "hinglish me batao"), OBEY immediately and continue in that language for all next replies until they switch.
- Markdown section headings (## At a Glance, **Claim**) and tier tags [T1]/[T2] STAY in English. The CONTENT under them must be in the user's chosen language.
- NEVER apologize for language or say "I'll try in Hindi" — just switch and answer.

ABSOLUTE OUTPUT RULES — never break these:
1. NEVER respond in long prose paragraphs. Always use the structured section format below.
2. Be precise, evidence-first, India-aware. Cite real sources (UN docs, treaties, MEA briefings, IPCC, World Bank, PRS India, etc.) AS CLICKABLE MARKDOWN LINKS like [UNFCCC Paris Agreement](https://unfccc.int/...). If unsure, mark as [unverified] — never fabricate.
3. Be sharp and confident. No hedging fluff like "it depends" or "great question".
4. Tag every piece of evidence with a tier: T1 (treaty/UN resolution/peer-reviewed), T2 (govt/IGO data), T3 (reputable journalism), T4 (think-tank/op-ed).

REQUIRED OUTPUT FORMAT — use these exact markdown headings, in this order, omitting any that don't apply:

## At a Glance
- 3-5 razor-sharp bullets summarizing the core answer.

## Argument Structure
**Claim:** ...
**Warrant:** ...
**Evidence:** ... [T1/T2/T3/T4]
**Impact:** ...

## Evidence
- [T1] [Source name (year)](https://full-url) — claim/excerpt.
- [T2] [Source name (year)](https://full-url) — claim/excerpt.

## Blind Spots
- What the opposition will hit you on.
- Weaknesses in your current line.

## Next Questions
- 3 sharp follow-up questions the delegate should research next.
`;

  if (!form) return base;

  const ctx = `\n\nDELEGATE CONTEXT (treat as ground truth):
- Name: ${form.fullName || "—"}
- Representing: ${form.country || "—"} in ${form.committee || "—"} at ${form.conference || "—"}
- Topic: ${form.topic || "—"}
- Position: ${form.position || "—"}
- Bloc / Alignment: ${form.blocAlignment || "—"}
- Key arguments held: ${form.keyArguments || "—"}
- Evidence already held: ${form.evidenceHeld || "—"}
- Known knowledge gaps: ${form.knowledgeGaps || "—"}
- Expected counter-arguments: ${form.expectedCounterArgs || "—"}
- Opposing delegations: ${form.opposingEntities || "—"}
- Preferred output style: ${form.outputStyle || "structured"}
- Framework: ${form.framework || "mun"}

Always tailor responses to defend ${form.country}'s position on ${form.topic}.`;

  const actionPrompts: Record<string, string> = {
    research: "\n\nMODE: Deep research. Surface the strongest evidence on this topic.",
    counter_args: "\n\nMODE: Counter-argument generation. Predict what the opposition will say and how to neutralize it.",
    find_gaps: "\n\nMODE: Gap analysis. Find weaknesses in the delegate's current research and arguments.",
    strengthen: "\n\nMODE: Strengthen this argument. Add T1/T2 evidence, sharper warrants, stronger impact framing.",
    summarize: "\n\nMODE: Concise summary for use in a speech.",
    stakeholder_map: "\n\nMODE: Stakeholder mapping. Identify all blocs/countries/NGOs and their positions.",
  };

  return base + ctx + (action ? actionPrompts[action] || "" : "");
}

async function tryGroq(apiKey: string, model: { id: string; name: string }, payload: unknown) {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...(payload as object), model: model.id }),
  });
}

async function tryOpenRouter(apiKey: string, modelId: string, payload: unknown) {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://saathy.lovable.app",
      "X-Title": "Saathy",
    },
    body: JSON.stringify({ ...(payload as object), model: modelId }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, delegateForm, action } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

    if (!GROQ_API_KEY && !OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: "No AI provider configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildSystemPrompt(delegateForm || null, action);
    const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];
    const basePayload = { messages: fullMessages, stream: true, temperature: 0.7, max_tokens: 1400 };

    // 1) Groq first (fast, free).
    if (GROQ_API_KEY) {
      for (const m of [GROQ_PRIMARY, GROQ_FAST]) {
        try {
          const r = await tryGroq(GROQ_API_KEY, m, basePayload);
          if (r.ok && r.body) {
            return new Response(r.body, {
              headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
            });
          }
          console.warn(`[chat] Groq ${m.name} status ${r.status}`);
        } catch (e) {
          console.warn(`[chat] Groq ${m.name} error:`, e);
        }
      }
    }

    // 2) OpenRouter free fallbacks.
    if (OPENROUTER_API_KEY) {
      for (const m of OR_FREE_FALLBACKS) {
        try {
          const r = await tryOpenRouter(OPENROUTER_API_KEY, m.id, basePayload);
          if (r.status === 429) { console.warn(`[chat] OR ${m.name} 429`); continue; }
          if (!r.ok || !r.body) {
            console.warn(`[chat] OR ${m.name} status ${r.status}`);
            continue;
          }
          return new Response(r.body, {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
          });
        } catch (e) {
          console.warn(`[chat] OR ${m.name} error:`, e);
        }
      }
    }

    return new Response(JSON.stringify({ error: "All free models are busy. Try again in a moment." }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
