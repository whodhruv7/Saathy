// Debate Simulator — runs alternating PRO / CON personas using Lovable AI Gateway.
// Streams an exchange of N rounds. Frontend can call again with priorTurns to extend.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OR_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b:free";

interface Turn { side: "pro" | "con"; content: string }

function brief(form: any): string {
  if (!form) return "No brief provided.";
  return [
    `Country: ${form.country || "—"}`,
    `Committee: ${form.committee || "—"}`,
    `Topic: ${form.topic || "—"}`,
    `Position: ${form.position || "—"}`,
    `Opponent: ${form.opponent || "—"}`,
  ].join(" · ");
}

async function callModel(apiKey: string, system: string, messages: { role: string; content: string }[], maxTokens: number): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(OR_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://saathy.lovable.app", "X-Title": "Saathy" },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "system", content: system }, ...messages],
          max_tokens: maxTokens,
          temperature: 0.75,
        }),
      });
      if (res.status === 429 && attempt === 0) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      if (!res.ok) {
        console.error("debate model err", res.status, await res.text().catch(() => ""));
        return "";
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || "";
    } catch (e) {
      console.error("debate threw", e);
      if (attempt === 0) continue;
      return "";
    }
  }
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let payload: any;
  try { payload = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const {
    topic,
    delegateForm,
    priorTurns = [] as Turn[],
    rounds = 3, // each round = pro + con
  } = payload;

  if (!topic || typeof topic !== "string") {
    return new Response(JSON.stringify({ error: "Missing topic" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const briefStr = brief(delegateForm);
  const sysPro = `You are the FOR delegate in a parliamentary debate. Brief: ${briefStr}. Topic: "${topic}". Argue FOR the delegate's position. Speak in first-person committee voice. Punchy, ≤90 words per turn, cite at least one real fact (Source, Year). No filler. End with a sharp line that invites rebuttal.`;
  const sysCon = `You are the OPPOSING delegate in a parliamentary debate. Brief: ${briefStr}. Topic: "${topic}". Argue AGAINST the delegate's position with maximum bite. Speak in first-person committee voice. Punchy, ≤90 words per turn, cite at least one real fact (Source, Year). No filler. End with a question or pressure that the FOR side must answer.`;

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: Record<string, unknown>) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`));

      try {
        const transcript: Turn[] = [...priorTurns];
        const totalTurns = rounds * 2;
        const startSide: "pro" | "con" = transcript.length === 0 ? "pro" : (transcript[transcript.length - 1].side === "pro" ? "con" : "pro");

        for (let i = 0; i < totalTurns; i++) {
          const side: "pro" | "con" = i % 2 === 0 ? startSide : (startSide === "pro" ? "con" : "pro");
          send("turn_start", { side, index: transcript.length });

          const history = transcript.map((t) => ({
            role: t.side === side ? "assistant" : "user",
            content: t.content,
          }));
          if (history.length === 0) {
            history.push({ role: "user", content: `Open the debate on: ${topic}` });
          }
          const out = await callModel(apiKey, side === "pro" ? sysPro : sysCon, history, 400);
          if (!out) {
            send("turn_error", { side, index: transcript.length });
            break;
          }
          transcript.push({ side, content: out });
          send("turn", { side, content: out, index: transcript.length - 1 });
          await new Promise((r) => setTimeout(r, 200));
        }

        send("done", { count: transcript.length });
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e) {
        send("error", { message: e instanceof Error ? e.message : "debate error" });
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
});
