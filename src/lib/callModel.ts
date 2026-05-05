import { getSession } from "./mockAuth";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/call-model`;

export async function callModel(model: string, prompt: string): Promise<string> {
  try {
    console.log("🔄 Calling via Edge Function:", model);
    
    // Determine provider based on model name
    let provider = "openrouter";
    if (model.includes("groq") || model.includes("llama-3.3-70b-versatile") || model.includes("llama-3.1-8b")) {
      provider = "groq";
    } else if (model.includes("claude")) {
      provider = "anthropic";
    }
    
    console.log("📡 Provider:", provider);
    console.log("🔗 URL:", FUNCTION_URL);
    
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        provider: provider,
      }),
    });
    
    console.log("📥 Response status:", response.status);
    
    const data = await response.json();
    console.log("📦 Response data:", data);
    
    if (!data.success) {
      throw new Error(data.error || "Unknown error from edge function");
    }
    
    console.log("✅ Success! Content length:", data.content?.length || 0);
    return data.content || "No response";
    
  } catch (error) {
    console.error(`❌ Model ${model} failed:`, error);
    throw error;
  }
}

// Simple pipeline that calls multiple models in parallel
export async function runResearchPipeline(query: string, mode: string = "normal") {
  console.log("🚀 PIPELINE START:", { query, mode });
  
  const models: Record<string, string[]> = {
    normal: ["meta-llama/llama-3.3-70b-instruct:free"],
    webdive: [
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemini-2.0-flash-exp:free",
    ],
    deepdive: [
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemini-2.0-flash-exp:free",
      "nvidia/llama-3.1-nemotron-70b-instruct:free",
    ],
    allinlord: [
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemini-2.0-flash-exp:free",
      "nvidia/llama-3.1-nemotron-70b-instruct:free",
      "deepseek/deepseek-chat:free",
    ],
  };
  
  const selectedModels = models[mode] || models.normal;
  console.log("📡 Models:", selectedModels);
  
  try {
    // Call all models in parallel
    const promises = selectedModels.map(model =>
      callModel(model, query)
        .then(response => ({
          model,
          response,
          status: "success" as const,
        }))
        .catch(error => ({
          model,
          error: error.message,
          status: "failed" as const,
        }))
    );
    
    const results = await Promise.all(promises);
    console.log("📊 Pipeline results:", results);
    
    // Filter successful responses
    const successful = results.filter(r => r.status === "success");
    const failed = results.filter(r => r.status === "failed");
    
    if (successful.length === 0) {
      throw new Error(`All models failed: ${failed.map(f => f.error).join(", ")}`);
    }
    
    // Combine responses
    const combinedText = successful.map(r => `**${r.model}:**\n${r.response}`).join("\n\n---\n\n");
    
    return {
      success: true,
      text: combinedText,
      data: successful,
      failed: failed,
      totalModels: selectedModels.length,
      successCount: successful.length,
    };
    
  } catch (error) {
    console.error("💥 Pipeline FAILED:", error);
    throw error;
  }
}
