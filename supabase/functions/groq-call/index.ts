// Saathy V6 — Groq dispatcher with Lovable AI fallback so the bot ALWAYS works.
// Streams SSE: {event:"model"}, {event:"text"}, {event:"done"}, {event:"error"}.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OR_URL = "https://openrouter.ai/api/v1/chat/completions";
// Free OpenRouter models tried in order when Groq isn't available.
// Uses every model on the free tier so we always find one with headroom.
const OR_FREE_FALLBACKS: { id: string; name: string }[] = [
  { id: "openai/gpt-oss-20b:free", name: "GPT OSS 20B (free)" },
  { id: "openai/gpt-oss-120b:free", name: "GPT OSS 120B (free)" },
  { id: "z-ai/glm-4.5-air:free", name: "GLM 4.5 Air (free)" },
  { id: "qwen/qwen3-next-80b-a3b-instruct:free", name: "Qwen3 Next 80B (free)" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B (free)" },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B (free)" },
  { id: "google/gemma-3-12b-it:free", name: "Gemma 3 12B (free)" },
  { id: "nousresearch/hermes-3-llama-3.1-405b:free", name: "Hermes 3 405B (free)" },
];

interface Body {
  modelId: string;
  modelKey: string;
  modelName: string;
  system: string;
  user: string;
  history?: { role: "user" | "assistant" | "system"; content: string }[];
  temperature?: number;
  maxTokens?: number;
}

function sse(obj: unknown) {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}

async function streamUpstream(
  upstream: Response,
  controller: ReadableStreamDefaultController,
): Promise<boolean> {
  if (!upstream.body) return false;
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
  return any;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let body: Body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Bad JSON" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (!body.modelId) {
    return new Response(JSON.stringify({ error: "modelId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const groqKey = Deno.env.get("GROQ_API_KEY");

  const messages = [
    { role: "system" as const, content: body.system },
    ...(body.history || []).slice(-10),
    { role: "user" as const, content: body.user },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      // 1) Try Groq if key present
      if (groqKey) {
        try {
          const upstream = await fetch(GROQ_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: body.modelId, stream: true,
              temperature: body.temperature ?? 0.7,
              max_tokens: body.maxTokens ?? 1024,
              messages,
            }),
          });
          if (upstream.ok) {
            controller.enqueue(sse({ event: "model", key: body.modelKey, id: body.modelId, name: body.modelName }));
            const ok = await streamUpstream(upstream, controller);
            if (ok) {
              controller.enqueue(sse({ event: "done", modelUsed: body.modelKey }));
              controller.close();
              return;
            }
            console.warn("[groq-call] empty stream from Groq");
          } else {
            const t = await upstream.text().catch(() => "");
            console.warn(`[groq-call] Groq ${upstream.status}: ${t.slice(0, 200)}`);
          }
        } catch (e) {
          console.warn("[groq-call] Groq network error:", e);
        }
      } else {
        console.warn("[groq-call] no GROQ_API_KEY configured");
      }

      // Fallback: OpenRouter free model (still zero paid usage).
      const orKey = Deno.env.get("OPENROUTER_API_KEY");
      if (orKey) {
        for (const m of OR_FREE_FALLBACKS) {
          try {
            const upstream = await fetch(OR_URL, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${orKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://saathy.lovable.app",
                "X-Title": "Saathy",
              },
              body: JSON.stringify({
                model: m.id,
                stream: true,
                temperature: body.temperature ?? 0.7,
                max_tokens: body.maxTokens ?? 1024,
                messages,
              }),
            });
            if (upstream.status === 429) {
              console.warn(`[groq-call] ${m.name} rate-limited, trying next`);
              continue;
            }
            if (!upstream.ok) {
              const t = await upstream.text().catch(() => "");
              console.warn(`[groq-call] ${m.name} ${upstream.status}: ${t.slice(0, 200)}`);
              continue;
            }
            controller.enqueue(sse({ event: "model", key: "or-free", id: m.id, name: m.name }));
            const ok = await streamUpstream(upstream, controller);
            if (ok) {
              controller.enqueue(sse({ event: "done", modelUsed: "or-free" }));
              controller.close();
              return;
            }
            console.warn(`[groq-call] ${m.name} empty stream`);
          } catch (e) {
            console.warn(`[groq-call] ${m.name} network error:`, e);
          }
        }
      }

      controller.enqueue(sse({ event: "error", message: "All free models are busy. Please try again in a moment." }));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
});
