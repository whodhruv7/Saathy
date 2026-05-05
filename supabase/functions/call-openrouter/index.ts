// call-openrouter - Primary API using YOUR OpenRouter key

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    const { systemPrompt, userPrompt, model } = await req.json();

    console.log("🔥 call-openrouter invoked");
    console.log("Model:", model || "deepseek/deepseek-r1:free");

    if (!openrouterKey) {
      console.error("❌ OPENROUTER_API_KEY not set");
      return new Response(
        JSON.stringify({ error: "API key not configured on server" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterKey}`,
        "HTTP-Referer": "https://saathy.ai",
        "X-Title": "Saathy",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "deepseek/deepseek-r1:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    console.log("OpenRouter response status:", response.status);

    if (!response.ok) {
      console.error("OpenRouter error:", data);
      return new Response(
        JSON.stringify({ error: data.error?.message || "OpenRouter error" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        content: data.choices[0].message.content,
        model: model || "deepseek/deepseek-r1:free"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
