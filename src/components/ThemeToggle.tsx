import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "h-9 w-9 rounded-lg flex items-center justify-center border border-border",
        "bg-[hsl(var(--bg-secondary))] hover:bg-[hsl(var(--bg-hover))] transition",
        "text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink-primary))]",
        className
      )}
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
