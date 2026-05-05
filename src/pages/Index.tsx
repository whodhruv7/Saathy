import { useState, useEffect, useRef } from "react";
import { Menu, PanelLeftClose, PanelLeft } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { loadChats, saveChat, getSession } from "@/lib/supabaseAuth";
import { Sidebar } from "@/components/saathy/Sidebar";
import { ChatContainer } from "@/components/saathy/ChatContainer";
import { EmptyState } from "@/components/saathy/EmptyState";
import { UniverseModal } from "@/components/saathy/UniverseModal";
import { DelegateFormPanel } from "@/components/saathy/DelegateFormPanel";
import { NotePadPanel } from "@/components/saathy/NotePadPanel";
import { MergedNotesOverlay } from "@/components/saathy/MergedNotesOverlay";
import { FloatingMascot } from "@/components/saathy/FloatingMascot";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const Index = () => {
  const { 
    activeUniverseId, 
    universes, 
    getActiveUniverse, 
    getActiveChat,
    expandedUniverseIds 
  } = useAppStore();
  const hasActive = activeUniverseId && universes.find((u) => u.id === activeUniverseId);
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userEmail = getSession()?.user?.email;

  // Load user data from Supabase when user changes
  useEffect(() => {
    if (userEmail) {
      loadChats(userEmail).then((result) => {
        if (result.success && result.data && result.data.length > 0) {
          // Convert Supabase chats to universes format
          const loadedUniverses = result.data.map((chat: any) => ({
            ...chat.universe_data,
            id: chat.universe_data.id || crypto.randomUUID(),
          }));
          useAppStore.setState({
            universes: loadedUniverses,
            activeUniverseId: loadedUniverses[0]?.id || null,
            expandedUniverseIds: [loadedUniverses[0]?.id].filter(Boolean),
          });
        } else {
          // No data for this user - clear store
          useAppStore.setState({
            universes: [],
            activeUniverseId: null,
            expandedUniverseIds: [],
          });
        }
      });
    } else {
      // No user logged in - clear everything
      useAppStore.setState({
        universes: [],
        activeUniverseId: null,
        expandedUniverseIds: [],
      });
    }
  }, [userEmail]);

  // Auto-save to Supabase with debounce
  useEffect(() => {
    if (!userEmail) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      universes.forEach((universe) => {
        saveChat(userEmail, universe.name, universe);
      });
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [universes, activeUniverseId, expandedUniverseIds, userEmail]);

  const universe = getActiveUniverse();
  const chat = getActiveChat();

  return (
    <div className="h-[100dvh] w-screen flex bg-background overflow-hidden">
      {/* Desktop sidebar with toggle */}
      {!isMobile && desktopSidebarOpen && (
        <div className="shrink-0 border-r border-border h-full">
          <Sidebar />
        </div>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            className={cn(
              "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity",
              drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          />
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-[85%] max-w-[320px] bg-background shadow-xl transition-transform duration-300 ease-out",
              drawerOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - Mobile hamburger + Desktop sidebar toggle */}
        <div className="flex items-center gap-2 px-3 h-12 border-b border-border bg-background/95 backdrop-blur shrink-0">
          {/* Mobile: Hamburger */}
          {isMobile && (
            <button
              onClick={() => setDrawerOpen((v) => !v)}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--bg-tertiary))] transition"
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          {/* Desktop: Sidebar toggle */}
          {!isMobile && (
            <button
              onClick={() => setDesktopSidebarOpen((v) => !v)}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--bg-tertiary))] transition"
              title={desktopSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {desktopSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>
          )}
          
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate text-[hsl(var(--brand-forest))]">Saathy</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {hasActive ? <ChatContainer /> : <EmptyState />}
        </div>
      </main>

      <UniverseModal />
      <DelegateFormPanel />
      <NotePadPanel />
      <MergedNotesOverlay />
      <FloatingMascot />
    </div>
  );
};

export default Index;
