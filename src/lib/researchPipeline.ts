// Saathy Research Pipeline — Parallel Execution Engine
// Fires multiple models in parallel with fault tolerance and timeout handling

import type { ModelId, ResearchMode, ModelMetadata } from "@/config/models";
import { ALL_MODELS, MODE_CONFIGS, getModel } from "@/config/models";
import { getModelPrompt, type PromptContext } from "./buildPrompts";
import { getOpenRouterKey } from "./apiKeys";
import { buildDossierSystemPrompt, controlDossierWithGemini, validateDossier } from "./saathyPipeline";

export interface PipelineResult {
  success: boolean;
  dossier?: string;
  error?: string;
  modelResults: Record<ModelId, ModelResult>;
  confidenceScore?: number;
  sources?: SourceInfo[];
}

export interface ModelResult {
  modelId: ModelId;
  status: "running" | "done" | "error" | "skipped" | "timeout";
  output?: string;
  error?: string;
  duration: number;
}

export interface SourceInfo {
  name: string;
  year?: string;
  tier: "T1" | "T2" | "T3" | "T4";
}

export interface PipelineCallbacks {
  onModelStart?: (modelId: ModelId) => void;
  onModelComplete?: (modelId: ModelId, result: ModelResult) => void;
  onModelError?: (modelId: ModelId, error: string) => void;
  onProgress?: (completed: number, total: number) => void;
  onSynthesisStart?: () => void;
  onSynthesisComplete?: (dossier: string) => void;
  onVerificationStart?: () => void;
  onVerificationComplete?: (score: number) => void;
}

const OR_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_TIMEOUT_MS = 30000; // 30 seconds per model

// Call OpenRouter API with timeout
async function callOpenRouter(
  modelId: string,
  messages: { role: string; content: string }[],
  timeoutMs: number = MODEL_TIMEOUT_MS
): Promise<string> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    throw new Error("OpenRouter API key missing. Add VITE_OPENROUTER_KEY in .env or save it in Settings.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OR_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://saathy.app",
        "X-Title": "Saathy Research"
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        max_tokens: 4096,
        temperature: 0.3,
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
}

// Execute a single model with timeout and error handling
async function executeModel(
  modelId: ModelId,
  prompt: string,
  callbacks?: PipelineCallbacks
): Promise<ModelResult> {
  const startTime = Date.now();
  const model = getModel(modelId);
  
  if (!model) {
    return {
      modelId,
      status: "error",
      error: "Model not found",
      duration: 0
    };
  }

  callbacks?.onModelStart?.(modelId);

  try {
    const messages = [
      { role: "system", content: prompt },
      { role: "user", content: prompt }
    ];

    const output = await callOpenRouter(model.backendId, messages);
    const duration = Date.now() - startTime;

    const result: ModelResult = {
      modelId,
      status: "done",
      output,
      duration
    };

    callbacks?.onModelComplete?.(modelId, result);
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMessage = error.message || "Unknown error";
    
    // Check for rate limit (429) - mark as skipped instead of error
    const status = errorMessage.includes("429") || errorMessage.includes("rate limit")
      ? "skipped"
      : errorMessage.includes("timeout")
      ? "timeout"
      : "error";

    const result: ModelResult = {
      modelId,
      status,
      error: errorMessage,
      duration
    };

    callbacks?.onModelError?.(modelId, errorMessage);
    return result;
  }
}

