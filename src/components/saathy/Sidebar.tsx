import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Globe2, ChevronRight, MessageSquare, NotebookPen, Layers, LogOut, Mail, Instagram } from "lucide-react";
import { useAppStore, clearStoreData } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getUserQuotas, getQuotaDisplay, UserQuotas } from "@/lib/rateLimiter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "./Logo";

const TYPE_LABELS: Record<string, string> = {
  mun: "MUN",
  yuva: "Yuva Sansad",
  policy: "Policy",
  ld: "Lincoln-Douglas",
  pf: "Public Forum",
  general: "General",
};

// User section with quota display
function UserSection() {
  const { session, signOut } = useAuth();
  const [quotas, setQuotas] = useState<UserQuotas | null>(null);
  const user = session?.user;

  useEffect(() => {
    if (user?.email) {
      getUserQuotas(user.email).then(setQuotas);
    }
  }, [user?.email]);

  const handleSignOut = () => {
    clearStoreData(); // Clear user-specific data first
    signOut();
    window.location.href = '/auth'; // Redirect to auth page instead of just reload
  };

  if (!user) {
    return (
      <div className="text-center py-2">
        <p className="text-xs text-muted-foreground">Not signed in</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-foreground truncate">
            {user.name}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {user.email}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="px-3 py-1.5 text-xs rounded-lg bg-[hsl(var(--bg-tertiary))] hover:bg-[hsl(var(--bg-hover))] text-muted-foreground hover:text-foreground transition flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>

      {/* Quota breakdown */}
      {quotas && (
        <div className="grid grid-cols-4 gap-1 text-[10px]">
          <div className="text-center p-1.5 rounded bg-[hsl(var(--bg-tertiary))]">
            <p className="text-muted-foreground">Lord Mode</p>
            <p className="font-medium text-foreground">{quotas.allInLord}</p>
          </div>
          <div className="text-center p-1.5 rounded bg-[hsl(var(--bg-tertiary))]">
            <p className="text-muted-foreground">Web Search</p>
            <p className="font-medium text-foreground">{quotas.webDive}</p>
          </div>
          <div className="text-center p-1.5 rounded bg-[hsl(var(--bg-tertiary))]">
            <p className="text-muted-foreground">Deep Dive</p>
            <p className="font-medium text-foreground">{quotas.deepDive}</p>
          </div>
          <div className="text-center p-1.5 rounded bg-[hsl(var(--bg-tertiary))]">
            <p className="text-muted-foreground">Normal Chat</p>
            <p className="font-medium text-foreground">{quotas.normalQueries}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export const Sidebar = ({ onNavigate }: { onNavigate?: () => void } = {}) => {
  const {
    universes,
    activeUniverseId,
    expandedUniverseIds,
    setActiveUniverse,
    deleteUniverse,
    setCreatingUniverse,
    toggleUniverseExpanded,
    createChat,
    setActiveChat,
    deleteChat,
    openNotepad,
    openMergeOverlay,
  } = useAppStore();

  return (
    <aside className="w-full md:w-72 shrink-0 border-r border-border bg-[hsl(var(--bg-secondary))] flex flex-col h-full">
      <div className="p-5 flex items-center justify-between">
        <Logo size={36} withWordmark={true} />
        <ThemeToggle />
      </div>

      <div className="px-4 pb-3">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setCreatingUniverse(true); onNavigate?.(); }}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-primary-foreground text-sm font-medium shadow-soft hover:shadow-elevated transition-shadow"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          New Universe
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <p className="px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Universes
        </p>

        {universes.length === 0 && (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            <Globe2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No universes yet.
          </div>
        )}

        {universes.map((u) => {
          const expanded = expandedUniverseIds.includes(u.id);
          const isActiveUniverse = u.id === activeUniverseId;
          const chats = u.chats || [];
          return (
            <motion.div key={u.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="mb-1">
              <div className="group relative flex items-center">
                <button
                  onClick={() => {
                    setActiveUniverse(u.id);
                    if (!expanded) toggleUniverseExpanded(u.id);
                    if (u.activeChatId) onNavigate?.();
                  }}
                  className={cn(
                    "flex-1 text-left px-2 py-2 rounded-lg flex items-center gap-1.5 transition-all border-l-[3px]",
                    isActiveUniverse
                      ? "bg-[hsl(var(--bg-tertiary))] border-[hsl(var(--brand-coral))]"
                      : "border-transparent hover:bg-[hsl(var(--bg-tertiary))]/60"
                  )}
                >
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUniverseExpanded(u.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleUniverseExpanded(u.id);
                      }
                    }}
                    className="p-0.5 rounded hover:bg-background/60"
                  >
                    <ChevronRight
                      className={cn(
                        "w-3.5 h-3.5 text-muted-foreground transition-transform",
                        expanded && "rotate-90"
                      )}
                    />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm truncate", isActiveUniverse && "font-semibold")}>{u.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {TYPE_LABELS[u.type]} · {chats.length} chat{chats.length !== 1 ? "s" : ""}
                      {u.briefed && <span className="ml-1.5 inline-block w-1 h-1 rounded-full bg-[hsl(var(--brand-sage))] align-middle" />}
                    </div>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${u.name}" and all its chats?`)) deleteUniverse(u.id);
                  }}
                  aria-label={`Delete ${u.name}`}
                  className="opacity-60 hover:opacity-100 p-1.5 rounded-md hover:bg-[hsl(var(--bg-hover))] transition cursor-pointer mr-1"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden ml-5 border-l border-border"
                  >
                    {chats.map((c) => {
                      const isActive = u.activeChatId === c.id && isActiveUniverse;
                      return (
                        <div key={c.id} className="group/chat relative flex items-center">
                          <button
                            onClick={() => { setActiveChat(u.id, c.id); onNavigate?.(); }}
                            className={cn(
                              "flex-1 text-left pl-3 pr-2 py-1.5 flex items-center gap-2 transition border-l-[2px] -ml-px",
                              isActive
                                ? "bg-[hsl(var(--bg-tertiary))] border-[hsl(var(--brand-coral))] text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--bg-tertiary))]/40"
                            )}
                          >
                            <MessageSquare className="w-3 h-3 shrink-0 opacity-60" />
                            <span className="text-xs truncate flex-1">{c.title}</span>
                            {c.notes.trim().length > 0 && (
                              <NotebookPen className="w-3 h-3 text-[hsl(var(--brand-gold))] shrink-0" />
                            )}
                          </button>
                          <div className="opacity-0 group-hover/chat:opacity-100 flex items-center gap-0.5 pr-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openNotepad(c.id);
                              }}
                              className="p-1 rounded hover:bg-background"
                              title="Notes"
                            >
                              <NotebookPen className="w-3 h-3 text-muted-foreground" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete chat "${c.title}"?`)) deleteChat(u.id, c.id);
                              }}
                              className="p-1 rounded hover:bg-background"
                            >
                              <Trash2 className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => { createChat(u.id); onNavigate?.(); }}
                      className="w-full text-left pl-3 py-1.5 text-xs text-muted-foreground hover:text-[hsl(var(--brand-forest))] transition flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3" /> New Chat
                    </button>

                    {chats.length > 1 && (
                      <button
                        onClick={() => openMergeOverlay(u.id)}
                        className="w-full text-left pl-3 py-1.5 text-xs text-[hsl(var(--brand-coral))] hover:text-[hsl(var(--brand-forest))] transition flex items-center gap-2"
                      >
                        <Layers className="w-3 h-3" /> ✦ Merge all notes
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* User Info + Sign Out */}
      <div className="border-t border-border px-4 py-3 bg-[hsl(var(--bg-secondary))]">
        <UserSection />
      </div>

      {/* Founder Contact */}
      <div className="border-t border-border px-4 py-3 bg-[hsl(var(--bg-secondary))]">
        <div className="p-3 rounded-lg bg-[hsl(var(--bg-tertiary))] border border-border/50">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">
            Connect
          </p>
          <div className="space-y-2">
            <a
              href="mailto:dhruvsharma4944@gmail.com"
              className="flex items-center gap-2 text-xs text-[hsl(var(--brand-forest))] hover:text-[hsl(var(--brand-coral))] transition"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Founder</span>
            </a>
            <a
              href="https://instagram.com/who_dhruv7"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-[hsl(var(--brand-forest))] hover:text-[hsl(var(--brand-coral))] transition"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>@who_dhruv7</span>
            </a>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 border-t border-border/30 pt-3">
            Bugs? Ideas? Reach out anytime!
          </p>
        </div>
      </div>
    </aside>
  );
};
