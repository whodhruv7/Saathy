import { useEffect, useState, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Check } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { DelegateForm } from "@/types";

// Defined OUTSIDE the parent so React doesn't remount inputs on every keystroke
// (that was the cause of focus loss after each character).
type FieldProps = {
  label: string;
  name: keyof DelegateForm;
  value: string;
  placeholder: string;
  multi?: boolean;
  rows?: number;
  onChange: (name: keyof DelegateForm, val: string) => void;
};

const Field = memo(({ label, name, value, placeholder, multi, rows = 3, onChange }: FieldProps) => {
  return (
    <label className="block mb-4">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}
      </span>
      {multi ? (
        <textarea
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-[hsl(var(--brand-forest))] focus:outline-none focus:shadow-glow transition text-sm resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-[hsl(var(--brand-forest))] focus:outline-none focus:shadow-glow transition text-sm"
        />
      )}
    </label>
  );
});
Field.displayName = "Field";

const SectionHeading = ({ num, title }: { num: string; title: string }) => (
  <div className="mb-3 flex items-center gap-2">
    <span className="w-6 h-6 rounded-full bg-[hsl(var(--brand-forest))] text-primary-foreground text-xs font-bold flex items-center justify-center">
      {num}
    </span>
    <span className="font-serif text-lg text-[hsl(var(--brand-forest))]">{title}</span>
  </div>
);

export const DelegateFormPanel = () => {
  const { isDelegateFormOpen, setDelegateFormOpen, getActiveUniverse, updateDelegateForm, markBriefed } =
    useAppStore();
  const universe = getActiveUniverse();
  const [form, setForm] = useState<Partial<DelegateForm>>({});

  useEffect(() => {
    if (universe?.delegateForm) setForm(universe.delegateForm);
    else setForm({ framework: universe?.type || "mun" });
  }, [universe?.id]);

  const update = useCallback((k: keyof DelegateForm, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
  }, []);

  if (!universe) return null;

  const save = () => {
    updateDelegateForm(universe.id, form);
    if (form.country && form.topic) markBriefed(universe.id);
    setDelegateFormOpen(false);
  };

  return (
    <AnimatePresence>
      {isDelegateFormOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm flex justify-end"
          onClick={() => setDelegateFormOpen(false)}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-card h-full shadow-elevated flex flex-col"
          >
            <div className="px-7 py-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[hsl(var(--bg-tertiary))] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[hsl(var(--brand-forest))]" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl text-[hsl(var(--brand-forest))] leading-none">Delegate Brief</h2>
                  <p className="text-xs text-muted-foreground mt-1">Saathy uses this as ground truth for every response.</p>
                </div>
              </div>
              <button onClick={() => setDelegateFormOpen(false)} className="p-2 rounded-lg hover:bg-muted transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-6">
              <SectionHeading num="A" title="Who are you?" />
              <Field label="Country / Entity" name="country" value={form.country || ""} placeholder="e.g. India" onChange={update} />
              <Field label="Committee" name="committee" value={form.committee || ""} placeholder="e.g. UNSC, Lok Sabha" onChange={update} />

              <SectionHeading num="B" title="Your topic" />
              <Field label="Agenda item / Topic" name="topic" value={form.topic || ""} placeholder="e.g. Child sexual abuse prevention in South Asia" multi rows={2} onChange={update} />
              <Field label="Your official position" name="position" value={form.position || ""} placeholder="Your country's stance — be specific. What do you support/oppose?" multi rows={3} onChange={update} />

              <SectionHeading num="C" title="The battle" />
              <Field label="Main opponent / opposing bloc" name="opponent" value={form.opponent || ""} placeholder="e.g. USA-led bloc, China, NGO bloc" onChange={update} />
              <Field label="Your strongest ally" name="ally" value={form.ally || ""} placeholder="Who agrees with you?" onChange={update} />
              <Field label="Committee chair (optional)" name="chair" value={form.chair || ""} placeholder="Chair name / known biases" onChange={update} />
            </div>

            <div className="px-7 py-4 border-t border-border flex justify-between items-center bg-[hsl(var(--bg-secondary))]">
              <p className="text-xs text-muted-foreground">
                {universe.briefed ? "✓ Briefed — Saathy is ready" : "Need at minimum country & topic"}
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={save}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-hero text-primary-foreground shadow-soft flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Lock in Brief →
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
