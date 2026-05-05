import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, NotebookPen, Wand2, Undo2, Loader2, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAppStore } from "@/store/useAppStore";
import { streamSummarize } from "@/lib/streamPipeline";
import { toast } from "sonner";

export const NotePadPanel = () => {
  const { notepadOpenForChatId, openNotepad, universes, updateChatNotes } = useAppStore();

  const found = (() => {
    if (!notepadOpenForChatId) return null;
    for (const u of universes) {
      const c = (u.chats || []).find((x) => x.id === notepadOpenForChatId);
      if (c) return { universeId: u.id, chat: c };
    }
    return null;
  })();

  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (found) {
      setText(found.chat.notes || "");
      setSummary("");
      setShowSummary(false);
      setSummarizing(false);
    }
  }, [found?.chat.id]);

  useEffect(() => {
    if (!found || showSummary) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateChatNotes(found.universeId, found.chat.id, text);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, showSummary]);

  const handleSummarize = async () => {
    if (!text.trim()) {
      toast.error("Notes are empty");
      return;
    }
    if (summary) {
      setShowSummary(true);
      return;
    }
    setSummarizing(true);
    setShowSummary(true);
    let acc = "";
    await streamSummarize({
      text,
      kind: "notes",
      title: found?.chat.title,
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

  const replaceWithSummary = () => {
    if (!found || !summary) return;
    setText(summary);
    updateChatNotes(found.universeId, found.chat.id, summary);
    setShowSummary(false);
    toast.success("Notes replaced with summary");
  };

  return (
    <AnimatePresence>
      {found && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm flex justify-end"
          onClick={() => openNotepad(null)}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-card h-full shadow-elevated flex flex-col"
          >
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[hsl(var(--bg-tertiary))] flex items-center justify-center shrink-0">
                  <NotebookPen className="w-4 h-4 text-[hsl(var(--brand-forest))]" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif text-xl text-[hsl(var(--brand-forest))] leading-none truncate">
                    {found.chat.title} — Notes
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {showSummary ? "Summary view — read only" : "Auto-saves as you type."}
                  </p>
                </div>
              </div>
              <button onClick={() => openNotepad(null)} className="p-2 rounded-lg hover:bg-muted transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-2.5 border-b border-border flex flex-wrap items-center gap-2 bg-[hsl(var(--bg-secondary))]">
              {!showSummary ? (
                <button
                  onClick={handleSummarize}
                  disabled={summarizing || !text.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-hero text-primary-foreground text-xs shadow-soft disabled:opacity-50"
                >
                  {summarizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  {summary ? "Show summary" : "Summarize all notes"}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowSummary(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-muted text-xs transition"
                  >
                    <Undo2 className="w-3 h-3" /> Back to original
                  </button>
                  <button
                    onClick={replaceWithSummary}
                    disabled={summarizing || !summary}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-hero text-primary-foreground text-xs shadow-soft disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" /> Replace notes with summary
                  </button>
                </>
              )}
              {summarizing && (
                <span className="text-[11px] text-muted-foreground ml-auto">Generating…</span>
              )}
            </div>

            {showSummary ? (
              <div className="flex-1 overflow-y-auto px-6 py-5 saathy-prose text-[14px]">
                <ReactMarkdown>{summary || "_Summarizing…_"}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Drop quotes, citations, half-formed arguments, anything you want to remember…"
                className="flex-1 w-full px-6 py-5 bg-card resize-none outline-none text-[15px] leading-relaxed font-mono"
              />
            )}

            <div className="px-6 py-3 border-t border-border text-xs text-muted-foreground flex justify-between items-center bg-[hsl(var(--bg-secondary))]">
              <span>
                {(showSummary ? summary : text).split(/\s+/).filter(Boolean).length} words
              </span>
              <span>{(showSummary ? summary : text).length} chars</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

