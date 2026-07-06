import type { A11ySettings } from "../types";

export function applyA11y(settings: A11ySettings) {
  const root = document.documentElement;
  root.classList.toggle("dark", settings.darkMode);
  root.classList.toggle("reduce-motion", settings.reduceMotion);
  root.classList.toggle("high-contrast", settings.highContrast);
  root.classList.toggle("font-readable", settings.font === "readable");
  root.classList.toggle("line-spacious", settings.lineSpacing === "spacious");
  root.classList.remove("font-large", "font-xlarge");
  if (settings.fontSize === "large") root.classList.add("font-large");
  if (settings.fontSize === "xlarge") root.classList.add("font-xlarge");
}
