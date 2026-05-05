import type { ModelConfig, ModelId, PipelineMode } from "@/types";
import { ALL_MODELS, MODE_CONFIGS, type ResearchMode } from "@/config/models";

// Convert models registry to ModelConfig format for backward compatibility
export const DEFAULT_MODEL_CONFIG: ModelConfig = Object.entries(ALL_MODELS).reduce((acc, [id, model]) => {
  acc[id as ModelId] = {
    name: model.displayName,
    enabled: !model.alwaysOn, // Extended models off by default, core models on by default
    role: model.role,
    color: model.color,
    creditsPerCall: 0,
    free: true,
    dailyLimit: model.dailyCap,
    accuracy: model.accuracy,
    alwaysOn: model.alwaysOn
  };
  return acc;
}, {} as ModelConfig);

const STORAGE_KEY = "saathy-model-config";

export function loadModelConfig(): ModelConfig {
  if (typeof localStorage === "undefined") return DEFAULT_MODEL_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MODEL_CONFIG;
    const parsed = JSON.parse(raw);
    const merged = { ...DEFAULT_MODEL_CONFIG };
    (Object.keys(merged) as ModelId[]).forEach((id) => {
      if (typeof parsed[id]?.enabled === "boolean") {
        merged[id] = { ...merged[id], enabled: parsed[id].enabled };
      }
    });
    merged.gemini.enabled = true;
    merged.claude.enabled = true;
    return merged;
  } catch {
    return DEFAULT_MODEL_CONFIG;
  }
}

export function saveModelConfig(cfg: ModelConfig) {
  if (typeof localStorage === "undefined") return;
  const slim = Object.fromEntries(
    (Object.keys(cfg) as ModelId[]).map((k) => [k, { enabled: cfg[k].enabled }])
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
}

// Mode meta — Updated for V1 with correct model counts
export const MODE_META: Record<PipelineMode, { label: string; badge: string; icon: string; accent: string }> = {
  normal:    { label: "Normal",      badge: "⚡ 2 models · fast chat · ~7s",              icon: "⚡", accent: "hsl(var(--brand-forest))" },
  webdive:   { label: "WebDive",     badge: "🌐 6 models · balanced research · ~15s",      icon: "🌐", accent: "hsl(var(--tier-2))" },
  deepdive:  { label: "DeepDive",    badge: "🔬 8 models · comprehensive · ~22s",        icon: "🔬", accent: "hsl(var(--brand-coral))" },
  allinlord: { label: "All-In-Lord", badge: "✦ 11 models · maximum power · ~35s",        icon: "✦", accent: "hsl(var(--brand-gold))" },
  dossier:   { label: "Dossier",     badge: "🎯 5 models · opposition research · ~15s",  icon: "🎯", accent: "hsl(0 84% 60%)" },
};

export const MODELS_BY_MODE: Record<PipelineMode, ModelId[]> = {
  normal:    MODE_CONFIGS.normal.modelIds as ModelId[],
  webdive:   MODE_CONFIGS.webdive.modelIds as ModelId[],
  deepdive:  MODE_CONFIGS.deepdive.modelIds as ModelId[],
  allinlord: MODE_CONFIGS.allinlord.modelIds as ModelId[],
  dossier:   MODE_CONFIGS.dossier.modelIds as ModelId[],
};