// Main pipeline execution
export async function executePipeline(
  mode: ResearchMode,
  context: PromptContext,
  enabledModels: ModelId[],
  callbacks?: PipelineCallbacks
): Promise<PipelineResult> {
  const modeConfig = MODE_CONFIGS[mode];
  const modelsToRun = enabledModels.length > 0 
    ? enabledModels.filter(id => modeConfig.modelIds.includes(id))
    : modeConfig.modelIds;

  if (modelsToRun.length === 0) {
    return {
      success: false,
      error: "No models enabled for this mode",
      modelResults: {} as Record<ModelId, ModelResult>
    };
  }

  const modelResults: Partial<Record<ModelId, ModelResult>> = {};
  let completedCount = 0;

  // Fire all models in parallel
  const modelPromises = modelsToRun.map(async (modelId) => {
    const model = getModel(modelId);
    if (!model) return null;

    const prompt = getModelPrompt(modelId, context);
    const result = await executeModel(modelId, prompt, callbacks);
    
    modelResults[modelId] = result;
    completedCount++;
    callbacks?.onProgress?.(completedCount, modelsToRun.length);
    
    return result;
  });

  // Wait for all models to complete (with fault tolerance)
  await Promise.allSettled(modelPromises);

  // Collect successful outputs
  const successfulOutputs: Partial<Record<ModelId, string>> = {};
  Object.entries(modelResults).forEach(([id, result]) => {
    if (result.status === "done" && result.output) {
      successfulOutputs[id as ModelId] = result.output;
    }
  });

  // If no models succeeded, return error
  if (Object.keys(successfulOutputs).length === 0) {
    return {
      success: false,
      error: "All models failed to complete",
      modelResults: modelResults as Record<ModelId, ModelResult>
    };
  }

  // Synthesis phase (if not normal mode)
  let dossier = "";
  let confidenceScore = 0;

  if (mode !== "normal" && Object.keys(successfulOutputs).length > 0) {
    callbacks?.onSynthesisStart?.();

    try {
      const outputsText = Object.entries(successfulOutputs)
        .map(([modelId, output]) => `MODEL ${modelId.toUpperCase()}:\n${output}`)
        .join("\n\n---\n\n");
      const synthPrompt = buildDossierSystemPrompt(mode, context.delegateForm);
      const synthOutput = await callOpenRouter(
        getModel("claude")?.backendId || "meta-llama/llama-3.3-70b-instruct:free",
        [
          { role: "system", content: synthPrompt },
          { role: "user", content: `RESEARCH QUERY: ${context.query}\n\nSPECIALIST OUTPUTS:\n${outputsText}` }
        ]
      );
      
      const validation = validateDossier(synthOutput);
      dossier = validation.ok
        ? synthOutput
        : await controlDossierWithGemini({
            raw: synthOutput,
            query: context.query,
            mode,
            delegateForm: context.delegateForm,
          });
      callbacks?.onSynthesisComplete?.(dossier);
    } catch (error: any) {
      // If synthesis fails, concatenate outputs as fallback
      dossier = Object.values(successfulOutputs).join("\n\n---\n\n");
    }

    // Verification phase
    callbacks?.onVerificationStart?.();
    try {
      const verifyPrompt = getModelPrompt("gemini", context, { dossierContent: dossier });
      const verifyOutput = await callOpenRouter(
        getModel("gemini")?.backendId || "google/gemini-2.0-flash-exp:free",
        [{ role: "system", content: verifyPrompt }, { role: "user", content: context.query }]
      );

      // Extract confidence score from verification output
      const scoreMatch = verifyOutput.match(/SCORE:\s*(\d+)/);
      confidenceScore = scoreMatch ? parseInt(scoreMatch[1]) : 75;

      callbacks?.onVerificationComplete?.(confidenceScore);
    } catch (error: any) {
      confidenceScore = 70; // Default score if verification fails
    }
  } else {
    // Normal mode - just return the first successful output
    dossier = Object.values(successfulOutputs)[0] || "";
  }

  return {
    success: true,
    dossier,
    modelResults: modelResults as Record<ModelId, ModelResult>,
    confidenceScore
  };
}

// Simple normal mode execution (2 models only)
export async function executeNormalMode(
  context: PromptContext,
  callbacks?: PipelineCallbacks
): Promise<PipelineResult> {
  return executePipeline("normal", context, ["gemini", "claude"], callbacks);
}
