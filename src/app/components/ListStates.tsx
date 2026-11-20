/** Sits as the last cell of a grid and spans the full row. */
export function ShowMore({ remaining, onMore }: { remaining: number; onMore: () => void }) {
  if (remaining <= 0) return null;
  return (
    <div className="col-span-full flex justify-center pt-4">
      <button
        type="button"
        onClick={onMore}
        className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
        style={{ background: "var(--p-10)", border: "1px solid var(--p-25)", color: "var(--theme-text, #e8e8e8)" }}
      >
        عرض المزيد ({remaining})
      </button>
    </div>
  );
}

/**
 * The shape of the cards that are about to arrive, so the page is laid out
 * from the first frame and nothing jumps when the data lands.
 */
export function CardGridSkeleton({ count = 6, withImage = true }: { count?: number; withImage?: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true" aria-label="جاري التحميل">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden animate-pulse"
          style={{ background: "linear-gradient(145deg,#141414,#101010)", border: "1px solid var(--p-15)" }}
        >
          {withImage && <div style={{ height: "160px", background: "var(--p-10)" }} />}
          <div className="p-4 space-y-3">
            <div style={{ height: "16px", background: "var(--p-10)", borderRadius: "4px", width: "70%" }} />
            <div style={{ height: "12px", background: "var(--p-08)", borderRadius: "4px", width: "50%" }} />
            <div style={{ height: "12px", background: "var(--p-08)", borderRadius: "4px", width: "40%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Rows, for the search results. */
export function RowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="جاري التحميل">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 rounded-xl animate-pulse"
          style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-15)" }}
        >
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--p-10)", flexShrink: 0 }} />
          <div className="flex-1 space-y-2">
            <div style={{ height: "12px", background: "var(--p-10)", borderRadius: "4px", width: "60%" }} />
            <div style={{ height: "10px", background: "var(--p-08)", borderRadius: "4px", width: "35%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
