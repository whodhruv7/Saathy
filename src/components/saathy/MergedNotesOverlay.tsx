import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Save, Loader2, Layers } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAppStore } from "@/store/useAppStore";
import { streamMergeNotes } from "@/lib/streamPipeline";
import { toast } from "sonner";

export const MergedNotesOverlay = () => {
  const { mergeOverlayUniverseId, openMergeOverlay, universes, updateUniverseNotes } = useAppStore();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const startedRef = useRef<string | null>(null);

  const universe = universes.find((u) => u.id === mergeOverlayUniverseId);

  useEffect(() => {
    if (!universe) {
      setText("");
      setLoading(false);
      startedRef.current = null;
      return;
    }
    if (startedRef.current === universe.id) return;
    startedRef.current = universe.id;

    const notes = (universe.chats || [])
      .map((c) => ({ title: c.title, notes: c.notes || "" }))
      .filter((n) => n.notes.trim().length > 0);

    if (notes.length === 0) {
      setText("_No chat notes to merge yet. Save messages to notes from individual chats first._");
      return;
    }

    setText("");
    setLoading(true);
    let acc = "";
    streamMergeNotes({
      universeName: universe.name,
      notes,
      onText: (chunk) => {
        acc += chunk;
        setText(acc);
      },
      onDone: () => setLoading(false),
      onError: (msg) => {
        setLoading(false);
        toast.error(msg);
      },
    });
  }, [universe?.id]);

  const copy = () => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };
  const saveToUniverse = () => {
    if (!universe) return;
    updateUniverseNotes(universe.id, text);
    toast.success("Saved as universe notes");
  };

  return (
    <AnimatePresence>
      {universe && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          <div className="px-7 py-5 border-b border-border flex items-center justify-between bg-[hsl(var(--bg-secondary))]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-serif text-2xl text-[hsl(var(--brand-forest))] leading-none">
                  ✦ Merged Research Notes
                </h2>
                <p className="text-xs text-muted-foreground mt-1">{universe.name}</p>
              </div>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-2" />}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border hover:bg-muted text-sm transition"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <button
                onClick={saveToUniverse}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-hero text-primary-foreground text-sm shadow-soft"
              >
                <Save className="w-3.5 h-3.5" /> Save as Universe Notes
              </button>
              <button onClick={() => openMergeOverlay(null)} className="p-2 rounded-lg hover:bg-muted transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-7 py-8">
            <div className="max-w-3xl mx-auto saathy-prose text-[15px]">
              <ReactMarkdown>{text || "_Merging…_"}</ReactMarkdown>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
