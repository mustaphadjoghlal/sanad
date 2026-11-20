import { useState } from "react";

/** How many cards a list page renders before "عرض المزيد". */
export const PAGE_STEP = 24;

/**
 * Renders a list a page at a time. Every card carries a picture, and drawing
 * two hundred of them at once is what made long lists slow on a phone; the
 * data is already in memory, so "more" is instant.
 */
export function useShowMore<T>(items: T[], step = PAGE_STEP) {
  const [count, setCount] = useState(step);
  return {
    shown: items.slice(0, count),
    remaining: Math.max(0, items.length - count),
    more: () => setCount((c) => c + step),
  };
}
