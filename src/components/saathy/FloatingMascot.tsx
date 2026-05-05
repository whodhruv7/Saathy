import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const TIPS = [
  "Hi, I'm Saathy. Let's think strategically.",
  "Pro tip: Brief me on your country first — I argue sharper with context.",
  "Stuck on rebuttals? Switch to Counter mode for instant comebacks.",
  "Need citations? DeepDive pulls T1 treaties and verified sources.",
];

export function FloatingMascot() {
  const [open, setOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [imgOk, setImgOk] = useState(true);

  // Rotate tips every 6s while bubble is open
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 6000);
    return () => clearInterval(id);
  }, [open]);

  return (
    <div className="fixed top-16 right-4 sm:right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Saathy assistant"
        title="Saathy"
        className="pointer-events-auto group relative h-14 w-14 sm:h-16 sm:w-16 rounded-full grid place-items-center shadow-elevated cursor-pointer transition-transform duration-300 hover:scale-105"
        style={{ 
          perspective: "600px", 
          background: "hsl(var(--primary))",
          border: "2px solid hsl(var(--primary))",
          zIndex: 40
        }}
      >
        {/* Glow effect */}
        <span
          aria-hidden
          className="absolute -inset-2 rounded-full bg-[hsl(var(--primary)/0.3)] blur-xl"
          style={{ zIndex: -1 }}
        />
        <div
          className="relative mascot-float transition-transform duration-300 group-hover:[transform:rotateY(15deg)_rotateX(-6deg)]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {imgOk ? (
            <img
              src="/brand/mascot.png"
              alt="Saathy mascot"
              width={48}
              height={48}
              loading="lazy"
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
              style={{ 
                filter: "brightness(2) contrast(1.5) saturate(1.2)",
                mixBlendMode: "screen"
              }}
              onError={() => setImgOk(false)}
            />
          ) : (
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white grid place-items-center text-[hsl(var(--primary))] font-serif text-xl sm:text-2xl font-bold">
              स
            </div>
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="bubble"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto max-w-[260px] rounded-2xl border border-border bg-popover text-popover-foreground shadow-elevated px-4 py-3 relative"
            style={{ background: "var(--gradient-card)" }}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Dismiss"
              className="absolute top-2 right-2 w-6 h-6 rounded-full grid place-items-center text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--bg-hover))] transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--primary))] font-semibold mb-1">
              Saathy
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="text-sm leading-relaxed text-foreground pr-4"
              >
                {TIPS[tipIndex]}
              </motion.p>
            </AnimatePresence>
            <span
              aria-hidden
              className="absolute -top-1.5 right-7 w-3 h-3 rotate-45 border-l border-t border-border bg-card"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
