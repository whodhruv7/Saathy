import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Default to true (mobile-first) to prevent desktop layout flash on mobile
  const [isMobile, setIsMobile] = React.useState<boolean>(true);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    checkMobile(); // Check immediately
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", checkMobile);
    
    // Also listen to resize for broader compatibility
    window.addEventListener("resize", checkMobile);
    
    return () => {
      mql.removeEventListener("change", checkMobile);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return isMobile;
}

// Hook for desktop sidebar collapse state
export function useSidebarToggle() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);
  
  React.useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);
  
  return { sidebarOpen, setSidebarOpen, isMobile };
}
