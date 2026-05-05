import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { UniverseType } from "@/types";
import { Logo } from "./Logo";

const TYPES: { id: UniverseType; label: string; desc: string }[] = [
  { id: "mun", label: "MUN", desc: "Model UN — UNGA, UNSC, ECOSOC, etc." },
  { id: "yuva", label: "Yuva Sansad", desc: "Indian Parliament simulation" },
  { id: "policy", label: "Policy Debate", desc: "Cross-examination policy format" },
  { id: "ld", label: "Lincoln-Douglas", desc: "Value-based 1-on-1 debate" },
  { id: "pf", label: "Public Forum", desc: "Team accessible debate" },
  { id: "general", label: "General Research", desc: "Open-ended topic" },
];

export const UniverseModal = () => {
  const { isCreatingUniverse, setCreatingUniverse, createUniverse, setDelegateFormOpen } =
    useAppStore();
  const [name, setName] = useState("");
  const [type, setType] = useState<UniverseType>("mun");

  const handleCreate = () => {
    if (!name.trim()) return;
    createUniverse(name.trim(), type);
    setName("");
    setType("mun");
    setCreatingUniverse(false);
    setTimeout(() => setDelegateFormOpen(true), 250);
  };

  return (
    <AnimatePresence>
      {isCreatingUniverse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCreatingUniverse(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-2xl shadow-elevated w-full max-w-lg p-7 border border-border"
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Logo size={20} withWordmark={false} />
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                    Create Universe
                  </span>
                </div>
                <h2 className="font-serif text-3xl text-[hsl(var(--brand-forest))]">
                  A new research space
                </h2>
              </div>
              <button
                onClick={() => setCreatingUniverse(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="block mb-4">
              <span className="text-sm font-medium mb-1.5 block">Universe name</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. India @ UNSC — Nuclear Disarmament"
                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-[hsl(var(--brand-forest))] focus:outline-none focus:shadow-glow transition text-sm"
              />
            </label>

            <div className="mb-6">
              <span className="text-sm font-medium mb-2 block">Format</span>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={`text-left p-3 rounded-xl border transition ${
                      type === t.id
                        ? "border-[hsl(var(--brand-forest))] bg-[hsl(var(--bg-tertiary))]"
                        : "border-border hover:border-[hsl(var(--brand-sage))] bg-background"
                    }`}
                  >
                    <div className="text-sm font-medium">{t.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {t.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setCreatingUniverse(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!name.trim()}
                onClick={handleCreate}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-hero text-primary-foreground shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create & Brief →
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
