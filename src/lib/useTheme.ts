import { useEffect } from "react";
import { subscribeToTheme } from "./firestore";
import type { ThemeSettings } from "./types";
import { DEFAULT_THEME } from "./types";

export function applyTheme(t: ThemeSettings) {
  const r = document.documentElement;
  r.style.setProperty("--background", t.bgMain);
  r.style.setProperty("--card", t.bgCard);
  r.style.setProperty("--popover", t.bgCard);
  r.style.setProperty("--primary", t.primaryGreen);
  r.style.setProperty("--ring", t.primaryGreen);
  r.style.setProperty("--sidebar", t.bgMain);
  r.style.setProperty("--sidebar-border", hexToRgba(t.primaryGreen, 0.3));
  r.style.setProperty("--border", hexToRgba(t.primaryGreen, 0.25));
  r.style.setProperty("--foreground", t.textColor ?? "#e8f5e9");
  r.style.setProperty("--theme-bg-main", t.bgMain);
  r.style.setProperty("--theme-bg-card", t.bgCard);
  r.style.setProperty("--theme-primary", t.primaryGreen);
  r.style.setProperty("--theme-accent", t.accentGreen);
  r.style.setProperty("--theme-text", t.textColor ?? "#e8f5e9");
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useTheme() {
  useEffect(() => {
    applyTheme(DEFAULT_THEME);
    const unsub = subscribeToTheme((theme) => {
      applyTheme(theme);
    });
    return unsub;
  }, []);
}
