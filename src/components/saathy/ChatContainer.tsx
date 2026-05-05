import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { NotebookPen } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Logo } from "./Logo";
import { useAppModeStore } from "@/store/useAppModeStore";
// credits store removed from UI — handlers no longer gate on credits
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";
import { handleFocusedMode, handleNormalMode, handleResearchMode } from "@/lib/apiCaller";
import { executePipeline, type PipelineCallbacks } from "@/lib/researchPipeline";
import { toast } from "sonner";
import { bucketFor, checkAndIncrementUsage, formatResetWindow, DAILY_CAPS } from "@/lib/usageLimits";
import type { Message, PipelineMode, PipelineStage, ModelConfig } from "@/types";
import type { ModelId } from "@/config/models";

const SUGGESTIONS: { label: string; appMode: "normal" | "research"; sub?: string }[] = [
  { label: "Brief me on my topic — start fresh", appMode: "normal" },
  { label: "Build my opening speech (90 seconds)", appMode: "research", sub: "speech" },
  { label: "Predict the 3 toughest counter-arguments", appMode: "research", sub: "counter" },
  { label: "ALL-IN: full multi-model research dossier", appMode: "research", sub: "pipeline" },
];

function briefString(form: any): string {
  if (!form) return "";
  const parts = [
    form.country && `Country: ${form.country}`,
    form.committee && `Committee: ${form.committee}`,
    form.topic && `Topic: ${form.topic}`,
    form.position && `Position: ${form.position}`,
  ].filter(Boolean);
  return parts.join(" · ");
}

