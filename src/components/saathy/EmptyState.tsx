import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Logo } from "./Logo";

export const EmptyState = () => {
  const { setCreatingUniverse } = useAppStore();
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-xl"
      >
        <div className="mb-6">
          <Logo size={64} withWordmark={false} />
        </div>
        <h1 className="font-serif text-5xl text-[hsl(var(--brand-forest))] mb-4 italic leading-tight">
          Saathy is ready when you are.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
          Create your first <em className="text-[hsl(var(--brand-forest))] not-italic font-medium">Universe</em> — an isolated research space for one committee, one topic, one delegation. Brief Saathy with your position and watch it pull arguments, treaties, and counter-strategy in seconds.
        </p>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setCreatingUniverse(true)}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-hero text-primary-foreground font-medium shadow-elevated hover:shadow-glow transition-shadow"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Create your first Universe
        </motion.button>

        <div className="mt-12 grid sm:grid-cols-3 gap-4 text-left">
          {[
            { t: "Tiered Evidence", d: "T1 treaties → T4 op-eds. Always sourced." },
            { t: "Counter-Strategy", d: "Predict opposition moves before they speak." },
            { t: "India-Aware", d: "Built for MUN circuits & Yuva Sansad." },
          ].map((f) => (
            <div key={f.t} className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-serif text-lg text-[hsl(var(--brand-forest))] mb-1">{f.t}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
