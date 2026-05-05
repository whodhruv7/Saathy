// Saathy V5 — The Model Arsenal
// 10 free-tier models across OpenRouter (8) + Groq (2).
// All limits are PER-MODEL daily — rotation across all 10 = ~2000 free req/day.

export type ModelTier = 1 | 2 | 3;
export type ModelProvider = "openrouter" | "groq";
export type ModelSpecialty =
  | "reasoning"
  | "data_analysis"
  | "agentic"
  | "general"
  | "productivity"
  | "legal"
  | "long_context"
  | "factual"
  | "speed"
  | "counter";

export interface ArsenalModel {
  key: string;             // local key
  id: string;              // provider model id
  name: string;
  provider: ModelProvider;
  tier: ModelTier;
  specialty: ModelSpecialty;
  strengths: string[];
  dailyLimit: number;
  speed: "ultrafast" | "fast" | "medium" | "slow";
  creditCost: number;
  color: string;           // hex (used in UI; we still keep design tokens for chrome)
  description: string;
}

export const MODEL_REGISTRY: Record<string, ArsenalModel> = {
  // ── TIER 1: REASONING KINGS ──
  deepseek_r1: {
    key: "deepseek_r1",
    id: "openai/gpt-oss-120b:free",
    name: "GPT OSS 120B",
    provider: "openrouter",
    tier: 1,
    specialty: "reasoning",
    strengths: ["chain-of-thought", "legal analysis", "fact verification", "complex arguments"],
    dailyLimit: 200,
    speed: "medium",
    creditCost: 3,
    color: "#3b82f6",
    description: "Best free reasoning model. Thinks step-by-step.",
  },
  qwen3_235b: {
    key: "qwen3_235b",
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    name: "Nemotron 3 Super",
    provider: "openrouter",
    tier: 1,
    specialty: "data_analysis",
    strengths: ["statistics", "multilingual", "long context", "data synthesis"],
    dailyLimit: 200,
    speed: "medium",
    creditCost: 3,
    color: "#8b5cf6",
    description: "Best for data analysis and international research.",
  },
  kimi_k2: {
    key: "kimi_k2",
    id: "z-ai/glm-4.5-air:free",
    name: "GLM 4.5 Air",
    provider: "openrouter",
    tier: 1,
    specialty: "agentic",
    strengths: ["web browsing", "multi-step research", "tool use", "document analysis"],
    dailyLimit: 200,
    speed: "medium",
    creditCost: 3,
    color: "#06b6d4",
    description: "Moonshot AI. Exceptional at agentic research tasks.",
  },

  // ── TIER 2: WORKHORSES ──
  llama_70b: {
    key: "llama_70b",
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B",
    provider: "openrouter",
    tier: 2,
    specialty: "general",
    strengths: ["rhetoric", "speech writing", "political analysis", "synthesis"],
    dailyLimit: 200,
    speed: "fast",
    creditCost: 2,
    color: "#10b981",
    description: "Meta AI. Best for speech writing and rhetoric.",
  },
  minimax_m2: {
    key: "minimax_m2",
    id: "openai/gpt-oss-20b:free",
    name: "GPT OSS 20B",
    provider: "openrouter",
    tier: 2,
    specialty: "productivity",
    strengths: ["structured output", "report writing", "document generation", "office tasks"],
    dailyLimit: 200,
    speed: "fast",
    creditCost: 2,
    color: "#f59e0b",
    description: "MiniMax. Best for structured reports and briefs.",
  },
  mistral_small: {
    key: "mistral_small",
    id: "google/gemma-3-12b-it:free",
    name: "Gemma 3 12B",
    provider: "openrouter",
    tier: 2,
    specialty: "legal",
    strengths: ["European law", "policy analysis", "structured reasoning", "multilingual"],
    dailyLimit: 200,
    speed: "fast",
    creditCost: 2,
    color: "#ef4444",
    description: "Mistral. Best for legal provisions and policy analysis.",
  },
  nemotron: {
    key: "nemotron",
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    name: "Nemotron 3 Super",
    provider: "openrouter",
    tier: 2,
    specialty: "long_context",
    strengths: ["262K context", "long documents", "comprehensive research", "STEM"],
    dailyLimit: 200,
    speed: "slow",
    creditCost: 2,
    color: "#84cc16",
    description: "NVIDIA. 262K context — reads entire bills and reports.",
  },
  gemma_27b: {
    key: "gemma_27b",
    id: "google/gemma-3-27b-it:free",
    name: "Gemma 3 27B",
    provider: "openrouter",
    tier: 2,
    specialty: "factual",
    strengths: ["factual accuracy", "concise answers", "structured output", "safety"],
    dailyLimit: 200,
    speed: "fast",
    creditCost: 2,
    color: "#f97316",
    description: "Google. Best factual accuracy for verification.",
  },

  // ── TIER 3: SPEED ──
  llama_8b_groq: {
    key: "llama_8b_groq",
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B (Groq)",
    provider: "groq",
    tier: 3,
    specialty: "speed",
    strengths: ["conversational", "quick factual", "ultra-fast"],
    dailyLimit: 14400,
    speed: "ultrafast",
    creditCost: 0,
    color: "#6b7280",
    description: "Ultra-fast. Used for Normal mode and simple queries.",
  },
  mixtral_groq: {
    key: "mixtral_groq",
    // Groq deprecated mixtral-8x7b — fall back to llama 70B versatile which is closest in capability.
    id: "llama-3.3-70b-versatile",
    name: "Llama 70B (Groq)",
    provider: "groq",
    tier: 3,
    specialty: "counter",
    strengths: ["rebuttal", "counter-arguments", "fast reasoning", "debate"],
    dailyLimit: 14400,
    speed: "ultrafast",
    creditCost: 1,
    color: "#a78bfa",
    description: "Groq inference. Instant Counter mode rebuttals.",
  },
};

export type ModelKey = keyof typeof MODEL_REGISTRY;

export const ALL_MODELS = Object.values(MODEL_REGISTRY);

// Pick best available given a specialty and current usage map.
export function pickBest(
  specialty: ModelSpecialty,
  getUsage: (key: string) => number,
  tierFilter?: ModelTier[]
): ArsenalModel {
  const candidates = ALL_MODELS.filter((m) => {
    if (tierFilter && !tierFilter.includes(m.tier)) return false;
    if (m.specialty === specialty) return true;
    return m.strengths.some((s) => s.toLowerCase().includes(specialty));
  });
  const pool = candidates.length > 0 ? candidates : ALL_MODELS;
  const sorted = [...pool].sort((a, b) => {
    const ua = getUsage(a.key);
    const ub = getUsage(b.key);
    const headroomA = ua < a.dailyLimit * 0.8;
    const headroomB = ub < b.dailyLimit * 0.8;
    if (headroomA && headroomB) return a.tier - b.tier;
    return ua - ub;
  });
  return sorted[0];
}

export function pickParallel(
  count: number,
  getUsage: (key: string) => number,
  tiers: ModelTier[] = [1, 2]
): ArsenalModel[] {
  return ALL_MODELS.filter((m) => tiers.includes(m.tier))
    .filter((m) => getUsage(m.key) < m.dailyLimit * 0.9)
    .sort((a, b) => getUsage(a.key) - getUsage(b.key))
    .slice(0, count);
}
