import { useEffect } from "react";
import { subscribeToTheme } from "./firestore";
import type { ThemeSettings } from "./types";
import { DEFAULT_THEME } from "./types";

const THEME_CACHE_KEY = "sanad-theme-cache";

export function applyTheme(t: ThemeSettings) {
  // Guard: if textColor is a CSS var reference, fall back to default
  const textColor = t.textColor?.startsWith("#") ? t.textColor : "#e8f5e9";
  // bgMain is optional — derive from bgCard if absent or invalid
  const bgMain = t.bgMain?.startsWith("#") ? t.bgMain : mixHex(t.bgCard, "#000000", 0.25);

  const r = document.documentElement;
  r.style.setProperty("--background", bgMain);
  r.style.setProperty("--card", t.bgCard);
  r.style.setProperty("--popover", t.bgCard);
  r.style.setProperty("--primary", t.primaryGreen);
  r.style.setProperty("--ring", t.primaryGreen);
  r.style.setProperty("--sidebar", bgMain);
  r.style.setProperty("--sidebar-border", hexToRgba(t.primaryGreen, 0.3));
  r.style.setProperty("--sidebar-primary", t.primaryGreen);
  r.style.setProperty("--sidebar-ring", t.primaryGreen);
  r.style.setProperty("--border", hexToRgba(t.primaryGreen, 0.25));
  r.style.setProperty("--foreground", textColor);

  // Also update Tailwind muted/secondary/accent foreground vars
  r.style.setProperty("--muted-foreground",       mixHex(textColor, "#000000", 0.40));
  r.style.setProperty("--secondary-foreground",   mixHex(textColor, "#000000", 0.20));
  r.style.setProperty("--accent-foreground",      mixHex(textColor, "#ffffff", 0.15));
  r.style.setProperty("--sidebar-accent-foreground", mixHex(textColor, "#ffffff", 0.15));

  r.style.setProperty("--theme-bg-main", bgMain);
  r.style.setProperty("--theme-bg-card", t.bgCard);
  r.style.setProperty("--theme-bg-card-end", t.bgCardEnd ?? t.bgCard);
  r.style.setProperty("--theme-primary", t.primaryGreen);
  r.style.setProperty("--theme-accent", t.accentGreen);
  r.style.setProperty("--theme-text", textColor);

  // Derived secondary colors from page textColor
  r.style.setProperty("--theme-text-secondary", mixHex(textColor, "#000000", 0.25));
  r.style.setProperty("--theme-text-muted",     mixHex(textColor, "#000000", 0.50));
  r.style.setProperty("--theme-text-dim",       mixHex(textColor, "#000000", 0.65));
  r.style.setProperty("--theme-badge-text",     mixHex(textColor, "#ffffff", 0.15));
  r.style.setProperty("--theme-badge-bg", hexToRgba(t.primaryGreen, 0.25));

  // Card text color — scoped via .card-text-scope in globals.css
  const cardText = (t.cardTextColor?.startsWith("#") ? t.cardTextColor : null) ?? textColor;
  r.style.setProperty("--theme-card-text",           cardText);
  r.style.setProperty("--theme-card-text-secondary", mixHex(cardText, "#000000", 0.25));
  r.style.setProperty("--theme-card-text-muted",     mixHex(cardText, "#000000", 0.50));
  r.style.setProperty("--theme-card-text-dim",       mixHex(cardText, "#000000", 0.65));

  // Override Tailwind v4 built-in green color tokens so all green-* utilities respond to theme
  r.style.setProperty("--color-green-50",  hexToRgba(t.primaryGreen, 0.05));
  r.style.setProperty("--color-green-100", hexToRgba(t.primaryGreen, 0.12));
  r.style.setProperty("--color-green-200", mixHex(t.accentGreen, "#ffffff", 0.50));
  r.style.setProperty("--color-green-300", mixHex(t.accentGreen, "#ffffff", 0.30));
  r.style.setProperty("--color-green-400", t.accentGreen);
  r.style.setProperty("--color-green-500", t.accentGreen);
  r.style.setProperty("--color-green-600", t.primaryGreen);
  r.style.setProperty("--color-green-700", t.primaryGreen);
  r.style.setProperty("--color-green-800", mixHex(t.primaryGreen, "#000000", 0.20));
  r.style.setProperty("--color-green-900", mixHex(t.primaryGreen, "#000000", 0.40));
  r.style.setProperty("--color-green-950", mixHex(t.primaryGreen, "#000000", 0.55));

  // Primary color overlays (replaces hardcoded rgba(0,98,51,...))
  r.style.setProperty("--p-05",  hexToRgba(t.primaryGreen, 0.05));
  r.style.setProperty("--p-08",  hexToRgba(t.primaryGreen, 0.08));
  r.style.setProperty("--p-10",  hexToRgba(t.primaryGreen, 0.10));
  r.style.setProperty("--p-12",  hexToRgba(t.primaryGreen, 0.12));
  r.style.setProperty("--p-15",  hexToRgba(t.primaryGreen, 0.15));
  r.style.setProperty("--p-18",  hexToRgba(t.primaryGreen, 0.18));
  r.style.setProperty("--p-20",  hexToRgba(t.primaryGreen, 0.20));
  r.style.setProperty("--p-25",  hexToRgba(t.primaryGreen, 0.25));
  r.style.setProperty("--p-30",  hexToRgba(t.primaryGreen, 0.30));
  r.style.setProperty("--p-35",  hexToRgba(t.primaryGreen, 0.35));
  r.style.setProperty("--p-40",  hexToRgba(t.primaryGreen, 0.40));
  r.style.setProperty("--p-60",  hexToRgba(t.primaryGreen, 0.60));

  // Cache to localStorage for instant re-apply on next load
  try { localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(t)); } catch {}
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

// Apply cached theme synchronously at module load (eliminates flash of default green)
try {
  const cached = localStorage.getItem(THEME_CACHE_KEY);
  if (cached) applyTheme(JSON.parse(cached));
  else applyTheme(DEFAULT_THEME);
} catch {
  applyTheme(DEFAULT_THEME);
}

export function useTheme() {
  useEffect(() => {
    const unsub = subscribeToTheme((theme) => {
      applyTheme(theme);
    });
    return unsub;
  }, []);
}
