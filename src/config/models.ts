// This is your SINGLE SOURCE OF TRUTH for all models
// If PipelineSheet.tsx says "Model config missing" it's because this file doesn't exist or is incomplete

export type ModelId =
  | 'kimi'
  | 'glm'
  | 'qwen'
  | 'deepseek'
  | 'nemotron'
  | 'gemini'
  | 'claude'
  | 'mistral'
  | 'phi3'
  | 'qwenCoder'
  | 'yi'
  | 'solar'
  | 'minimax'
  | 'zephyr';

export type ResearchMode = 'normal' | 'webdive' | 'deepdive' | 'allinlord' | 'dossier';

export interface ModelMetadata {
  id: ModelId;
  displayName: string;
  backendId: string;
  color: string;
  role: string;
  description: string;
  accuracy: number;
  dailyCap: number;
  alwaysOn: boolean;
  caption: string;
}

export const MODEL_REGISTRY: Record<ModelId, ModelMetadata> = {
  kimi: {
    id: 'kimi',
    displayName: 'DeepSeek R1',
    backendId: 'deepseek/deepseek-r1:free',
    color: '#3B82F6',
    role: 'Hard-fact miner',
    description: 'Treaties, UN reports, gov data, stats, India angles, 2023–25 news',
    accuracy: 94,
    dailyCap: 500,
    alwaysOn: false,
    caption: 'Mining treaties, peer-reviewed studies, gov reports…',
  },
  glm: {
    id: 'glm',
    displayName: 'DeepSeek V3',
    backendId: 'deepseek/deepseek-chat:free',
    color: '#1E3A5F',
    role: 'Argument architect',
    description: 'CLAIM → WARRANT → EVIDENCE → IMPACT chains, speech-ready quotables',
    accuracy: 92,
    dailyCap: 500,
    alwaysOn: false,
    caption: 'Building argument chains, extracting quotables…',
  },
  qwen: {
    id: 'qwen',
    displayName: 'Llama 3.3 70B',
    backendId: 'meta-llama/llama-3.3-70b-instruct:free',
    color: '#7C3AED',
    role: 'Red-team / opposition',
    description: 'Stress-tests position, surfaces opposition blocs, rebuttals, blind angles',
    accuracy: 88,
    dailyCap: 200,
    alwaysOn: false,
    caption: 'Red-teaming: opposition blocs, rebuttals, blind angles…',
  },
  deepseek: {
    id: 'deepseek',
    displayName: 'Gemini 2.0 Flash Thinking',
    backendId: 'google/gemini-2.0-flash-thinking-exp:free',
    color: '#059669',
    role: 'Gap-filler / rhetorical architect',
    description: 'Fills holes, repairs inconsistencies, structured outputs',
    accuracy: 90,
    dailyCap: 800,
    alwaysOn: false,
    caption: 'Filling gaps, repairing inconsistencies…',
  },
  nemotron: {
    id: 'nemotron',
    displayName: 'Nemotron 70B',
    backendId: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
    color: '#F97316',
    role: 'PhD-depth analyst',
    description: 'Root causes, mechanisms, second-order effects',
    accuracy: 89,
    dailyCap: 600,
    alwaysOn: false,
    caption: 'PhD-depth analysis: root causes, second-order effects…',
  },
  gemini: {
    id: 'gemini',
    displayName: 'Gemini 2.0 Flash',
    backendId: 'google/gemini-2.0-flash-exp:free',
    color: '#06B6D4',
    role: 'Fact verifier',
    description: 'Tier-grades sources, scores confidence, flags weak claims',
    accuracy: 87,
    dailyCap: 2000,
    alwaysOn: true,
    caption: 'Verifying claims, tier-grading sources…',
  },
  claude: {
    id: 'claude',
    displayName: 'Llama 3.3 70B (Synth)',
    backendId: 'meta-llama/llama-3.3-70b-instruct:free',
    color: '#84CC16',
    role: 'Final synthesiser',
    description: 'Composes the final dossier the user reads',
    accuracy: 92,
    dailyCap: 400,
    alwaysOn: true,
    caption: 'Composing structured dossier…',
  },
  // EXTENDED MODELS (off by default)
  mistral: {
    id: 'mistral',
    displayName: 'Mistral Large',
    backendId: 'mistralai/mistral-7b-instruct:free',
    color: '#6366F1',
    role: 'European policy specialist',
    description: 'International law, multilingual research',
    accuracy: 86,
    dailyCap: 1000,
    alwaysOn: false,
    caption: 'Analyzing European policy angles…',
  },
  phi3: {
    id: 'phi3',
    displayName: 'Phi-4',
    backendId: 'microsoft/phi-4:free',
    color: '#3B82F6',
    role: 'Compact reasoner',
    description: 'Quick extraction, tight reasoning',
    accuracy: 84,
    dailyCap: 1500,
    alwaysOn: false,
    caption: 'Quick fact extraction…',
  },
  qwenCoder: {
    id: 'qwenCoder',
    displayName: 'Qwen 2.5 Coder',
    backendId: 'qwen/qwen-2.5-coder-32b-instruct:free',
    color: '#A855F7',
    role: 'Structured data specialist',
    description: 'JSON outputs, tabular evidence',
    accuracy: 88,
    dailyCap: 600,
    alwaysOn: false,
    caption: 'Structuring data into tables…',
  },
  yi: {
    id: 'yi',
    displayName: 'Yi 1.5 34B',
    backendId: '01-ai/yi-1.5-34b-chat:free',
    color: '#22C55E',
    role: 'Bilingual researcher',
    description: 'Asia context, ASEAN angles, multilingual',
    accuracy: 86,
    dailyCap: 500,
    alwaysOn: false,
    caption: 'Researching Asian policy angles…',
  },
  solar: {
    id: 'solar',
    displayName: 'Llama 3.1 405B',
    backendId: 'meta-llama/llama-3.1-405b-instruct:free',
    color: '#F59E0B',
    role: 'Maximum context specialist',
    description: 'Complex multi-hop reasoning',
    accuracy: 91,
    dailyCap: 100,
    alwaysOn: false,
    caption: 'Deep reasoning across complex topics…',
  },
  minimax: {
    id: 'minimax',
    displayName: 'Qwen 2.5 72B',
    backendId: 'qwen/qwen-2.5-72b-instruct:free',
    color: '#14B8A6',
    role: 'Multilingual analyst',
    description: 'Chinese/Asian policy research',
    accuracy: 90,
    dailyCap: 300,
    alwaysOn: false,
    caption: 'Analyzing multilingual policy…',
  },
  zephyr: {
    id: 'zephyr',
    displayName: 'HuggingFace Zephyr',
    backendId: 'huggingfaceh4/zephyr-7b-beta:free',
    color: '#10B981',
    role: 'Quick assistant',
    description: 'Fast responses, general purpose',
    accuracy: 82,
    dailyCap: 2000,
    alwaysOn: false,
    caption: 'Quick analysis…',
  },
};

