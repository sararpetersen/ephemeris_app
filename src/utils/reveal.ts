import type { CSSProperties } from "react";

export function revealClass(inView: boolean, animation = "fadeInUp") {
  return inView ? `animate__animated animate__${animation}` : "reveal-pending";
}

function isMobileViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
}

export function revealStyle(index = 0, staggerMs = 90): CSSProperties {
  const mobile = isMobileViewport();
  const delay = index * staggerMs;
  return {
    animationDelay: `${mobile ? Math.min(delay, 220) : delay}ms`,
    animationDuration: mobile ? "1s" : "1.6s",
    animationFillMode: "both",
  };
}
