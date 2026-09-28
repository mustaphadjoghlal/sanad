/**
 * Generates the sitemap from Firestore.
 *
 * The static file it replaces listed 15 landing pages and nothing else, so
 * every job, article, course, competition, thesis and profile was left for a
 * crawler to discover by walking the listing pages — slow for a
 * client-rendered site, and slowest exactly where freshness matters most.
 *
 * `vercel.json` rewrites /sitemap.xml here.
 */

const SITE = "https://sanadz.media";

// collection -> { path, changefreq, priority, image }
//
// `image` names the field holding the entry's picture. Listing it here tells
// Google the image directly instead of leaving it to be discovered, which for
// a site whose pages are barely crawled meant not at all. Profiles carry a
// photo too and deliberately do not list it: a member's face belongs on their
// page, not in an image search.
const SOURCES = [
  { collection: "jobs", path: "jobs", changefreq: "daily", priority: "0.8", image: "image" },
  { collection: "news", path: "news", changefreq: "daily", priority: "0.8", image: "image" },
  { collection: "courses", path: "courses", changefreq: "weekly", priority: "0.7", image: "image" },
  { collection: "competitions", path: "competitions", changefreq: "weekly", priority: "0.7", image: "image" },
  { collection: "works", path: "works", changefreq: "weekly", priority: "0.7", image: "cover" },
  { collection: "theses", path: "theses", changefreq: "monthly", priority: "0.6" },
  { collection: "channels", path: "channels", changefreq: "monthly", priority: "0.6" },
  { collection: "equipment", path: "equipment", changefreq: "weekly", priority: "0.6", image: "image" },
];

const STATIC_PAGES = [
  ["/", "daily", "1.0"],
  ["/jobs", "daily", "0.9"],
  ["/courses", "daily", "0.9"],
  ["/news", "daily", "0.9"],
  ["/competitions", "weekly", "0.8"],
  ["/equipment", "weekly", "0.8"],
  ["/channels", "weekly", "0.8"],
  ["/stores", "weekly", "0.8"],
  ["/professionals", "weekly", "0.8"],
  ["/works", "weekly", "0.8"],
  ["/trainers", "weekly", "0.8"],
  ["/theses", "weekly", "0.7"],
  ["/about", "monthly", "0.5"],
  ["/register", "monthly", "0.6"],
  ["/privacy", "yearly", "0.3"],
  ["/terms", "yearly", "0.3"],
];

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isoDay(ms) {
  const d = new Date(Number(ms));
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/**
 * `images` are the entry's pictures. Only <image:loc> is emitted — Google
 * stopped reading the caption, title, licence and geo tags in 2022, so
 * writing them would be noise.
 */
function urlEntry(loc, lastmod, changefreq, priority, images = []) {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    ...images.map((src) => `    <image:image><image:loc>${escapeXml(src)}</image:loc></image:image>`),
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

/** A picture only counts if it is a real, absolute URL. */
function pictureOf(doc, field) {
  if (!field) return [];
  const src = doc.fields?.[field]?.stringValue;
  return src && src.startsWith("http") ? [src] : [];
}

async function fetchCollection(base, apiKey, collection) {
  // Public collections are readable without auth, which is exactly what the
  // security rules allow; nothing private is exposed here.
  const url = `${base}/${collection}?pageSize=300&key=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return [];
  const data = await res.json();
  return data.documents ?? [];
}

/**
 * The security rules reject a bare list of /users, because such a query could
 * return a pending profile. A query that filters on status == "approved" is
 * provably safe, so that is the one to send.
 */
async function fetchApprovedUsers(base, apiKey) {
  const res = await fetch(`${base}:runQuery?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "users" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "status" },
            op: "EQUAL",
            value: { stringValue: "approved" },
          },
        },
        limit: 500,
      },
    }),
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return [];
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).map((r) => r.document).filter(Boolean);
}

export default async function handler(req, res) {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY;

  const entries = STATIC_PAGES.map(([p, cf, pr]) => urlEntry(SITE + p, null, cf, pr));

  if (projectId && apiKey) {
    const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
    try {
      const results = await Promise.all(
        SOURCES.map(async (src) => {
          const docs = await fetchCollection(base, apiKey, src.collection);
          return docs
            .filter((d) => {
              // Pending and rejected submissions must not be advertised.
              const status = d.fields?.status?.stringValue;
              return !status || status === "approved";
            })
            .map((d) => {
              const id = d.name.split("/").pop();
              const createdAt = d.fields?.createdAt?.integerValue ?? d.fields?.createdAt?.doubleValue;
              const lastmod = isoDay(createdAt) ?? (d.updateTime ? d.updateTime.slice(0, 10) : null);
              return urlEntry(
                `${SITE}/${src.path}/${id}`,
                lastmod,
                src.changefreq,
                src.priority,
                pictureOf(d, src.image)
              );
            });
        })
      );
      for (const group of results) entries.push(...group);

      // Approved public profiles: professionals, trainers and stores.
      const users = await fetchApprovedUsers(base, apiKey);
      for (const d of users) {
        const id = d.name.split("/").pop();
        const type = d.fields?.type?.stringValue;
        const username = d.fields?.username?.stringValue;
        const lastmod = isoDay(d.fields?.createdAt?.integerValue) ?? null;
        const path =
          type === "store" ? `/stores/${username || id}`
          : type === "trainer" ? `/trainers/${id}`
          : `/profile/${id}`;
        entries.push(urlEntry(SITE + path, lastmod, "monthly", "0.6"));
      }
    } catch (e) {
      // A partial sitemap beats a 500: the static pages still get served.
      console.error("sitemap: content lookup failed", e);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  return res.status(200).send(xml);
}
