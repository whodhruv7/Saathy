// ============================================
// OPENROUTER ONLY - NO GROQ, NO EDGE FUNCTIONS
// ============================================

import { getOpenRouterKey } from "./apiKeys";

export async function callModel(model: string, prompt: string) {
  console.log('🔄 Calling OpenRouter:', model);
  
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    console.error('❌ Missing OpenRouter API key');
    throw new Error('API key not configured');
  }
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://saathy.ai',
        'X-Title': 'Saathy AI',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ OpenRouter error:', errorData);
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from model');
    }
    
    console.log('✅ Success! Content length:', content.length);
    return content;
    
  } catch (error: any) {
    console.error('❌ callModel error:', error.message);
    throw error;
  }
}

export async function runResearchPipeline(query: string, mode: string = 'normal') {
  console.log('🚀 Pipeline START:', { query: query.slice(0, 50), mode });
  
  // WORKING OpenRouter free models (as of May 2025)
  const models: Record<string, string[]> = {
    normal: ['meta-llama/llama-3.3-70b-instruct:free'],
    webdive: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
    ],
    deepdive: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
      'nvidia/llama-3.1-nemotron-70b-instruct:free',
    ],
    allinlord: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
      'nvidia/llama-3.1-nemotron-70b-instruct:free',
      'deepseek/deepseek-chat:free',
    ],
  };
  
  const selectedModels = models[mode] || models.normal;
  console.log('📡 Using models:', selectedModels);
  
  try {
    // Call ONE model at a time (sequential, not parallel)
    for (const model of selectedModels) {
      try {
        console.log(`🔄 Trying ${model}...`);
        const result = await callModel(model, query);
        
        console.log('✅ Pipeline SUCCESS');
        return {
          success: true,
          content: result,
          model: model,
          mode: mode,
        };
      } catch (error: any) {
        console.log(`⚠️ ${model} failed:`, error.message);
        // Try next model
      }
    }
    
    // All models failed
    throw new Error('All models failed to respond');
    
  } catch (error: any) {
    console.error('💥 Pipeline FAILED:', error.message);
    return {
      success: false,
      content: `Sorry, I couldn't complete the research. Error: ${error.message}`,
      mode: mode,
    };
  }
}