const MODE_MODEL_IDS: Record<ResearchMode, ModelId[]> = {
  normal: ['gemini', 'claude'],
  webdive: ['kimi', 'glm', 'qwen', 'deepseek', 'gemini', 'claude'],
  deepdive: ['kimi', 'glm', 'qwen', 'deepseek', 'nemotron', 'gemini', 'claude'],
  allinlord: [
    'kimi',
    'glm',
    'qwen',
    'deepseek',
    'nemotron',
    'mistral',
    'solar',
    'yi',
    'gemini',
    'claude',
  ],
  dossier: ['kimi', 'deepseek', 'gemini', 'claude'],
};

// Backward-compatible exports used by older pipeline and UI modules.
export const ALL_MODELS = MODEL_REGISTRY;

export const MODE_CONFIGS = {
  normal: { id: 'normal', modelIds: MODE_MODEL_IDS.normal },
  webdive: { id: 'webdive', modelIds: MODE_MODEL_IDS.webdive },
  deepdive: { id: 'deepdive', modelIds: MODE_MODEL_IDS.deepdive },
  allinlord: { id: 'allinlord', modelIds: MODE_MODEL_IDS.allinlord },
  dossier: { id: 'dossier', modelIds: MODE_MODEL_IDS.dossier },
  NORMAL: MODE_MODEL_IDS.normal,
  WEBDIVE: MODE_MODEL_IDS.webdive,
  DEEPDIVE: MODE_MODEL_IDS.deepdive,
  ALL_IN_LORD: MODE_MODEL_IDS.allinlord,
  DOSSIER: MODE_MODEL_IDS.dossier,
} as const;

export const getModelConfig = (modelId: string) => {
  const config = MODEL_REGISTRY[modelId as keyof typeof MODEL_REGISTRY];
  if (!config) {
    console.error(`[Models] Config missing for ${modelId}`);
    return null;
  }
  return config;
};

export const getModel = getModelConfig;
