import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, FileText, Wand2, Loader2, Eye, SlidersHorizontal } from "lucide-react";
import type { PipelineMode, ModelConfig, DelegateForm } from "@/types";

import { AppModeSelector } from "./AppModeSelector";
import { ResearchSubModeBar } from "./ResearchSubModeBar";
import { PipelineSheet } from "./PipelineSheet";
import { useAppModeStore } from "@/store/useAppModeStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { enhancePrompt } from "@/lib/saathyPipeline";

interface Props {
  onSend: (content: string, mode: PipelineMode) => void;
  disabled?: boolean;
  briefedCountry?: string;
  delegateForm?: Partial<DelegateForm> | null;
  onOpenBrief: () => void;
  modelConfig: ModelConfig;
  onModelConfigChange: (cfg: ModelConfig) => void;
  povOn?: boolean;
  povLens?: string;
  onPovToggle?: () => void;
  onPovChange?: (v: string) => void;
}

export const InputBar = ({
  onSend,
  disabled,
  briefedCountry,
  delegateForm,
  onOpenBrief,
  modelConfig,
  onModelConfigChange,
  povOn = false,
  povLens = "",
  onPovToggle,
  onPovChange,
}: Props) => {
  const [text, setText] = useState("");
  const { appMode, subMode, pipelineFast } = useAppModeStore();
  const [enhancing, setEnhancing] = useState(false);
  const [pipelineSheetOpen, setPipelineSheetOpen] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const inPipeline = appMode === "research" && subMode === "pipeline";

  // Only open Pipeline sheet on explicit user click, not automatically
  useEffect(() => {
    if (inPipeline && pipelineSheetOpen) {
      // Keep it open if user clicked it
    } else if (!inPipeline) {
      setPipelineSheetOpen(false);
    }
  }, [inPipeline]);


  const placeholder =
    appMode === "normal"
      ? "Ask anything — chat, debate help, quick facts…"
      : subMode === "dossier"
        ? "Name of opponent country or delegate (e.g., 'China' or 'Delegate from Brazil')..."
        : inPipeline
          ? "Pipeline — enter topic for the full multi-stage research dossier…"
          : `Research · ${subMode} — enter topic, target, or argument…`;

  const hint =
    appMode === "normal"
      ? "Normal · 2 models · ~7s"
      : subMode === "target"
        ? "Target · Kimi K2 + DeepSeek V3"
        : subMode === "counter"
          ? "Counter · Qwen 3 + Nemotron 70B"
          : subMode === "speech"
            ? "Speech · Claude Sonnet 3.5"
            : subMode === "deepdive"
              ? "DeepDive · 8 models · ~22s"
              : subMode === "webdive"
                ? "WebDive · 6 models · ~15s"
                : subMode === "lord"
                  ? "All-In-Lord · 11 models · ~35s"
                  : subMode === "dossier"
                    ? "Intel · 5 models · ~15s"
                    : pipelineFast
                      ? "Pipeline · Fast · ~15s"
                      : "Pipeline · Full · ~40s";

  const enhance = async () => {
    if (!text.trim() || enhancing || disabled) return;
    setEnhancing(true);
    try {
      const enhanced = await enhancePrompt(text.trim(), delegateForm);
      setText(enhanced);
      if (ref.current) {
        ref.current.style.height = "auto";
        ref.current.style.height = Math.min(ref.current.scrollHeight, 200) + "px";
      }
      toast.success("Prompt sharpened");
    } catch {
      toast.error("Enhancer failed.");
    } finally {
      setEnhancing(false);
    }
  };

  const submit = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim(), "normal");
    setText("");
    if (ref.current) ref.current.style.height = "auto";
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="px-4 pb-4 pt-2 border-t border-border bg-background/95 backdrop-blur">
      <div className="max-w-3xl mx-auto space-y-2.5">
        {/* Mode tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <AppModeSelector compact />
          {inPipeline && (
            <button
              onClick={() => setPipelineSheetOpen(true)}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border border-[hsl(var(--brand-sage))] bg-[hsl(var(--brand-sage))/0.12] text-[hsl(var(--brand-forest))] hover:bg-[hsl(var(--brand-sage))/0.2] transition"
            >
              <SlidersHorizontal className="w-3 h-3" />
              Configure models · {pipelineFast ? "Fast" : "Full"}
            </button>
          )}
        </div>

        {/* Research sub-modes */}
        {appMode === "research" && (
          <div className="min-w-0">
            <ResearchSubModeBar />
          </div>
        )}

        {/* Unified Pipeline bottom sheet */}
        <PipelineSheet
          open={pipelineSheetOpen}
          onOpenChange={setPipelineSheetOpen}
          config={modelConfig}
          onChange={onModelConfigChange}
        />


        {/* POV row — research + pipeline only */}
        {onPovToggle && appMode !== "normal" && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onPovToggle}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition",
                povOn
                  ? "bg-[hsl(258_60%_60%)/0.15] text-[hsl(258_60%_45%)] border-[hsl(258_60%_60%)/0.4]"
                  : "bg-card border-border text-muted-foreground hover:border-[hsl(258_60%_60%)/0.5]"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              POV {povOn ? "ON" : "OFF"}
            </button>
            <AnimatePresence>
              {povOn && (
                <motion.input
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 280 }}
                  exit={{ opacity: 0, width: 0 }}
                  value={povLens}
                  onChange={(e) => onPovChange?.(e.target.value)}
                  placeholder="Frame through whose lens? (e.g., Shashi Tharoor)"
                  className="text-xs px-3 py-1.5 rounded-full bg-card border border-[hsl(258_60%_60%)/0.4] outline-none focus:border-[hsl(258_60%_60%)] placeholder:text-muted-foreground"
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Composer */}
        <div className="bg-card border border-border rounded-[24px] shadow-soft hover:shadow-elevated transition-shadow flex items-end gap-2 p-2 focus-within:border-[hsl(var(--brand-forest))] focus-within:shadow-glow">
          <button
            onClick={onOpenBrief}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-[hsl(var(--bg-secondary))] hover:bg-[hsl(var(--bg-tertiary))] text-xs font-medium transition self-stretch border border-border/60"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="max-w-[120px] truncate">{briefedCountry || "Brief"}</span>
          </button>
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
            }}
            onKeyDown={onKey}
            placeholder={disabled ? "Saathy is thinking…" : placeholder}
            rows={1}
            disabled={disabled}
            style={{ pointerEvents: "auto" }}
            className="flex-1 bg-transparent resize-none outline-none text-[15px] py-2.5 placeholder:text-muted-foreground max-h-[200px] min-h-[44px] text-foreground disabled:opacity-60 disabled:cursor-wait relative z-10"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={enhance}
            disabled={!text.trim() || enhancing || disabled}
            title="Enhance prompt with AI"
            className="w-10 h-10 rounded-full bg-[hsl(var(--bg-secondary))] hover:bg-[hsl(var(--bg-tertiary))] text-[hsl(var(--brand-forest))] flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 border border-border"
          >
            {enhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={submit}
            disabled={!text.trim() || disabled}
            className="w-10 h-10 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center shadow-soft disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* Hint */}
        <p className="text-[11px] text-muted-foreground text-center">{hint}</p>
      </div>
    </div>
  );
};
