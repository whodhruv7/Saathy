import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, X, Play, Pause, RotateCcw } from "lucide-react";

interface SpeechTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpeechTimer = ({ isOpen, onClose }: SpeechTimerProps) => {
  const [seconds, setSeconds] = useState(90);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, seconds]);

  const reset = useCallback(() => {
    setSeconds(90);
    setIsRunning(false);
  }, []);

  const toggle = useCallback(() => {
    setIsRunning((r) => !r);
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((90 - seconds) / 90) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[hsl(var(--bg-primary))] rounded-2xl p-8 shadow-2xl border border-border max-w-sm w-full mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-[hsl(var(--brand-forest))]" />
                <span className="font-medium text-foreground">Speech Timer</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[hsl(var(--bg-tertiary))] text-muted-foreground transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="text-5xl font-mono font-bold text-foreground mb-2">
                {formatTime(seconds)}
              </div>
              <p className="text-sm text-muted-foreground">
                {seconds === 0 ? "Time's up!" : isRunning ? "Running..." : "Paused"}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-[hsl(var(--bg-tertiary))] rounded-full overflow-hidden mb-6">
              <motion.div
                className="h-full bg-[hsl(var(--brand-forest))]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={toggle}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--brand-forest))] text-white hover:bg-[hsl(var(--brand-forest))]/90 transition"
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isRunning ? "Pause" : "Start"}
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--bg-tertiary))] text-foreground hover:bg-[hsl(var(--bg-hover))] transition"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
