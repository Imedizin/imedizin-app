import { useState, useEffect } from "react";

const MIN_DESKTOP_WIDTH = 1280; // lg breakpoint – laptop/desktop

export function DesktopOnlyOverlay() {
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsBlocked(window.innerWidth < MIN_DESKTOP_WIDTH);
    };

    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  if (!isBlocked) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background p-6"
      role="alert"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full bg-muted"
          aria-hidden
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <rect width="20" height="14" x="2" y="3" rx="2" />
            <line x1="8" x2="16" y1="21" y2="21" />
            <line x1="12" x2="12" y1="17" y2="21" />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Use a laptop or desktop
          </h1>
          <p className="text-sm text-muted-foreground">
            This application is designed for laptop and desktop computers.
            Please open it on a device with a larger screen for the best
            experience.
          </p>
        </div>
      </div>
    </div>
  );
}
