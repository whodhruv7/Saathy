// Saathy — merges all chat notes inside a universe into one consolidated brief.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { universeName, notes } = await req.json();
    if (!Array.isArray(notes) || notes.length === 0) {
      return new Response(JSON.stringify({ error: "No notes provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

    const noteBlocks = notes
      .map((n: { title: string; notes: string }, i: number) => `### Chat ${i + 1}: ${n.title}\n${n.notes}`)
      .join("\n\n---\n\n");

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://saathy.lovable.app", "X-Title": "Saathy" },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
        stream: true,
        max_tokens: 3500,
        messages: [
          {
            role: "system",
            content:
              "You are a research consolidation assistant for debate delegates. Merge research notes from multiple chat sessions into ONE comprehensive, well-organized master brief. Organize by: Key Arguments, Evidence, Counter-Arguments, Action Items. Remove duplicates. Preserve all unique insights. Use clear markdown headers (##, ###), bold key terms, bullet points. This will be the delegate's master brief.",
          },
          {
            role: "user",
            content: `Universe: ${universeName}\n\nMerge these notes:\n\n${noteBlocks}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "Free-model quota exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Merge failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
