import { useAppModeStore, type ResearchSubMode } from "@/store/useAppModeStore";
import { cn } from "@/lib/utils";

const SUBS: { id: ResearchSubMode; icon: string; label: string; desc: string }[] = [
  { id: "target",   icon: "🎯", label: "Target",      desc: "Kimi K2 + DeepSeek V3" },
  { id: "counter",  icon: "⚡", label: "Counter",     desc: "Qwen 3 + Nemotron 70B" },
  { id: "dossier",  icon: "🕵️", label: "Intel",       desc: "5 models · opposition research" },
  { id: "speech",   icon: "🎤", label: "Speech",      desc: "Claude Sonnet 3.5" },
  { id: "deepdive", icon: "📊", label: "DeepDive",    desc: "8 models · comprehensive" },
  { id: "webdive",  icon: "🌐", label: "WebDive",     desc: "6 models · balanced research" },
  { id: "lord",     icon: "👑", label: "All-In-Lord", desc: "11 models · maximum power" },
  { id: "pipeline", icon: "🧪", label: "Pipeline",    desc: "Full multi-stage pipeline" },
];

export const ResearchSubModeBar = () => {
  const { subMode, setSubMode } = useAppModeStore();
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 md:mx-0 md:px-0">
      {SUBS.map((s) => {
        const active = subMode === s.id;
        return (
          <button
            key={s.id}
            onClick={() => setSubMode(s.id)}
            title={s.desc}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 px-3 py-2 md:py-1.5 rounded-full text-[12px] border transition-all duration-200 whitespace-nowrap cursor-pointer hover:-translate-y-0.5 active:scale-95",
              active
                ? s.id === "dossier"
                  ? "bg-[hsl(0_84%_60%/0.15)] text-[hsl(0_84%_60%)] border-[hsl(0_84%_60%)] font-semibold shadow-[0_8px_24px_hsl(0_84%_60%/0.25)]"
                  : "bg-gradient-hero text-primary-foreground border-[hsl(var(--primary))] font-semibold shadow-[0_8px_24px_hsl(var(--primary)/0.25)]"
                : s.id === "dossier"
                  ? "bg-card border-border text-foreground/80 hover:border-[hsl(0_84%_60%)] hover:text-[hsl(0_84%_60%)]"
                  : "bg-card border-border text-foreground/80 hover:border-[hsl(var(--primary))] hover:text-foreground"
            )}
          >
            <span className="text-base md:text-sm leading-none">{s.icon}</span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
};
