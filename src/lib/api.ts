// ============================================
// OPENROUTER ONLY - NO GROQ, NO EDGE FUNCTIONS
// ============================================

import { getOpenRouterKey } from "./apiKeys";

async function callModel(model: string, prompt: string) {
  try {
    console.log('🔄 Calling OpenRouter:', model);
    
    const apiKey = getOpenRouterKey();
    if (!apiKey) throw new Error('Missing API key');
    
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
        max_tokens: 1000,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API Error');
    }
    
    const content = data.choices?.[0]?.message?.content;
    console.log('✅ Got response from', model);
    return content;
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function runResearchPipeline(query: string, mode: string = 'normal') {
  console.log('🚀 Starting pipeline:', mode);
  
  // Just use ONE model for now (fast test)
  const model = 'meta-llama/llama-2-70b-chat';
  
  try {
    const result = await callModel(model, query);
    console.log('✅ Pipeline success');
    return result;
  } catch (error: any) {
    console.error('❌ Pipeline failed:', error);
    throw error;
  }
}

export { callModel, runResearchPipeline };
