export type UniverseType = "mun" | "yuva" | "policy" | "ld" | "pf" | "general";

export type ActionType =
  | "research"
  | "counter_args"
  | "find_gaps"
  | "strengthen"
  | "summarize"
  | "stakeholder_map";

export type PipelineMode = "normal" | "webdive" | "deepdive" | "allinlord" | "dossier";

export type ModelId =
  | "kimi"
  | "glm"
  | "qwen"
  | "deepseek"
  | "nemotron"
  | "gemini"
  | "claude"
  | "mistral"
  | "phi3"
  | "qwenCoder"
  | "yi"
  | "solar"
  | "minimax"
  | "zephyr";

export type StageStatus = "pending" | "running" | "done" | "error" | "skipped";

export interface PipelineStage {
  id: ModelId;
  status: StageStatus;
  label?: string;
}

export type ResearchStageStatus = "waiting" | "running" | "done" | "error" | "skipped";
export interface ResearchStage {
  n: number;
  status: ResearchStageStatus;
  message?: string;
}

export interface DelegateForm {
  // V3 simplified core
  country: string;
  committee: string;
  topic: string;
  position: string;
  opponent: string;
  ally: string;
  chair: string;
  // Legacy (kept for backwards compat)
  fullName?: string;
  conference?: string;
  blocAlignment?: string;
  keyArguments?: string;
  evidenceHeld?: string;
  knowledgeGaps?: string;
  expectedCounterArgs?: string;
  opposingEntities?: string;
  outputStyle?: "structured" | "speech" | "brief";
  framework?: UniverseType;
}

export type ResponseType = "conversational" | "factual" | "general" | "debate";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  action?: ActionType;
  mode?: PipelineMode;
  isStreaming?: boolean;
  stages?: PipelineStage[];
  researchStages?: ResearchStage[];
  researchStartedAt?: number;
  modelsUsed?: ModelId[];
  povLens?: string | null;
  responseType?: ResponseType;
  quickInsights?: string[];
  followups?: { question: string; answer: string }[];
}

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  lastActive: number;
  messages: Message[];
  notes: string;
}

export interface Universe {
  id: string;
  name: string;
  type: UniverseType;
  createdAt: number;
  lastActive: number;
  briefed: boolean;
  delegateForm: Partial<DelegateForm> | null;
  chats: Chat[];
  activeChatId: string | null;
  notes: string;
  // Legacy field — older state may still have a flat messages array
  messages?: Message[];
}

export interface ModelConfigEntry {
  name: string;
  enabled: boolean;
  role: string;
  color: string;
  alwaysOn?: boolean;
  creditsPerCall: number;
  free: boolean;
  /** Approx free-tier requests per day surfaced in the UI */
  dailyLimit?: number;
  /** 0–100 quality score surfaced in the UI */
  accuracy?: number;
}

export type ModelConfig = Record<ModelId, ModelConfigEntry>;
