/**
 * The front page's lists, served from the CDN.
 *
 * On a first visit the page used to wait for Firestore to open its live
 * connection before it could show a single job — on a slow mobile network
 * that took around ten seconds, with skeletons where the content should be.
 * This endpoint answers the same queries once a minute for everyone, so the
 * page fills from one cached request; the live listeners still take over as
 * soon as they connect.
 *
 * Read through the public REST API with the web API key, like the sitemap
 * and the search index: the security rules still decide what is visible.
 */

const FETCH = 30; // same headroom the page's own listeners use

/** Firestore's typed REST values, back to plain JSON. */
function decode(v) {
  if (!v || typeof v !== "object") return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return Date.parse(v.timestampValue);
  if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(decode);
  if ("mapValue" in v) return decodeFields(v.mapValue.fields ?? {});
  return undefined;
}

function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decode(v);
  return out;
}

const toDoc = (d) => ({ id: d.name.split("/").pop(), ...decodeFields(d.fields ?? {}) });

async function runQuery(base, apiKey, structuredQuery) {
  const res = await fetch(`${base}:runQuery?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`runQuery ${res.status}`);
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).map((r) => r.document).filter(Boolean).map(toDoc);
}

/** One section failing leaves that section to the live listener. */
const settle = (p) => p.catch((e) => { console.error("home:", e.message); return null; });

const ordered = (collectionId, field, direction, limit) => ({
  from: [{ collectionId }],
  orderBy: [{ field: { fieldPath: field }, direction }],
  limit,
});

const featured = (collectionId) => ({
  from: [{ collectionId }],
  where: { fieldFilter: { field: { fieldPath: "featured" }, op: "EQUAL", value: { booleanValue: true } } },
  limit: 50,
});

const approved = (d) => d.status === "approved" || !d.status;

export default async function handler(req, res) {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!projectId || !apiKey) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).json({ ok: false, error: "not configured" });
  }
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  const [jobs, comps, news, courses, equipment, works] = await Promise.all([
    settle(runQuery(base, apiKey, ordered("jobs", "createdAt", "DESCENDING", FETCH))),
    settle(runQuery(base, apiKey, ordered("competitions", "startDate", "ASCENDING", FETCH))),
    settle(runQuery(base, apiKey, ordered("news", "createdAt", "DESCENDING", 3))),
    settle(runQuery(base, apiKey, featured("courses"))),
    settle(runQuery(base, apiKey, featured("equipment"))),
    settle(runQuery(base, apiKey, {
      from: [{ collectionId: "works" }],
      orderBy: [
        { field: { fieldPath: "featured" }, direction: "DESCENDING" },
        { field: { fieldPath: "createdAt" }, direction: "DESCENDING" },
      ],
      limit: 12,
    })),
  ]);

  const byNewest = (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0);
  const body = {
    ok: true,
    // Same filtering and order the page applies to its live data.
    jobs: jobs && jobs.filter(approved).sort(byNewest).slice(0, 8),
    competitions: comps && comps.filter(approved)
      .sort((a, b) => String(a.startDate ?? "").localeCompare(String(b.startDate ?? ""))).slice(0, 8),
    news,
    courses: courses && courses.filter(approved).sort(byNewest),
    equipment: equipment && equipment.filter(approved).sort(byNewest).slice(0, 3),
    works,
  };

  // Public data only. A minute is fresh enough for a front page, and the
  // live listeners correct it the moment they connect.
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
  return res.status(200).json(body);
}
