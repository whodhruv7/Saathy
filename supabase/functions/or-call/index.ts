// Saathy V5 — OpenRouter dispatcher with rotation + fallback.
// Client sends a candidate list of model IDs (already chosen via ModelRotator).
// We try them in order; on 429 we silently move to the next.
// Streams SSE with events: {event:"model", id, name}, {event:"text", text}, {event:"done"}, {event:"error", message}.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OR_URL = "https://openrouter.ai/api/v1/chat/completions";
const OR_FREE_FALLBACKS: Candidate[] = [
  { key: "gpt_oss_20b", id: "openai/gpt-oss-20b:free", name: "GPT OSS 20B (free)" },
  { key: "gpt_oss_120b", id: "openai/gpt-oss-120b:free", name: "GPT OSS 120B (free)" },
  { key: "glm_45_air", id: "z-ai/glm-4.5-air:free", name: "GLM 4.5 Air (free)" },
  { key: "qwen_next", id: "qwen/qwen3-next-80b-a3b-instruct:free", name: "Qwen3 Next 80B (free)" },
  { key: "llama_70b", id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B (free)" },
  { key: "gemma_27b", id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B (free)" },
  { key: "gemma_12b", id: "google/gemma-3-12b-it:free", name: "Gemma 3 12B (free)" },
  { key: "hermes_405b", id: "nousresearch/hermes-3-llama-3.1-405b:free", name: "Hermes 3 405B (free)" },
];

// ── FREE-ONLY GUARDRAILS ──
// Hard cap on total OpenRouter requests per UTC day across the whole project.
// OpenRouter free tier allows ~200/day per model and ~1000/day total on free accounts
// (50/day if no $10 credit ever added). We cap at 900 to stay safely under.
const DAILY_REQUEST_CAP = 900;
let dailyCount = 0;
let dailyDate = new Date().toISOString().slice(0, 10);
function bumpDailyCounter(): { ok: boolean; used: number } {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dailyDate) { dailyDate = today; dailyCount = 0; }
  if (dailyCount >= DAILY_REQUEST_CAP) return { ok: false, used: dailyCount };
  dailyCount += 1;
  return { ok: true, used: dailyCount };
}
function isFreeModel(id: string): boolean {
  // OpenRouter free tier model ids always end in ":free".
  return typeof id === "string" && id.endsWith(":free");
}

interface Candidate { key: string; id: string; name: string; }

interface Body {
  candidates: Candidate[];   // ordered preference
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  // Optional past turns for chat-history aware calls
  history?: { role: "user" | "assistant" | "system"; content: string }[];
}

function sse(obj: unknown) {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let body: Body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Bad JSON" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY not set" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (!Array.isArray(body.candidates) || body.candidates.length === 0) {
    return new Response(JSON.stringify({ error: "No candidates provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const messages = [
    { role: "system" as const, content: body.system },
    ...(body.history || []).slice(-10),
    { role: "user" as const, content: body.user },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      let lastErr = "All models are busy. Try again in a moment.";
      // Filter out any non-free models defensively, then append known-good free fallbacks.
      const seen = new Set<string>();
      const freeCandidates = [...body.candidates, ...OR_FREE_FALLBACKS]
        .filter((c) => isFreeModel(c.id))
        .filter((c) => {
          if (seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        });
      if (freeCandidates.length === 0) {
        controller.enqueue(sse({ event: "error", message: "No free models available for this request." }));
        controller.close();
        return;
      }

      // Enforce daily cap.
      const cap = bumpDailyCounter();
      if (!cap.ok) {
        controller.enqueue(sse({
          event: "error",
          message: `Daily free-tier cap (${DAILY_REQUEST_CAP} requests) reached. Resets at 00:00 UTC.`,
        }));
        controller.close();
        return;
      }

      for (const cand of freeCandidates) {
        try {
          const upstream = await fetch(OR_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://saathy.lovable.app",
              "X-Title": "Saathy",
            },
            body: JSON.stringify({
              model: cand.id,
              stream: true,
              temperature: body.temperature ?? 0.6,
              max_tokens: body.maxTokens ?? 2048,
              messages,
            }),
          });

          if (upstream.status === 429) {
            console.warn(`[or-call] 429 on ${cand.name}`); lastErr = "Rate-limited. Trying another model…";
            continue;
          }
          if (!upstream.ok || !upstream.body) {
            const t = await upstream.text().catch(() => "");
            console.error(`[or-call] ${cand.name} ${upstream.status}: ${t.slice(0, 200)}`); lastErr = upstream.status === 401 || upstream.status === 403 ? "AI provider rejected the request." : "A model failed. Trying another…";
            continue;
          }

          // Tell client which model actually ran
          controller.enqueue(sse({ event: "model", key: cand.key, id: cand.id, name: cand.name }));

          const reader = upstream.body.getReader();
          const dec = new TextDecoder();
          let buf = "";
          let any = false;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            let idx: number;
            while ((idx = buf.indexOf("\n")) !== -1) {
              let line = buf.slice(0, idx);
              buf = buf.slice(idx + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line || line.startsWith(":") || !line.startsWith("data: ")) continue;
              const json = line.slice(6).trim();
              if (json === "[DONE]") break;
              try {
                const parsed = JSON.parse(json);
                const c = parsed.choices?.[0]?.delta?.content;
                if (typeof c === "string" && c.length) {
                  any = true;
                  controller.enqueue(sse({ event: "text", text: c }));
                }
              } catch {
                buf = line + "\n" + buf;
                break;
              }
            }
          }
          if (any) {
            controller.enqueue(sse({ event: "done", modelUsed: cand.key }));
            controller.close();
            return;
          }
          // empty response — try next
          console.warn(`[or-call] ${cand.name} empty stream`); lastErr = "Models returned empty responses.";
        } catch (e) {
          console.error("[or-call] network:", e); lastErr = "Network hiccup. Try again.";
          continue;
        }
      }

      // No paid fallback — strictly free models only (per user requirement: zero paid usage).

      controller.enqueue(sse({ event: "error", message: lastErr }));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
});
