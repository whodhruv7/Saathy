import type {
  DelegateForm, ModelConfig, ModelId, PipelineMode, ResearchStageStatus, StageStatus,
} from "@/types";
import { canMakePipelineCall, decrementQuota } from "./rateLimiter";
import { getSession } from "./supabaseAuth";
import { summarizeWithGroq } from "./saathyPipeline";

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pipeline`;

export interface StreamPipelineParams {
  query: string;
  mode: PipelineMode;
  delegateForm?: Partial<DelegateForm> | null;
  modelConfig: ModelConfig;
  chatHistory: { role: "user" | "assistant"; content: string }[];
  povLens?: string | null;
  onStage: (id: ModelId, status: StageStatus, label?: string) => void;
  onResearchStage?: (n: number, status: ResearchStageStatus, message?: string) => void;
  onText: (chunk: string) => void;
  onMeta?: (meta: Record<string, unknown>) => void;
  onQuickInsights?: (insights: string[]) => void;
  onDone: (modelsUsed: ModelId[]) => void;
  onError: (msg: string) => void;
}

export async function streamPipeline(p: StreamPipelineParams) {
  console.log("🚀 PIPELINE START", { query: p.query?.slice(0, 50), mode: p.mode });
  
  try {
    // Get current user for rate limiting
    const session = getSession();
    if (!session?.user?.email) {
      console.error("❌ No user session");
      return p.onError("Please sign in to use the pipeline");
    }
    const email = session.user.email;
    console.log("👤 User:", email);

    // Check quota before making pipeline call
    const { allowed, reason } = await canMakePipelineCall(email, p.mode);
    console.log("💳 Quota check:", { allowed, reason });
    if (!allowed) {
      return p.onError(reason || "Query limit reached for today");
    }

    console.log("📡 Calling edge function:", URL);
    const resp = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        query: p.query,
        mode: p.mode,
        delegateForm: p.delegateForm,
        modelConfig: p.modelConfig,
        chatHistory: p.chatHistory,
        povLens: p.povLens || null,
      }),
    });

    console.log("📥 Response status:", resp.status, resp.statusText);

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => "Unknown error");
      console.error("❌ HTTP Error:", resp.status, errorText);
      if (resp.status === 429) return p.onError("Rate limit hit. Try again in a moment.");
      if (resp.status === 402) return p.onError("AI credits exhausted. Add credits in workspace settings.");
      if (resp.status === 500) return p.onError(`Server error: ${errorText.slice(0, 100)}`);
      return p.onError(`Pipeline error (${resp.status}): ${errorText.slice(0, 100)}`);
    }
    if (!resp.body) return p.onError("No response stream.");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let done = false;
    let modelsUsed: ModelId[] = [];

    while (!done) {
      const { done: d, value } = await reader.read();
      if (d) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line || line.startsWith(":")) continue;
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") {
          done = true;
          break;
        }
        try {
          const parsed = JSON.parse(json);
          if (parsed.event === "stage") {
            p.onStage(parsed.id as ModelId, parsed.status as StageStatus, parsed.label);
          } else if (parsed.event === "rstage") {
            p.onResearchStage?.(parsed.n as number, parsed.status as ResearchStageStatus, parsed.message);
          } else if (parsed.event === "meta") {
            const { event: _e, ...rest } = parsed;
            p.onMeta?.(rest);
          } else if (parsed.event === "qi" && Array.isArray(parsed.insights)) {
            p.onQuickInsights?.(parsed.insights);
          } else if (parsed.event === "text" && parsed.text) {
            p.onText(parsed.text);
          } else if (parsed.event === "done") {
            modelsUsed = parsed.modelsUsed || [];
          } else if (parsed.event === "error") {
            p.onError(parsed.message || "Pipeline error");
          }
        } catch {
          buf = line + "\n" + buf;
          break;
        }
      }
    }
    console.log("✅ Pipeline complete. Models used:", modelsUsed);
    p.onDone(modelsUsed);
    
    // Decrement quota after successful completion
    const sessionAfter = getSession();
    if (sessionAfter?.user?.email) {
      await decrementQuota(sessionAfter.user.email, p.mode);
    }
  } catch (e) {
    console.error("💥 Pipeline EXCEPTION:", e);
    p.onError(e instanceof Error ? e.message : "Stream failed");
  }
}

export async function streamMergeNotes(params: {
  universeName: string;
  notes: { title: string; notes: string }[];
  onText: (chunk: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  try {
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/merge-notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ universeName: params.universeName, notes: params.notes }),
    });
    if (!resp.ok || !resp.body) {
      if (resp.status === 429) return params.onError("Rate limit hit.");
      if (resp.status === 402) return params.onError("AI credits exhausted.");
      return params.onError("Merge failed.");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let done = false;

    while (!done) {
      const { done: d, value } = await reader.read();
      if (d) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line || line.startsWith(":") || !line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") {
          done = true;
          break;
        }
        try {
          const parsed = JSON.parse(json);
          const c = parsed.choices?.[0]?.delta?.content;
          if (c) params.onText(c);
        } catch {
          buf = line + "\n" + buf;
          break;
        }
      }
    }
    params.onDone();
  } catch (e) {
    params.onError(e instanceof Error ? e.message : "Merge stream failed");
  }
}

export async function streamSummarize(params: {
  text: string;
  kind: "message" | "notes";
  title?: string;
  onText: (chunk: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  try {
    const summary = await summarizeWithGroq(params.text, params.kind, params.title);
    params.onText(summary);
    params.onDone();
    return;
  } catch (error) {
    console.warn("[Saathy] Groq summarizer fallback:", error);
  }

  try {
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ text: params.text, kind: params.kind, title: params.title }),
    });
    if (!resp.ok || !resp.body) {
      if (resp.status === 429) return params.onError("Rate limit hit.");
      if (resp.status === 402) return params.onError("AI credits exhausted.");
      return params.onError("Summarize failed.");
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let done = false;
    while (!done) {
      const { done: d, value } = await reader.read();
      if (d) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line || line.startsWith(":") || !line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") {
          done = true;
          break;
        }
        try {
          const parsed = JSON.parse(json);
          const c = parsed.choices?.[0]?.delta?.content;
          if (c) params.onText(c);
        } catch {
          buf = line + "\n" + buf;
          break;
        }
      }
    }
    params.onDone();
  } catch (e) {
    params.onError(e instanceof Error ? e.message : "Summarize stream failed");
  }
}
