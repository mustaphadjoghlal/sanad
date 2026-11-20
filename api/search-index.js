/**
 * The search page's data, built once and shared through the CDN.
 *
 * The page used to open nine live listeners and download every job, course,
 * competition, article, thesis and public profile — up to ~2,300 documents —
 * for every single visitor, then search them in the browser. On the free
 * plan's 50,000 reads a day that was about twenty searches.
 *
 * Now this endpoint reads the same documents at most once every few minutes
 * and returns only what the search needs (id, title, subtitle, the text to
 * match against). Every visitor in between gets the cached copy.
 *
 * It reads through the public REST API with the web API key, exactly as the
 * sitemap does, so the security rules still decide what is visible: nothing
 * here can return a document a signed-out visitor could not already read.
 */

const LIST_LIMIT = 200; // same cap the client listeners used
const USERS_LIMIT = 1000;
const TEXT_CAP = 2000; // characters of body/description kept for matching

function value(field) {
  if (!field) return undefined;
  if ("stringValue" in field) return field.stringValue;
  if ("integerValue" in field) return Number(field.integerValue);
  if ("doubleValue" in field) return field.doubleValue;
  if ("booleanValue" in field) return field.booleanValue;
  return undefined;
}

function str(fields, name) {
  const v = value(fields?.[name]);
  return typeof v === "string" ? v : "";
}

/** Rich-text bodies are HTML; only the words are worth matching. */
function plainText(...parts) {
  return parts
    .filter(Boolean)
    .join(" ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, TEXT_CAP);
}

async function runQuery(base, apiKey, structuredQuery) {
  const res = await fetch(`${base}:runQuery?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`runQuery ${res.status}`);
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).map((r) => r.document).filter(Boolean);
}

const newest = (collectionId) => ({
  from: [{ collectionId }],
  orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
  limit: LIST_LIMIT,
});

const isApproved = (d) => {
  const status = str(d.fields, "status");
  return !status || status === "approved";
};

const idOf = (d) => d.name.split("/").pop();

export default async function handler(req, res) {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!projectId || !apiKey) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).json({ ok: false, error: "not configured" });
  }

  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  try {
    const [jobs, courses, comps, equip, news, theses, users] = await Promise.all([
      runQuery(base, apiKey, newest("jobs")),
      runQuery(base, apiKey, newest("courses")),
      runQuery(base, apiKey, newest("competitions")),
      runQuery(base, apiKey, newest("equipment")),
      runQuery(base, apiKey, newest("news")),
      runQuery(base, apiKey, newest("theses")),
      // The rules only allow listing users with this filter.
      runQuery(base, apiKey, {
        from: [{ collectionId: "users" }],
        where: {
          fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "approved" } },
        },
        limit: USERS_LIMIT,
      }),
    ]);

    const f = (d, n) => str(d.fields, n);

    const index = {
      jobs: jobs.filter(isApproved).map((d) => ({
        id: idOf(d), title: f(d, "title"), subtitle: f(d, "company"),
        text: plainText(f(d, "title"), f(d, "company"), f(d, "location"), f(d, "jobType")),
      })),
      courses: courses.filter(isApproved).map((d) => ({
        id: idOf(d), title: f(d, "title"), subtitle: f(d, "instructor"),
        text: plainText(f(d, "title"), f(d, "instructor"), f(d, "description")),
      })),
      competitions: comps.filter(isApproved).map((d) => ({
        id: idOf(d), title: f(d, "name"), subtitle: f(d, "organizer"),
        text: plainText(f(d, "name"), f(d, "organizer"), f(d, "description")),
      })),
      equipment: equip.filter(isApproved).map((d) => ({
        id: idOf(d), title: f(d, "name"), subtitle: f(d, "category"),
        text: plainText(f(d, "name"), f(d, "category"), f(d, "description")),
      })),
      news: news.map((d) => ({
        id: idOf(d), title: f(d, "title"), subtitle: f(d, "category"),
        text: plainText(f(d, "title"), f(d, "body")),
      })),
      theses: theses.map((d) => ({
        id: idOf(d), title: f(d, "title"), subtitle: f(d, "author"),
        text: plainText(f(d, "title"), f(d, "author"), f(d, "university"), f(d, "specialty")),
      })),
      professionals: [],
      trainers: [],
      stores: [],
    };

    // Newest members first, as the client listeners sorted them.
    users.sort((a, b) => (value(b.fields?.createdAt) ?? 0) - (value(a.fields?.createdAt) ?? 0));
    for (const d of users) {
      const type = f(d, "type");
      const name = f(d, "name");
      if (type === "store") {
        index.stores.push({
          id: idOf(d), title: name, subtitle: f(d, "location"), username: f(d, "username") || undefined,
          text: plainText(name, f(d, "specialty"), f(d, "location")),
        });
        continue;
      }
      if (type === "trainer") {
        index.trainers.push({
          id: idOf(d), title: name, subtitle: f(d, "specialty") || f(d, "location"),
          text: plainText(name, f(d, "specialty"), f(d, "location"), f(d, "organization")),
        });
      }
      // Trainers also appeared among professionals before (only stores were
      // excluded there), so they still do.
      index.professionals.push({
        id: idOf(d), title: name, subtitle: f(d, "specialty") || f(d, "location"),
        text: plainText(name, f(d, "specialty"), f(d, "location"), f(d, "bio")),
      });
    }

    // Public data only, so a shared cache is safe. New content shows up in
    // search within five minutes.
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    return res.status(200).json({ ok: true, builtAt: Date.now(), index });
  } catch (e) {
    console.error("search-index: build failed", e);
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ ok: false, error: "build failed" });
  }
}
