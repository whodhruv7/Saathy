// Saathy — generic summarizer. Takes any text and returns a concise streamed summary.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, kind, title } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

    const isNotes = kind === "notes";
    const system = isNotes
      ? "You are a research consolidation assistant for debate delegates. Compress these chat notes into ONE tight master summary. Organize into: ## Core Thesis, ## Key Evidence, ## Counter-Arguments, ## Action Items. Remove duplicates. Preserve every unique fact, citation, statistic. Use clear markdown — short bullets, bold key terms. Be dense but skimmable. Aim for 40-60% of original length."
      : "You are a debate-prep summarizer. Condense the following research dossier into a tight, skimmable brief WITHOUT losing key arguments, statistics, citations, or counter-points. Use markdown: ## headings, bullets, **bold** for terms. Aim for ~30-40% of original length. Lead with the single most important takeaway in one sentence.";

    const userPrompt = title
      ? `Title: ${title}\n\nText to summarize:\n\n${text}`
      : `Text to summarize:\n\n${text}`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://saathy.lovable.app", "X-Title": "Saathy" },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        stream: true,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429)
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (res.status === 402)
        return new Response(JSON.stringify({ error: "Free-model quota exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      return new Response(JSON.stringify({ error: "Summarize failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(res.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
