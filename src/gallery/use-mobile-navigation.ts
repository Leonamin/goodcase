import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// Keep the modal boundary aligned with gallery.css's mobile navigation rules.
const mobileNavigationQuery = "(max-width: 760px)";
const subscribeToViewport = (onChange: () => void) => {
  const viewport = window.matchMedia(mobileNavigationQuery);
  viewport.addEventListener("change", onChange);
  return () => viewport.removeEventListener("change", onChange);
};
const isMobileViewport = () => window.matchMedia(mobileNavigationQuery).matches;

export function useMobileNavigation() {
  const isMobile = useSyncExternalStore(
    subscribeToViewport,
    isMobileViewport,
    () => false,
  );
  const [isRequestedOpen, setIsNavOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const isNavOpen = isMobile && isRequestedOpen;

  useEffect(() => {
    if (!isMobile) setIsNavOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (!isNavOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not(:disabled), input:not(:disabled)",
        ) ?? [],
      ).filter(
        (element) =>
          element.tabIndex >= 0 &&
          element.getClientRects().length > 0 &&
          getComputedStyle(element).visibility !== "hidden",
      );
    focusable()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsNavOpen(false);
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.getClientRects().length) previousFocus.focus();
    };
  }, [isNavOpen]);

  return { isNavOpen, setIsNavOpen, sidebarRef };
}
