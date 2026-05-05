import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MODEL_REGISTRY, MODE_CONFIGS } from '@/config/models';
import { useState } from 'react';
import type { ModelConfig } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: ModelConfig;
  onChange?: (cfg: ModelConfig) => void;
}

export function PipelineSheet({ open, onOpenChange }: Props) {
  const [activeModels, setActiveModels] = useState<Set<string>>(
    new Set(MODE_CONFIGS.DEEPDIVE)
  );

  const coreModels = ['kimi', 'glm', 'qwen', 'deepseek', 'nemotron', 'gemini', 'claude'];
  const extendedModels = ['mistral', 'phi3', 'qwenCoder', 'yi', 'solar', 'minimax', 'zephyr'];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl max-h-screen overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-serif text-brand-forest">
            Research Pipeline
          </SheetTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {activeModels.size}/13 active · scroll to see all models
          </p>
        </SheetHeader>

        <div className="flex gap-2 mt-6 mb-6">
          <button
            onClick={() => setActiveModels(new Set(MODE_CONFIGS.DEEPDIVE))}
            className="px-3 py-1 rounded-full text-xs font-medium bg-brand-forest text-white"
          >
            Full
          </button>
          <button
            onClick={() => setActiveModels(new Set(MODE_CONFIGS.NORMAL))}
            className="px-3 py-1 rounded-full text-xs font-medium border border-brand-forest text-brand-forest hover:bg-forest/5"
          >
            Fast
          </button>
          <button
            onClick={() => setActiveModels(new Set(MODE_CONFIGS.DEEPDIVE))}
            className="px-3 py-1 rounded-full text-xs font-medium border border-muted text-muted-foreground ml-auto"
          >
            Reset
          </button>
        </div>

        <div className="space-y-4">
          {/* CORE MODELS */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Core Models
            </h3>
            <div className="space-y-2">
              {coreModels.map(modelId => {
                const config = MODEL_REGISTRY[modelId as keyof typeof MODEL_REGISTRY];
                if (!config) return null;

                const isAlwaysOn = config.alwaysOn;
                const isActive = activeModels.has(modelId);

                return (
                  <div
                    key={modelId}
                    className="border rounded-xl p-4 border-border hover:border-brand-forest/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        <span className="font-medium">{config.displayName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-brand-forest bg-forest/10 px-2 py-1 rounded">
                          FREE
                        </span>
                        {isAlwaysOn && (
                          <span className="text-xs font-semibold text-brand-sage bg-sage/10 px-2 py-1 rounded">
                            ALWAYS
                          </span>
                        )}
                        <input
                          type="checkbox"
                          checked={isActive}
                          disabled={isAlwaysOn}
                          onChange={e => {
                            const newSet = new Set(activeModels);
                            if (e.target.checked) {
                              newSet.add(modelId);
                            } else {
                              newSet.delete(modelId);
                            }
                            setActiveModels(newSet);
                          }}
                          className="w-5 h-5 cursor-pointer disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{config.description}</p>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Accuracy</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${config.accuracy}%`,
                                backgroundColor: config.color,
                              }}
                            />
                          </div>
                          <span className="font-semibold w-8">{config.accuracy}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Daily cap</span>
                        <span className="font-medium">{config.dailyCap.toLocaleString()}/day</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EXTENDED MODELS */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Extended Models · All Free
            </h3>
            <div className="space-y-2">
              {extendedModels.map(modelId => {
                const config = MODEL_REGISTRY[modelId as keyof typeof MODEL_REGISTRY];
                if (!config) return null;

                const isActive = activeModels.has(modelId);

                return (
                  <div
                    key={modelId}
                    className="border rounded-xl p-4 border-border hover:border-brand-forest/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        <span className="font-medium">{config.displayName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-brand-forest bg-forest/10 px-2 py-1 rounded">
                          FREE
                        </span>
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={e => {
                            const newSet = new Set(activeModels);
                            if (e.target.checked) {
                              newSet.add(modelId);
                            } else {
                              newSet.delete(modelId);
                            }
                            setActiveModels(newSet);
                          }}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{config.description}</p>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Accuracy</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${config.accuracy}%`,
                                backgroundColor: config.color,
                              }}
                            />
                          </div>
                          <span className="font-semibold w-8">{config.accuracy}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Daily cap</span>
                        <span className="font-medium">{config.dailyCap.toLocaleString()}/day</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <SheetFooter className="mt-8">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-brand-forest hover:bg-forest/90 text-white h-12 rounded-lg font-semibold"
          >
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
