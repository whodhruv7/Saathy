import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import type {
  Universe,
  Chat,
  Message,
  DelegateForm,
  UniverseType,
  PipelineStage,
  ResearchStage,
} from "@/types";
import { getSession } from "@/lib/mockAuth";

// User-scoped storage helper
const getUserStoreKey = (baseName: string) => {
  const session = getSession();
  const email = session?.user?.email;
  return email ? `${baseName}_${email}` : baseName;
};

// Custom storage that uses user-specific keys
const userScopedStorage = {
  getItem: (name: string) => {
    const key = getUserStoreKey(name);
    const str = localStorage.getItem(key);
    return str ? JSON.parse(str) : null;
  },
  setItem: (name: string, value: any) => {
    const key = getUserStoreKey(name);
    localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    const key = getUserStoreKey(name);
    localStorage.removeItem(key);
  },
};

interface AppStore {
  universes: Universe[];
  activeUniverseId: string | null;
  isDelegateFormOpen: boolean;
  isCreatingUniverse: boolean;
  expandedUniverseIds: string[];
  notepadOpenForChatId: string | null;
  mergeOverlayUniverseId: string | null;

  // Universe ops
  createUniverse: (name: string, type: UniverseType) => Universe;
  deleteUniverse: (id: string) => void;
  setActiveUniverse: (id: string) => void;
  toggleUniverseExpanded: (id: string) => void;
  updateDelegateForm: (id: string, form: Partial<DelegateForm>) => void;
  markBriefed: (id: string) => void;
  updateUniverseNotes: (id: string, notes: string) => void;

  // Chat ops
  createChat: (universeId: string, title?: string) => Chat;
  deleteChat: (universeId: string, chatId: string) => void;
  setActiveChat: (universeId: string, chatId: string) => void;
  addMessageToChat: (universeId: string, chatId: string, msg: Message) => void;
  updateStreamingMessage: (universeId: string, chatId: string, msgId: string, content: string) => void;
  updateMessageStages: (universeId: string, chatId: string, msgId: string, stages: PipelineStage[]) => void;
  updateMessageResearchStages: (universeId: string, chatId: string, msgId: string, stages: ResearchStage[]) => void;
  finalizeMessage: (universeId: string, chatId: string, msgId: string) => void;
  updateChatNotes: (universeId: string, chatId: string, notes: string) => void;

  // UI
  setDelegateFormOpen: (open: boolean) => void;
  setCreatingUniverse: (creating: boolean) => void;
  openNotepad: (chatId: string | null) => void;
  openMergeOverlay: (universeId: string | null) => void;

  // Selectors
  getActiveUniverse: () => Universe | null;
  getActiveChat: () => Chat | null;
}

const truncateTitle = (s: string, max = 28) => {
  const clean = s.trim().replace(/\s+/g, " ");
  // Take first 6 words or max chars, whichever is shorter
  const words = clean.split(" ").slice(0, 6).join(" ");
  return words.length <= max ? words : words.slice(0, max - 1) + "…";
};

const newChat = (title = "New chat"): Chat => ({
  id: crypto.randomUUID(),
  title,
  createdAt: Date.now(),
  lastActive: Date.now(),
  messages: [],
  notes: "",
});

