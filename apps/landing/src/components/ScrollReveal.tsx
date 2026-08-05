"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Fades `[data-reveal]` elements in as they scroll into view. Mounted once in
 * the layout and re-scanned on navigation, so sections opt in with a single
 * attribute instead of each becoming a client component.
 *
 * Optional `data-reveal-delay="120"` staggers an element by that many ms.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)"),
    );

    if (elements.length === 0) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const el = entry.target as HTMLElement;
          const delay = el.dataset.revealDelay;
          if (delay) el.style.transitionDelay = `${delay}ms`;
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      },
      // threshold 0 so fast/momentum scrolling never skips an element.
      { rootMargin: "0px 0px -40px 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
