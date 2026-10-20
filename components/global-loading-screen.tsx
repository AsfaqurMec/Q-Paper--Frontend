"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import logosmall from "../public/logo-small.png";

function GlobalLoadingScreenInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showFullOverlay, setShowFullOverlay] = useState(false);

  // When pathname or searchParams change, the navigation has completed!
  useEffect(() => {
    setProgress(100);
    const timeout = setTimeout(() => {
      setIsLoading(false);
      setShowFullOverlay(false);
      setProgress(0);
    }, 250);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  // Animate progress while loading
  useEffect(() => {
    if (!isLoading) return;

    let current = 15;
    setProgress(current);

    const interval = setInterval(() => {
      current += Math.max(1, (90 - current) * 0.15);
      if (current > 92) {
        clearInterval(interval);
      } else {
        setProgress(current);
      }
    }, 120);

    // If navigation takes longer than 150ms, display the centered branded overlay
    const overlayTimer = setTimeout(() => {
      setShowFullOverlay(true);
    }, 150);

    return () => {
      clearInterval(interval);
      clearTimeout(overlayTimer);
    };
  }, [isLoading]);

  // Intercept internal link clicks and history changes
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Find the closest anchor tag
      const target = (e.target as HTMLElement)?.closest?.("a");
      if (!target || !target.href) return;

      // Ignore if new tab, download, hash only, or modifier keys pressed
      if (
        target.target === "_blank" ||
        target.hasAttribute("download") ||
        target.rel?.includes("external") ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey ||
        e.defaultPrevented
      ) {
        return;
      }

      try {
        const url = new URL(target.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Check if internal link
        if (url.origin === currentUrl.origin) {
          // If different pathname or search, trigger loading!
          if (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search) {
            setIsLoading(true);
          }
        }
      } catch {
        // Invalid URL, ignore
      }
    }

    function handlePopState() {
      setIsLoading(true);
    }

    function handleCustomStart() {
      setIsLoading(true);
    }

    function handleCustomStop() {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setShowFullOverlay(false);
        setProgress(0);
      }, 200);
    }

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("page-loading-start", handleCustomStart);
    window.addEventListener("page-loading-stop", handleCustomStop);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("page-loading-start", handleCustomStart);
      window.removeEventListener("page-loading-stop", handleCustomStop);
    };
  }, []);

  if (!isLoading && progress === 0) return null;

  return (
    <>
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-teal-500 via-primary to-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.8)] transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Centered Loading Overlay (appears if loading takes > 150ms) */}
      {showFullOverlay && (
        <div
          aria-live="polite"
          aria-busy="true"
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-background/55 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto"
        >
          <div className="flex flex-col items-center gap-3.5 rounded-2xl border bg-card/95 p-6 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 max-w-xs text-center">
            {/* Pulsing Animated Brand Icon */}
            <div className="relative flex h-14 w-14 items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping opacity-60" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-card border shadow-sm">
                <Image src={logosmall} alt="ExamCraft Logo" width={32} height={32} className="animate-pulse" />
              </div>
            </div>

            {/* Spinner and label */}
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm font-bold text-foreground">পৃষ্ঠা লোড হচ্ছে...</p>
              </div>
              <p className="text-[11px] text-muted-foreground">Please wait while the page loads</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function GlobalLoadingScreen() {
  return (
    <Suspense fallback={null}>
      <GlobalLoadingScreenInner />
    </Suspense>
  );
}
