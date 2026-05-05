// Saathy V5 — Client-side caller for or-call / groq-call edge functions.
// Picks candidates via ModelRotator and streams text back.

import { ALL_MODELS, MODEL_REGISTRY, pickBest, pickParallel, type ArsenalModel, type ModelSpecialty } from "@/lib/modelArsenal";
import { useModelUsageStore } from "@/store/useModelUsageStore";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PUB_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface StreamCallbacks {
  onModel?: (m: ArsenalModel) => void;
  onText: (chunk: string) => void;
  onDone: (modelKey: string | null) => void;
  onError: (msg: string) => void;
}

interface CallParams extends StreamCallbacks {
  specialty: ModelSpecialty;
  system: string;
  user: string;
  history?: { role: "user" | "assistant"; content: string }[];
  temperature?: number;
  maxTokens?: number;
  fallbackCount?: number;          // additional fallbacks beyond best (default 3)
  forceTier?: 1 | 2 | 3;
}

async function streamSse(
  url: string,
  body: unknown,
  cb: StreamCallbacks
): Promise<string | null> {
  let modelUsed: string | null = null;
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${PUB_KEY}` },
      body: JSON.stringify(body),
    });
    if (!resp.ok || !resp.body) {
      console.error(`[callSpecialist] HTTP ${resp.status}`);
      if (resp.status === 429) cb.onError("Rate limit hit. Try again in a moment.");
      else if (resp.status === 402) cb.onError("AI credits exhausted on the server.");
      else cb.onError("Model unavailable. Try again.");
      return null;
    }
    const reader = resp.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line || line.startsWith(":") || !line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") break;
        try {
          const parsed = JSON.parse(json);
          if (parsed.event === "text" && typeof parsed.text === "string") cb.onText(parsed.text);
          else if (parsed.event === "model") {
            const m = MODEL_REGISTRY[parsed.key];
            if (m) cb.onModel?.(m);
          } else if (parsed.event === "done") {
            modelUsed = parsed.modelUsed || null;
          } else if (parsed.event === "error") {
            cb.onError(parsed.message || "Model error");
          }
        } catch {
          buf = line + "\n" + buf;
          break;
        }
      }
    }
  } catch (e) {
    console.error("[callSpecialist] stream failed:", e);
    cb.onError("Network hiccup. Try again.");
  }
  return modelUsed;
}

// Public: call any specialty with smart rotation.
export async function callSpecialist(p: CallParams) {
  const usage = useModelUsageStore.getState();
  const getU = (k: string) => usage.get(k);

  // For specialty=speed → Groq path
  if (p.forceTier === 3 || p.specialty === "speed" || p.specialty === "counter") {
    const model = pickBest(p.specialty, getU, [3]);
    const body = {
      modelId: model.id,
      modelKey: model.key,
      modelName: model.name,
      system: p.system,
      user: p.user,
      history: p.history,
      temperature: p.temperature,
      maxTokens: p.maxTokens,
    };
    const used = await streamSse(`${SUPABASE_URL}/functions/v1/groq-call`, body, {
      onModel: (m) => { p.onModel?.(m); usage.record(m.key); },
      onText: p.onText,
      onDone: (k) => p.onDone(k || model.key),
      onError: p.onError,
    });
    return used;
  }

  // OpenRouter path: best + fallbacks
  const tiers = p.forceTier ? [p.forceTier] : [1, 2];
  const primary = pickBest(p.specialty, getU, tiers as (1 | 2 | 3)[]);
  const fallbacks = ALL_MODELS
    .filter((m) => m.key !== primary.key && tiers.includes(m.tier))
    .filter((m) => getU(m.key) < m.dailyLimit * 0.95)
    .sort((a, b) => getU(a.key) - getU(b.key))
    .slice(0, p.fallbackCount ?? 3);
  const candidates = [primary, ...fallbacks].map((m) => ({ key: m.key, id: m.id, name: m.name }));

  const used = await streamSse(`${SUPABASE_URL}/functions/v1/or-call`, {
    candidates,
    system: p.system,
    user: p.user,
    history: p.history,
    temperature: p.temperature,
    maxTokens: p.maxTokens,
  }, {
    onModel: (m) => { p.onModel?.(m); usage.record(m.key); },
    onText: p.onText,
    onDone: p.onDone,
    onError: p.onError,
  });
  return used;
}

export { pickBest, pickParallel };
