import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, NotebookPen, Wand2, Loader2, Undo2, Timer } from "lucide-react";
import type { Message } from "@/types";
import { Logo } from "./Logo";
import { StructuredResponse } from "./StructuredResponse";
import { PipelineProgress } from "./PipelineProgress";
import { ResearchPipelineProgress } from "./ResearchPipelineProgress";
import { useAppStore } from "@/store/useAppStore";
import { streamSummarize } from "@/lib/streamPipeline";
import { toast } from "sonner";
import { SpeechTimer } from "./SpeechTimer";

const TypingDots = () => (
  <div className="flex gap-1.5 py-2">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-[hsl(var(--brand-sage))]"
        style={{ animation: `typing-bounce 1.2s ease-in-out ${i * 0.15}s infinite` }}
      />
    ))}
  </div>
);

export const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";
  const { getActiveChat, getActiveUniverse, updateChatNotes } = useAppStore();

  // Hooks must run before any early return.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (isUser || !message.isStreaming || !message.researchStartedAt) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [isUser, message.isStreaming, message.researchStartedAt]);
  const elapsedMs = message.researchStartedAt ? now - message.researchStartedAt : undefined;

  const saveToNotes = () => {
    const chat = getActiveChat();
    const universe = getActiveUniverse();
    if (!chat || !universe) return;
    const stamp = new Date().toLocaleString();
    const body = showSummary && summary ? summary : message.content;
    const tag = showSummary && summary ? "Summary" : "Saved";
    const addition = `\n\n--- ${tag} ${stamp} ---\n${body}\n`;
    updateChatNotes(universe.id, chat.id, (chat.notes || "") + addition);
    toast.success("Saved to chat notes");
  };

  const [summary, setSummary] = useState<string>("");
  const [showSummary, setShowSummary] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);

  const handleSummarize = async () => {
    if (summary) {
      setShowSummary(true);
      return;
    }
    setSummarizing(true);
    setShowSummary(true);
    let acc = "";
    await streamSummarize({
      text: message.content,
      kind: "message",
      onText: (c) => {
        acc += c;
        setSummary(acc);
      },
      onDone: () => setSummarizing(false),
      onError: (m) => {
        setSummarizing(false);
        setShowSummary(false);
        toast.error(m);
      },
    });
  };

  if (isUser) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end gap-2 sm:gap-3 group">
        <div className="max-w-[85%] sm:max-w-[78%]">
          <div className="bg-gradient-user text-primary-foreground px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl rounded-br-md shadow-soft">
            <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        </div>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[hsl(var(--bg-tertiary))] flex items-center justify-center shrink-0">
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[hsl(var(--ink-secondary))]" />
        </div>
      </motion.div>
    );
  }

  const displayContent = showSummary ? summary : message.content;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 sm:gap-3 group">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2D5F52] flex items-center justify-center shrink-0 shadow-soft overflow-hidden">
        <Logo size={20} withWordmark={false} />
      </div>
      <div className="max-w-[92%] sm:max-w-[88%] flex-1 min-w-0">
        {message.researchStages && message.researchStages.length > 0 && (
          <ResearchPipelineProgress stages={message.researchStages} elapsedMs={elapsedMs} />
        )}
        {(!message.researchStages || message.researchStages.length === 0) &&
          message.stages && message.stages.length > 0 && <PipelineProgress stages={message.stages} />}

        {message.content ? (
          <div className="bg-card rounded-2xl rounded-tl-md px-3.5 sm:px-5 py-3 sm:py-4 shadow-soft border border-border">
            {showSummary && (
              <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-wider text-[hsl(var(--brand-forest))] font-medium">
                <Wand2 className="w-3 h-3" />
                {summarizing ? "Summarizing…" : "Summary view"}
              </div>
            )}
            <StructuredResponse
              content={displayContent || (summarizing ? "_Generating summary…_" : "")}
              isStreaming={message.isStreaming || (showSummary && summarizing)}
            />
            {!message.isStreaming && (
              <div className="mt-3 pt-3 border-t border-border flex flex-wrap justify-end gap-3 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                {/* Speech Timer Button */}
                <button
                  onClick={() => setTimerOpen(true)}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-[hsl(var(--brand-forest))] transition"
                >
                  <Timer className="w-3 h-3" /> 90s Timer
                </button>
                {!showSummary ? (
                  <button
                    onClick={handleSummarize}
                    disabled={summarizing}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-[hsl(var(--brand-forest))] transition disabled:opacity-50"
                  >
                    {summarizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    {summary ? "Show summary" : "Summarize"}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSummary(false)}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-[hsl(var(--brand-forest))] transition"
                  >
                    <Undo2 className="w-3 h-3" /> Show original
                  </button>
                )}
                <button
                  onClick={saveToNotes}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-[hsl(var(--brand-forest))] transition"
                >
                  <NotebookPen className="w-3 h-3" /> Save {showSummary ? "summary " : ""}to notes
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card rounded-2xl rounded-tl-md px-4 sm:px-5 py-3 shadow-soft border border-border inline-block">
            <TypingDots />
          </div>
        )}
      </div>

      {/* Speech Timer Overlay */}
      <SpeechTimer isOpen={timerOpen} onClose={() => setTimerOpen(false)} />
    </motion.div>
  );
};
