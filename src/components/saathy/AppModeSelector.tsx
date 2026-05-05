import { motion } from "framer-motion";
import { useAppModeStore, type AppMode } from "@/store/useAppModeStore";
import { cn } from "@/lib/utils";

const MODES: { id: AppMode; label: string; hint: string }[] = [
  { id: "normal",   label: "Normal",   hint: "Quick chat & rebuttals" },
  { id: "research", label: "Research", hint: "Specialists, dossiers, pipeline" },
];

export const AppModeSelector = ({ compact = false }: { compact?: boolean }) => {
  const { appMode, setAppMode } = useAppModeStore();

  return (
    <div className={cn("flex items-center gap-1.5", compact && "")}>
      {MODES.map((mode) => {
        const active = appMode === mode.id;
        return (
          <motion.button
            key={mode.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setAppMode(mode.id)}
            title={mode.hint}
            className={cn(
              "px-4 py-1.5 rounded-full border text-[13px] font-medium transition-all duration-200 whitespace-nowrap cursor-pointer hover:-translate-y-0.5",
              active
                ? "bg-gradient-hero border-[hsl(var(--primary))] text-primary-foreground shadow-[0_8px_24px_hsl(var(--primary)/0.25)]"
                : "bg-card border-border text-foreground/80 hover:text-foreground hover:border-[hsl(var(--primary))]"
            )}
            aria-pressed={active}
          >
            {mode.label}
          </motion.button>
        );
      })}
    </div>
  );
};