export const ChatContainer = () => {
  const {
    getActiveUniverse, getActiveChat,
    addMessageToChat, updateStreamingMessage, updateMessageStages,
    updateMessageResearchStages, finalizeMessage, setDelegateFormOpen,
    openNotepad,
  } = useAppStore();

  const { appMode, subMode, pipelineFast } = useAppModeStore();

  const universe = getActiveUniverse();
  const chat = getActiveChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({} as ModelConfig);
  const [busy, setBusy] = useState(false);
  const [povLens, setPovLens] = useState<string>("");
  const [povOn, setPovOn] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat?.messages.length, chat?.messages[chat?.messages.length - 1]?.content]);

  if (!universe || !chat) return null;

  const brief = briefString(universe.delegateForm);

  // ── Universal AI message creator ──
  const newAssistant = (overrides: Partial<Message> = {}): Message => ({
    id: crypto.randomUUID(),
    role: "assistant",
    content: "",
    timestamp: Date.now(),
    isStreaming: true,
    ...overrides,
  });

  // ── NORMAL MODE handler ──
  const handleNormal = async (content: string) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content, timestamp: Date.now(), mode: "normal" };
    addMessageToChat(universe.id, chat.id, userMsg);
    const aiMsg = newAssistant({ mode: "normal", responseType: "general" });
    addMessageToChat(universe.id, chat.id, aiMsg);

    try {
      // Use apiCaller with automatic fallback
      const result = await handleNormalMode(content);
      
      updateStreamingMessage(universe.id, chat.id, aiMsg.id, result);
      finalizeMessage(universe.id, chat.id, aiMsg.id);
    } catch (error: any) {
      console.error("❌ Normal mode error:", error);
      const errorMsg = `**Error:** ${error.message || "Failed to get response"}`;
      updateStreamingMessage(universe.id, chat.id, aiMsg.id, errorMsg);
      finalizeMessage(universe.id, chat.id, aiMsg.id);
      toast.error(error.message || "Failed to get response");
    } finally {
      setBusy(false);
    }
  };

  // ── RESEARCH MODE handler ──
  const handleResearch = async (content: string) => {
    const heavyModes = new Set(["webdive", "deepdive", "dossier"]);
    const useDossierUx = heavyModes.has(subMode);
    const messageMode = subMode === "deepdive" ? "deepdive" : subMode === "dossier" ? "dossier" : "webdive";
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content, timestamp: Date.now(), mode: messageMode };
    addMessageToChat(universe.id, chat.id, userMsg);
    const aiMsg = newAssistant({
      mode: messageMode,
      responseType: "debate",
      content: useDossierUx
        ? `### Research Brief\n\n_Researching ${subMode} angle..._`
        : `_${subMode} mode..._`,
    });
    addMessageToChat(universe.id, chat.id, aiMsg);

    try {
      const result = useDossierUx
        ? await handleResearchMode(content, subMode, universe.delegateForm)
        : await handleFocusedMode(content, subMode, universe.delegateForm);
      updateStreamingMessage(universe.id, chat.id, aiMsg.id, result);
      finalizeMessage(universe.id, chat.id, aiMsg.id);
    } catch (error: any) {
      console.error("❌ Research error:", error);
      const errorMsg = `**Error:** ${error.message || "Failed to get response"}`;
      updateStreamingMessage(universe.id, chat.id, aiMsg.id, errorMsg);
      finalizeMessage(universe.id, chat.id, aiMsg.id);
      toast.error(error.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  // ── ALL-IN-LORD: Use apiCaller ──
  const handleLord = async (content: string) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content, timestamp: Date.now(), mode: "allinlord" };
    addMessageToChat(universe.id, chat.id, userMsg);

    const aiMsg = newAssistant({
      mode: "allinlord",
      responseType: "general",
      content: `### 👑 All-In-Lord Research\n\n_Processing…_\n`,
    });
    addMessageToChat(universe.id, chat.id, aiMsg);

    try {
      const result = await handleResearchMode(content, "lord", universe.delegateForm);
      updateStreamingMessage(universe.id, chat.id, aiMsg.id, result);
      finalizeMessage(universe.id, chat.id, aiMsg.id);
    } catch (error: any) {
      console.error("❌ Lord mode error:", error);
      updateStreamingMessage(universe.id, chat.id, aiMsg.id, `**Error:** ${error.message || "Failed"}`);
      finalizeMessage(universe.id, chat.id, aiMsg.id);
      toast.error(error.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  // ── Multi-model pipeline with streaming ──
  const runPipeline = async (content: string, mode: PipelineMode) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content, timestamp: Date.now(), mode };
    addMessageToChat(universe.id, chat.id, userMsg);

    const aiMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "_Researching..._",
      timestamp: Date.now(),
      mode,
      isStreaming: true,
    };
    addMessageToChat(universe.id, chat.id, aiMsg);

    // Get enabled model IDs from modelConfig
    const enabledModels = (Object.keys(modelConfig) as ModelId[]).filter(id => modelConfig[id]?.enabled);

    const callbacks: PipelineCallbacks = {
      onModelStart: (modelId) => {
        updateStreamingMessage(universe.id, chat.id, aiMsg.id, `_Running: ${modelId}_`);
      },
      onModelComplete: (modelId) => {
        console.log(`✅ Model ${modelId} completed`);
      },
      onModelError: (modelId, error) => {
        console.error(`❌ Model ${modelId} error:`, error);
      },
      onProgress: (completed, total) => {
        updateStreamingMessage(universe.id, chat.id, aiMsg.id, `_Progress: ${completed}/${total} models_`);
      },
      onSynthesisStart: () => {
        updateStreamingMessage(universe.id, chat.id, aiMsg.id, `_Synthesizing dossier..._`);
      },
      onSynthesisComplete: (dossier) => {
        updateStreamingMessage(universe.id, chat.id, aiMsg.id, dossier);
      },
      onVerificationStart: () => {
        console.log("Starting verification...");
      },
      onVerificationComplete: (score) => {
        console.log(`Verification complete: ${score}`);
      },
    };

    try {
      const result = await executePipeline(
        mode as any, // ResearchMode
        {
          query: content,
          delegateForm: universe.delegateForm,
        },
        enabledModels,
        callbacks
      );

      if (result.success && result.dossier) {
        updateStreamingMessage(universe.id, chat.id, aiMsg.id, result.dossier);
      } else {
        const errorMsg = `**Error:** ${result.error || "Pipeline failed"}`;
        updateStreamingMessage(universe.id, chat.id, aiMsg.id, errorMsg);
        toast.error(result.error || "Pipeline failed");
      }
      finalizeMessage(universe.id, chat.id, aiMsg.id);
    } catch (error: any) {
      console.error("❌ Pipeline error:", error);
      const errorMsg = `**Error:** ${error.message || "Pipeline failed"}`;
      updateStreamingMessage(universe.id, chat.id, aiMsg.id, errorMsg);
      finalizeMessage(universe.id, chat.id, aiMsg.id);
      toast.error(error.message || "Pipeline failed");
    } finally {
      setBusy(false);
    }
  };

  // ── Public handler used by InputBar ──
  const handleSend = async (content: string, _legacyMode: PipelineMode) => {
    if (busy) return;

    // Per-user daily cap (server-enforced).
    const bucket = bucketFor({ appMode, subMode });
    const usage = await checkAndIncrementUsage(bucket);
    if (!usage.allowed) {
      const labels: Record<string, string> = {
        normal: "Normal mode",
        websearch: "WebSearch mode",
        deepsearch: "DeepSearch mode",
        lord: "All-in-Lord mode",
      };
      toast.error(
        `${labels[bucket]} — daily limit reached`,
        {
          description: `Your daily limit for this mode has been reached. Please try again after ${formatResetWindow(usage.resetAt)}.`,
          duration: 7000,
        }
      );
      return;
    }
    // Show running tally only for capped non-Normal modes (Normal cap stays hidden until hit).
    if (bucket !== "normal") {
      const remaining = Math.max(0, usage.cap - usage.newCount);
      if (remaining <= 1) {
        toast(`${remaining} ${bucket} request${remaining === 1 ? "" : "s"} left today`, { duration: 4000 });
      }
    }

    setBusy(true);
    try {
      if (appMode === "normal") await handleNormal(content);
      else if (subMode === "pipeline") await runPipeline(content, pipelineFast ? "deepdive" : "allinlord");
      else if (subMode === "lord") await handleLord(content);
      else await handleResearch(content);
    } catch (e) {
      console.error("[v6] handleSend failed:", e);
      toast.error("Something went wrong. Try again.");
    } finally {
      // Hard guarantee: input is always re-enabled after a turn ends.
      setBusy(false);
    }
  };

  const isEmpty = chat.messages.length === 0;
  const country = universe.delegateForm?.country;
  const greeting = country
    ? `नमस्ते, ${country} delegate.`
    : "नमस्ते, delegate.";

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="hidden md:flex px-7 py-3 border-b border-border items-center justify-between bg-background/80 backdrop-blur gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-lg text-[hsl(var(--brand-forest))] leading-none truncate">
            {universe.name}
            <span className="text-muted-foreground font-sans text-sm font-normal mx-2">›</span>
            <span className="text-foreground/80 text-sm">{chat.title}</span>
          </h2>
          <p className="text-[10px] text-muted-foreground mt-1">
            {universe.briefed ? (
              <>Briefed · {universe.delegateForm?.country} · {universe.delegateForm?.committee}</>
            ) : "No brief set — output will be generic"}
          </p>
        </div>
        <button
          onClick={() => openNotepad(chat.id)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card hover:bg-[hsl(var(--bg-tertiary))] border border-border text-xs font-medium transition"
        >
          <NotebookPen className="w-4 h-4" />
          Notes
        </button>
      </header>

      <div className="md:hidden px-3 py-2.5 border-b border-border bg-background/85 backdrop-blur space-y-2">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate text-[hsl(var(--brand-forest))]">{universe.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{chat.title}</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-8 py-5 sm:py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {isEmpty && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-8 text-center">
              <div className="flex justify-center mb-5">
                <Logo size={56} withWordmark={false} />
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[hsl(var(--brand-forest))] mb-3 italic">{greeting}</h1>
              <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                I'm Saathy — your research partner for{" "}
                <span className="text-[hsl(var(--brand-forest))] font-medium">
                  {universe.delegateForm?.topic || universe.name}
                </span>
                . Cleaner prompts, sharper routing, and a calmer research flow.
              </p>

              <div className="grid sm:grid-cols-2 gap-2.5 mt-8 text-left">
                {SUGGESTIONS.map((s) => (
                  <motion.button
                    key={s.label}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const { setAppMode, setSubMode } = useAppModeStore.getState();
                      setAppMode(s.appMode);
                      if (s.sub) setSubMode(s.sub as any);
                      handleSend(s.label, "normal");
                    }}
                    className="p-4 rounded-xl bg-card border border-border hover:border-[hsl(var(--brand-sage))] hover:shadow-soft transition text-sm text-left"
                  >
                    <span className="text-[hsl(var(--brand-forest))] font-medium">→</span> {s.label}
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                      {s.appMode}{s.sub ? ` · ${s.sub}` : ""}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {chat.messages.map((m, index) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {/* Brief nudge - show after AI response if not briefed */}
          {!universe.briefed && chat.messages.filter(m => m.role === "assistant" && !m.isStreaming).length >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 sm:mx-0 p-4 rounded-xl border-l-2 border-[hsl(var(--brand-forest))] bg-card"
            >
              <p className="text-sm text-foreground mb-2">
                <span className="text-[hsl(var(--brand-forest))]">💡</span> Your output is generic. Fill your brief for 10x more targeted analysis.
              </p>
              <button
                onClick={() => setDelegateFormOpen(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-[hsl(var(--brand-forest))] text-white hover:bg-[hsl(var(--brand-forest))]/90 transition"
              >
                Add Brief →
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <InputBar
        onSend={handleSend}
        disabled={busy}
        briefedCountry={universe.delegateForm?.country}
        delegateForm={universe.delegateForm}
        onOpenBrief={() => setDelegateFormOpen(true)}
        modelConfig={modelConfig}
        onModelConfigChange={setModelConfig}
        povOn={povOn}
        povLens={povLens}
        onPovToggle={() => setPovOn((v) => !v)}
        onPovChange={setPovLens}
      />
    </div>
  );
};
