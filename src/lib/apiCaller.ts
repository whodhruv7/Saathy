// apiCaller.ts — Direct API calls with OpenRouter → Groq → Gemini fallback
// No Supabase backend needed. Multi-language support included.

import { getGeminiKey, getGroqKey, getOpenRouterKey } from "./apiKeys";
import { buildDossierSystemPrompt, controlDossierWithGemini, delegateContext, validateDossier } from "./saathyPipeline";
import type { DelegateForm } from "@/types";

// Detect user language from input
function detectLanguage(text: string): string {
  const hindiRegex = /[\u0900-\u097F]/;
  if (hindiRegex.test(text)) return 'hindi';
  return 'english';
}

// Language-aware prompts
function getLanguagePrompt(lang: string, mode: string): string {
  if (lang === 'hindi') {
    return mode === 'normal' 
      ? 'आप साथी हैं, एक AI शोध सहायक। हिंदी में उत्तर दें।'
      : 'आप एक शोध विशेषज्ञ हैं। हिंदी में JSON प्रारूप में विस्तृत शोध प्रदान करें।';
  }
  return 'english';
}

async function callOpenRouter(systemPrompt: string, userPrompt: string, model: string) {
  const key = getOpenRouterKey();
  if (!key) throw new Error('OpenRouter key missing');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'https://saathy.ai',
      'X-Title': 'Saathy',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 3200,
      temperature: modeTemperature(model),
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `OpenRouter error: ${response.status}`);
  }
  return data.choices[0].message.content;
}

function modeTemperature(model: string) {
  return model.includes('deepseek') ? 0.35 : 0.45;
}

async function callGroq(systemPrompt: string, userPrompt: string) {
  const key = getGroqKey();
  if (!key) throw new Error('Groq key missing');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 3200,
      temperature: 0.45,
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Groq error: ${response.status}`);
  }
  return data.choices[0].message.content;
}

async function callGemini(systemPrompt: string, userPrompt: string) {
  const key = getGeminiKey();
  if (!key) throw new Error('Gemini key missing');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemPrompt + '\n\n' + userPrompt }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 3200,
          temperature: 0.45,
        }
      })
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini error: ${response.status}`);
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Main API caller with fallback
export async function callAI(systemPrompt: string, userPrompt: string, mode: string = 'normal') {
  const language = detectLanguage(userPrompt);
  console.log(`📊 Mode: ${mode} | Language: ${language}`);

  // Try OpenRouter first
  try {
    console.log('🔄 Calling OpenRouter...');
    const model = mode === 'research' ? 'deepseek/deepseek-r1:free' : 'meta-llama/llama-3.3-70b-instruct:free';
    const result = await callOpenRouter(systemPrompt, userPrompt, model);
    console.log('✅ OpenRouter succeeded');
    return result;
  } catch (orError: any) {
    console.log('⚠️ OpenRouter failed:', orError.message);
  }

  // Fallback to Groq
  try {
    console.log('🔄 Trying Groq...');
    const result = await callGroq(systemPrompt, userPrompt);
    console.log('✅ Groq succeeded');
    return result;
  } catch (groqError: any) {
    console.log('⚠️ Groq failed:', groqError.message);
  }

  // Fallback to Gemini
  try {
    console.log('🔄 Trying Gemini...');
    const result = await callGemini(systemPrompt, userPrompt);
    console.log('✅ Gemini succeeded');
    return result;
  } catch (geminiError: any) {
    console.log('⚠️ Gemini failed:', geminiError.message);
  }

  throw new Error('System is busy. Please try again later.');
}

export async function handleNormalMode(input: string) {
  const language = detectLanguage(input);
  const langPrompt = getLanguagePrompt(language, 'normal');
  const system = `You are Saathy, a sharp MUN/debate assistant.
${langPrompt}
Normal mode must feel like normal chat, not a dossier.
Answer in clean markdown with:
- a direct answer first
- 2-4 compact bullets when useful
- one "Use this in debate:" line for debate questions
No bracket tags. No dossier sections. No over-formatting.`;

  try {
    return await callAI(system, input, 'normal');
  } catch (err: any) {
    throw new Error(err.message || 'Chat failed');
  }
}

export async function handleFocusedMode(
  input: string,
  mode: string,
  delegateForm?: Partial<DelegateForm> | null
) {
  const modePrompt =
    mode === 'speech'
      ? `Return a speech tool output, not a dossier:
## 🎤 Speech
Opening hook, 3 tight beats, closing line.
## 📊 Evidence to weave in
3 bullets with numbers/source names if known.
## ⚠️ Delivery note
Tone, pace, emphasis.`
      : mode === 'counter'
        ? `Return a rebuttal tool output, not a dossier:
## ⚡ Counter Strategy
3 likely attacks and counters.
## 🎯 POI Traps
3 sharp POIs with predicted answer and counter-punch.
## ✅ Best One-Liner
One killer line to use.`
        : `Return a focused research answer, not a dossier:
## 🎯 Target Brief
Direct answer, key angle, and 4-6 dense bullets.
## 📊 Useful Evidence
Numbers/source names where known.
## 🧠 Best Move
One strategic recommendation.`;

  const system = `You are Saathy. This is ${mode} mode.
Keep the UX different from full research dossier.
Use clean markdown only. No bracket tags.
Be dense, sharp, and useful.

Delegate context:
${delegateContext(delegateForm)}

${modePrompt}`;

  try {
    return await callAI(system, input, mode === 'speech' ? 'normal' : 'research');
  } catch (err: any) {
    throw new Error(`${mode} mode failed: ${err.message || 'Unknown error'}`);
  }
}

export async function handleResearchMode(input: string, mode: string = 'target', delegateForm?: Partial<DelegateForm> | null) {
  const system = buildDossierSystemPrompt(mode, delegateForm);

  try {
    const result = await callAI(system, input, 'research');
    const cleaned = result.replace(/```(?:markdown|md)?/g, '').trim();
    const validation = validateDossier(cleaned);
    if (!validation.ok) {
      console.warn('[Saathy] dossier contract missing tags:', validation.missing.join(', '));
      return controlDossierWithGemini({ raw: cleaned, query: input, mode, delegateForm });
    }
    return cleaned;
  } catch (err: any) {
    throw new Error('Research failed: ' + err.message);
  }
}