// Migrate old universes (flat messages → first chat)
const migrateUniverse = (u: Universe): Universe => {
  if (u.chats && u.chats.length > 0) return u;
  const first = newChat("Initial chat");
  if (u.messages && u.messages.length > 0) {
    first.messages = u.messages;
    first.title = truncateTitle(u.messages[0]?.content || "Initial chat");
  }
  return {
    ...u,
    chats: [first],
    activeChatId: first.id,
    notes: u.notes ?? "",
    messages: undefined,
  };
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      universes: [],
      activeUniverseId: null,
      isDelegateFormOpen: false,
      isCreatingUniverse: false,
      expandedUniverseIds: [],
      notepadOpenForChatId: null,
      mergeOverlayUniverseId: null,

      createUniverse: (name, type) => {
        const firstChat = newChat("New chat");
        const u: Universe = {
          id: crypto.randomUUID(),
          name,
          type,
          createdAt: Date.now(),
          lastActive: Date.now(),
          briefed: false,
          delegateForm: null,
          chats: [firstChat],
          activeChatId: firstChat.id,
          notes: "",
        };
        set((s) => ({
          universes: [u, ...s.universes],
          activeUniverseId: u.id,
          expandedUniverseIds: [...s.expandedUniverseIds, u.id],
        }));
        return u;
      },

      deleteUniverse: (id) =>
        set((s) => {
          const filtered = s.universes.filter((u) => u.id !== id);
          return {
            universes: filtered,
            activeUniverseId: s.activeUniverseId === id ? filtered[0]?.id || null : s.activeUniverseId,
          };
        }),

      setActiveUniverse: (id) =>
        set((s) => ({
          activeUniverseId: id,
          expandedUniverseIds: s.expandedUniverseIds.includes(id)
            ? s.expandedUniverseIds
            : [...s.expandedUniverseIds, id],
          universes: s.universes.map((u) => (u.id === id ? { ...u, lastActive: Date.now() } : u)),
        })),

      toggleUniverseExpanded: (id) =>
        set((s) => ({
          expandedUniverseIds: s.expandedUniverseIds.includes(id)
            ? s.expandedUniverseIds.filter((x) => x !== id)
            : [...s.expandedUniverseIds, id],
        })),

      updateDelegateForm: (id, form) =>
        set((s) => ({
          universes: s.universes.map((u) =>
            u.id === id ? { ...u, delegateForm: { ...u.delegateForm, ...form } } : u
          ),
        })),

      markBriefed: (id) =>
        set((s) => ({
          universes: s.universes.map((u) => (u.id === id ? { ...u, briefed: true } : u)),
        })),

      updateUniverseNotes: (id, notes) =>
        set((s) => ({
          universes: s.universes.map((u) => (u.id === id ? { ...u, notes } : u)),
        })),

      createChat: (universeId, title = "New chat") => {
        const chat = newChat(title);
        set((s) => ({
          universes: s.universes.map((u) =>
            u.id === universeId
              ? { ...u, chats: [chat, ...u.chats], activeChatId: chat.id, lastActive: Date.now() }
              : u
          ),
        }));
        return chat;
      },

      deleteChat: (universeId, chatId) =>
        set((s) => ({
          universes: s.universes.map((u) => {
            if (u.id !== universeId) return u;
            const remaining = u.chats.filter((c) => c.id !== chatId);
            if (remaining.length === 0) {
              const fresh = newChat();
              return { ...u, chats: [fresh], activeChatId: fresh.id };
            }
            return {
              ...u,
              chats: remaining,
              activeChatId: u.activeChatId === chatId ? remaining[0].id : u.activeChatId,
            };
          }),
        })),

      setActiveChat: (universeId, chatId) =>
        set((s) => ({
          activeUniverseId: universeId,
          universes: s.universes.map((u) =>
            u.id === universeId
              ? {
                  ...u,
                  activeChatId: chatId,
                  lastActive: Date.now(),
                  chats: u.chats.map((c) => (c.id === chatId ? { ...c, lastActive: Date.now() } : c)),
                }
              : u
          ),
        })),

      addMessageToChat: (universeId, chatId, msg) =>
        set((s) => ({
          universes: s.universes.map((u) =>
            u.id === universeId
              ? {
                  ...u,
                  lastActive: Date.now(),
                  chats: u.chats.map((c) => {
                    if (c.id !== chatId) return c;
                    const isFirstUserMsg =
                      c.messages.length === 0 && msg.role === "user";
                    return {
                      ...c,
                      lastActive: Date.now(),
                      title: isFirstUserMsg ? truncateTitle(msg.content) : c.title,
                      messages: [...c.messages, msg],
                    };
                  }),
                }
              : u
          ),
        })),

      updateStreamingMessage: (universeId, chatId, msgId, content) =>
        set((s) => ({
          universes: s.universes.map((u) =>
            u.id === universeId
              ? {
                  ...u,
                  chats: u.chats.map((c) =>
                    c.id === chatId
                      ? {
                          ...c,
                          messages: c.messages.map((m) => (m.id === msgId ? { ...m, content } : m)),
                        }
                      : c
                  ),
                }
              : u
          ),
        })),

      updateMessageStages: (universeId, chatId, msgId, stages) =>
        set((s) => ({
          universes: s.universes.map((u) =>
            u.id === universeId
              ? {
                  ...u,
                  chats: u.chats.map((c) =>
                    c.id === chatId
                      ? {
                          ...c,
                          messages: c.messages.map((m) => (m.id === msgId ? { ...m, stages } : m)),
                        }
                      : c
                  ),
                }
              : u
          ),
        })),

      updateMessageResearchStages: (universeId, chatId, msgId, researchStages) =>
        set((s) => ({
          universes: s.universes.map((u) =>
            u.id === universeId
              ? {
                  ...u,
                  chats: u.chats.map((c) =>
                    c.id === chatId
                      ? {
                          ...c,
                          messages: c.messages.map((m) => (m.id === msgId ? { ...m, researchStages } : m)),
                        }
                      : c
                  ),
                }
              : u
          ),
        })),

      finalizeMessage: (universeId, chatId, msgId) =>
        set((s) => ({
          universes: s.universes.map((u) =>
            u.id === universeId
              ? {
                  ...u,
                  chats: u.chats.map((c) =>
                    c.id === chatId
                      ? {
                          ...c,
                          messages: c.messages.map((m) =>
                            m.id === msgId ? { ...m, isStreaming: false } : m
                          ),
                        }
                      : c
                  ),
                }
              : u
          ),
        })),

      updateChatNotes: (universeId, chatId, notes) =>
        set((s) => ({
          universes: s.universes.map((u) =>
            u.id === universeId
              ? {
                  ...u,
                  chats: u.chats.map((c) => (c.id === chatId ? { ...c, notes } : c)),
                }
              : u
          ),
        })),

      setDelegateFormOpen: (open) => set({ isDelegateFormOpen: open }),
      setCreatingUniverse: (creating) => set({ isCreatingUniverse: creating }),
      openNotepad: (chatId) => set({ notepadOpenForChatId: chatId }),
      openMergeOverlay: (universeId) => set({ mergeOverlayUniverseId: universeId }),

      getActiveUniverse: () => {
        const s = get();
        const u = s.universes.find((x) => x.id === s.activeUniverseId);
        return u ? migrateUniverse(u) : null;
      },
      getActiveChat: () => {
        const s = get();
        const u = s.universes.find((x) => x.id === s.activeUniverseId);
        if (!u) return null;
        const migrated = migrateUniverse(u);
        return migrated.chats.find((c) => c.id === migrated.activeChatId) || migrated.chats[0] || null;
      },
    }),
    {
      name: "saathy-store",
      version: 3,
      storage: createJSONStorage(() => userScopedStorage),
      partialize: (state) => ({
        universes: state.universes,
        activeUniverseId: state.activeUniverseId,
        expandedUniverseIds: state.expandedUniverseIds,
      }),
      migrate: (persisted: any, version) => {
        if (!persisted) return persisted;
        if (version < 2 && Array.isArray(persisted.universes)) {
          persisted.universes = persisted.universes.map((u: Universe) => migrateUniverse(u));
          persisted.expandedUniverseIds = persisted.expandedUniverseIds || [];
        }
        return persisted;
      },
    }
  )
);

// Clear store data for current user (call on logout)
export function clearStoreData() {
  const session = getSession();
  const userEmail = session?.user?.email;
  if (userEmail) {
    localStorage.removeItem(`saathy-store_${userEmail}`);
    localStorage.removeItem(`saathy-store`); // Legacy cleanup
  }
}

// User-specific data storage
export function getUserStorageKey(): string {
  const session = getSession();
  const email = session?.user?.email || 'guest';
  return `saathy_chats_${email}`;
}

export function saveUserData(universes: Universe[], activeUniverseId: string | null, expandedUniverseIds: string[]) {
  const key = getUserStorageKey();
  const data = { universes, activeUniverseId, expandedUniverseIds, savedAt: Date.now() };
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadUserData(): { universes: Universe[]; activeUniverseId: string | null; expandedUniverseIds: string[] } | null {
  const key = getUserStorageKey();
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
