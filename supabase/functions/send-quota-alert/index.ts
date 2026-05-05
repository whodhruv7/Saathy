import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, email } = await req.json();

    const message = `
      <h2>Daily Research Quota Limit Reached</h2>
      <p>Your daily research quota has been exhausted.</p>
      <p>Daily Limits:</p>
      <ul>
        <li>All-In-Lord: 2 queries</li>
        <li>WebDive: 3 queries</li>
        <li>DeepDive: 3 queries</li>
        <li>Normal: 30 queries</li>
      </ul>
      <p>Your quotas will reset in 24 hours.</p>
      <p><strong>Contact Founder:</strong> dhruvsharma4944@gmail.com | Instagram: @who_dhruv7</p>
    `;

    // Log for now - integrate with SendGrid/Resend for production
    console.log("Quota alert email would be sent to:", email);
    console.log("Message:", message);

    return new Response(
      JSON.stringify({ success: true, message: "Alert logged" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending quota alert:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send alert" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
