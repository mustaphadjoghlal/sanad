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

  // Derived secondary colors from textColor
  const text = t.textColor ?? "#e8f5e9";
  r.style.setProperty("--theme-text-secondary", mixHex(text, "#000000", 0.25));
  r.style.setProperty("--theme-text-muted",     mixHex(text, "#000000", 0.50));
  r.style.setProperty("--theme-text-dim",       mixHex(text, "#000000", 0.65));
  r.style.setProperty("--theme-badge-text",     mixHex(text, "#ffffff", 0.15));
  r.style.setProperty("--theme-badge-bg", hexToRgba(t.primaryGreen, 0.25));
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixHex(hex: string, target: string, t: number): string {
  const r1 = parseInt(hex.slice(1, 3), 16);
  const g1 = parseInt(hex.slice(3, 5), 16);
  const b1 = parseInt(hex.slice(5, 7), 16);
  const r2 = parseInt(target.slice(1, 3), 16);
  const g2 = parseInt(target.slice(3, 5), 16);
  const b2 = parseInt(target.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
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
