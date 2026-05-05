import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { model, prompt, provider } = await req.json();

    console.log("🔄 Edge function called:", { model, provider });

    // OpenRouter
    if (provider === "openrouter") {
      const apiKey = Deno.env.get("OPENROUTER_API_KEY");
      if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");

      const response = await fetch("https://api.openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://saathy.ai",
          "X-Title": "Saathy AI",
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`OpenRouter: ${data.error?.message || "Unknown error"}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          content: data.choices?.[0]?.message?.content,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Groq
    if (provider === "groq") {
      const apiKey = Deno.env.get("GROQ_API_KEY");
      if (!apiKey) throw new Error("Missing GROQ_API_KEY");

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Groq: ${data.error?.message || "Unknown error"}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          content: data.choices?.[0]?.message?.content,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Claude/Anthropic
    if (provider === "anthropic") {
      const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
      if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Anthropic: ${data.error?.message || "Unknown error"}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          content: data.content?.[0]?.text,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown provider: ${provider}`);

  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
