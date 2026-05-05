import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";

export const Section = ({
  title,
  icon,
  children,
  defaultOpen = true,
  collapsible = false,
}: {
  title: string;
  icon?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-border bg-card/95 shadow-soft overflow-hidden"
    >
      <button
        type="button"
        onClick={() => collapsible && setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <h2
          className="font-serif text-xl sm:text-2xl text-[hsl(var(--brand-forest))] leading-tight flex items-center gap-2"
          style={{ letterSpacing: "-0.015em" }}
        >
          {icon && <span className="text-xl">{icon}</span>}
          {title}
        </h2>
        {collapsible && (
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="px-4 pb-4 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export const ConfBadge = ({ c }: { c: string }) => {
  const upper = c.toUpperCase();
  const color =
    upper === "STRONG" ? "hsl(var(--brand-sage))" :
    upper === "WEAK" ? "hsl(var(--brand-gold))" :
    upper === "CONFLICT" ? "hsl(var(--brand-coral))" :
    "hsl(var(--muted-foreground))";
  const icon = upper === "STRONG" ? "✓" : upper === "WEAK" ? "⚠" : upper === "CONFLICT" ? "⚡" : "•";
  return (
    <span
      className="inline-flex items-center gap-0.5 ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider align-middle"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
    >
      {icon} {upper}
    </span>
  );
};
