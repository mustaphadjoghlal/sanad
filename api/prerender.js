/**
 * Serves crawlers a real HTML document for any URL on the site.
 *
 * The site is a client-rendered SPA: without JavaScript every URL returns the
 * same shell with an empty <div id="root">. Social crawlers do not run
 * JavaScript at all, and while Google can, it defers rendering to a second
 * pass that a new domain waits a long way back in — and until that pass runs
 * it sees a page with no heading, no text, and, crucially, not one crawlable
 * <a href> to follow. Nothing links to anything.
 *
 * So this function renders the same content the SPA would, from the same
 * Firestore documents: the real heading and body on a detail page, the real
 * list of items on a listing page, and a nav on every page so any entry point
 * leads to the rest of the site. Search engines and social crawlers are both
 * routed here by user-agent in `vercel.json`; a browser never touches it.
 *
 * What is served here must stay what a visitor sees. It comes from the same
 * documents and applies the same `status == approved` filter, so the two do
 * not drift.
 */

const SITE_ORIGIN = "https://sanadz.media";
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og-image.png`;
const SITE_NAME = "منصة سند الإعلامية";
const DEFAULT_TITLE = "منصة سند الإعلامية | المنصة الإعلامية الجزائرية الشاملة";
const DEFAULT_DESCRIPTION =
  "منصة سند الإعلامية — المنصة الجزائرية الإعلامية الشاملة. دورات تدريبية، فرص عمل، معدات إعلامية، مسابقات، منشطون، ودليل القنوات الجزائرية في مكان واحد.";

const PUBLISHER = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_ORIGIN,
  logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}/icon-512.png` },
};

const CHANNEL_KIND = { tv: "قناة تلفزيونية", radio: "إذاعة", website: "موقع إلكتروني" };

/**
 * route prefix -> how to read a document of that kind.
 *
 * `facts` is the labelled detail beside the body. It is what makes a channel
 * page worth having: the whole value of that entry is its frequency, address
 * and contact details, and those are what people search for ("تردد قناة…").
 */
const ROUTES = {
  jobs: {
    collection: "jobs", title: "title", description: "description", subtitle: "company",
    schema: "JobPosting",
    facts: [["الجهة", "company"], ["الولاية", "location"], ["نوع الوظيفة", "jobType"], ["آخر أجل", "deadline"]],
  },
  courses: {
    collection: "courses", title: "title", description: "description", subtitle: "instructor",
    schema: "Course",
    facts: [["المدرّب", "instructor"], ["المدة", "duration"]],
  },
  competitions: {
    collection: "competitions", title: "name", description: "description", subtitle: "organizer",
    schema: "Event",
    facts: [["الجهة المنظّمة", "organizer"], ["تاريخ البداية", "startDate"], ["تاريخ النهاية", "endDate"]],
  },
  equipment: {
    collection: "equipment", title: "name", description: "description", subtitle: "seller",
    schema: "Product",
    facts: [["البائع", "seller"], ["الصنف", "category"], ["السعر", "price"], ["الحالة", "condition"]],
  },
  news: {
    collection: "news", title: "title", description: "body", subtitle: "category",
    schema: "NewsArticle",
    facts: [["القسم", "category"], ["التاريخ", "date"]],
  },
  theses: {
    collection: "theses", title: "title", description: "abstract", subtitle: "author",
    schema: "ScholarlyArticle",
    facts: [["الباحث", "author"], ["الجامعة", "university"], ["السنة", "year"], ["التخصص", "specialty"], ["المشرف", "supervisor"]],
  },
  products: {
    collection: "products", title: "name", description: "description",
    schema: "Product",
    facts: [["الصنف", "category"], ["السعر", "price"]],
  },
  trainers: {
    collection: "users", title: "name", description: "bio", subtitle: "specialty", image: "photo",
    schema: "Person",
    facts: [["التخصص", "specialty"], ["الولاية", "location"], ["المؤسسة", "organization"]],
  },
  profile: {
    collection: "users", title: "name", description: "bio", subtitle: "specialty", image: "photo",
    schema: "Person",
    facts: [["التخصص", "specialty"], ["الولاية", "location"], ["الخبرة", "experience"]],
  },
  channels: {
    collection: "channels", title: "name", description: "category",
    schema: "BroadcastService",
    facts: [
      ["النوع", "type"], ["التصنيف", "category"], ["التردد", "frequency"],
      ["الموقع الإلكتروني", "website"], ["العنوان", "address"],
      ["الهاتف", "phone"], ["البريد الإلكتروني", "email"],
    ],
    // A channel has no prose, so its description is composed from its own
    // fields — "قناة الشروق TV — قناة تلفزيونية خاصة، التردد 12360" rather
    // than the bare word "خاصة", which is what it used to be.
    describe: (fields, name) => {
      const kind = CHANNEL_KIND[readField(fields, "type")] ?? "";
      const category = readField(fields, "category") ?? "";
      const frequency = readField(fields, "frequency");
      const website = readField(fields, "website");
      const address = readField(fields, "address");
      return [
        `${name} — ${[kind, category].filter(Boolean).join(" ")}`.trim(),
        frequency ? `التردد: ${frequency}` : "",
        address ? `العنوان: ${address}` : "",
        website ? `الموقع: ${website}` : "",
        "ضمن دليل القنوات التلفزيونية والإذاعية والمواقع الإخبارية الجزائرية على منصة سند.",
      ]
        .filter(Boolean)
        .join(" · ");
    },
  },
};

/**
 * Page titles that match how people search.
 *
 * "إذاعة الثالثة | منصة سند" describes the entry. "تردد إذاعة الثالثة" is
 * what someone types into Google. Where the document holds the fact behind
 * the query, the title says so.
 */
const TITLES = {
  channels: (fields, name) => {
    const kind = CHANNEL_KIND[readField(fields, "type")] ?? "";
    const category = readField(fields, "category") ?? "";
    return readField(fields, "frequency")
      ? `تردد ${name} — ${[kind, category].filter(Boolean).join(" ")}`
      : `${name} — ${[kind, category].filter(Boolean).join(" ")}`;
  },
  theses: (fields, name) => {
    const university = readField(fields, "university");
    const year = readField(fields, "year");
    return `${name} — مذكرة تخرج${university ? ` · ${university}` : ""}${year ? ` ${year}` : ""}`;
  },
  jobs: (fields, name) => {
    const company = readField(fields, "company");
    return `${name}${company ? ` — ${company}` : ""}`;
  },
};

/**
 * How a detail page finds its neighbours.
 *
 * Until now every page on the site was an island: nothing linked to anything
 * else of the same kind, so a crawler that reached one channel had no way to
 * reach the next, and a reader had nowhere to go but back. `field` is what
 * two entries must share to count as related; null means "anything recent
 * from the same collection".
 */
const RELATED = {
  channels: { field: "category", label: "قنوات أخرى في نفس التصنيف", path: "channels" },
  theses: { field: "specialty", label: "مذكرات أخرى في نفس التخصص", path: "theses" },
  jobs: { field: null, label: "فرص عمل أخرى", path: "jobs" },
  courses: { field: null, label: "دورات أخرى", path: "courses" },
  news: { field: "category", label: "أخبار أخرى في نفس القسم", path: "news" },
  competitions: { field: null, label: "مسابقات أخرى", path: "competitions" },
  equipment: { field: "category", label: "عتاد آخر من نفس الصنف", path: "equipment" },
};

/** Field values that are codes rather than words a reader wants to see. */
const FACT_LABELS = {
  type: CHANNEL_KIND,
  condition: { new: "جديد", used: "مستعمل" },
  jobType: {},
};

// Listing pages, and the collection each one lists.
const LISTINGS = {
  "/jobs": { collection: "jobs", path: "jobs", title: "title", subtitle: "company", description: "description" },
  "/courses": { collection: "courses", path: "courses", title: "title", subtitle: "instructor", description: "description" },
  "/news": { collection: "news", path: "news", title: "title", subtitle: "category", description: "body" },
  "/competitions": { collection: "competitions", path: "competitions", title: "name", subtitle: "organizer", description: "description" },
  "/equipment": { collection: "equipment", path: "equipment", title: "name", subtitle: "seller", description: "description" },
  "/theses": { collection: "theses", path: "theses", title: "title", subtitle: "author", description: "abstract" },
  "/channels": { collection: "channels", path: "channels", title: "name", subtitle: "category", description: "category" },
};

// Listing pages backed by /users, which needs a filtered query.
const USER_LISTINGS = {
  "/professionals": { exclude: ["store", "trainer"], path: "profile" },
  "/trainers": { only: ["trainer"], path: "trainers" },
  "/stores": { only: ["store"], path: "stores" },
};

const STATIC_PAGES = {
  "/": { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  "/jobs": { title: "فرص العمل في الإعلام الجزائري", description: "أحدث عروض التوظيف والتربصات في القنوات والمؤسسات الإعلامية الجزائرية." },
  "/courses": { title: "الدورات التدريبية", description: "دورات تدريبية مجانية ومدفوعة في الصحافة، التصوير، المونتاج والتقديم." },
  "/equipment": { title: "سوق العتاد الإعلامي", description: "بيع وشراء الكاميرات، الميكروفونات، الإضاءة ومعدات الإنتاج في الجزائر." },
  "/competitions": { title: "المسابقات الإعلامية", description: "مسابقات جامعية ووطنية ودولية في مجال الإعلام والاتصال." },
  "/channels": { title: "دليل القنوات الجزائرية", description: "دليل القنوات التلفزيونية والإذاعية والمواقع الإخبارية الجزائرية." },
  "/news": { title: "أخبار سند", description: "آخر أخبار الإعلام الجزائري — قنوات جديدة، مسابقات، فرص عمل، وأكثر." },
  "/theses": { title: "مذكرات التخرج", description: "مذكرات تخرج في تخصصات الإعلام والاتصال والصحافة والسمعي البصري." },
  "/stores": { title: "دليل متاجر العتاد الإعلامي", description: "دليل متاجر بيع وشراء المعدات الإعلامية في الجزائر." },
  "/trainers": { title: "مراكز ومدربو الإعلام", description: "دليل المدربين ومراكز التكوين في مجال الإعلام بالجزائر." },
  "/professionals": { title: "دليل المحترفين", description: "دليل الصحفيين والمصورين والمونتاج والمعلقين الصوتيين في الجزائر." },
  "/about": { title: "من نحن", description: "تعرّف على منصة سند الإعلامية ورسالتها." },
  "/privacy": { title: "سياسة الخصوصية", description: "كيف تجمع منصة سند بياناتك وتستعملها وتحميها." },
  "/terms": { title: "شروط الاستخدام", description: "شروط استخدام منصة سند الإعلامية." },
};

// The same links the site's own header carries, so a crawler landing on any
// page can reach every section from it.
const NAV = [
  ["/", "الرئيسية"],
  ["/jobs", "فرص العمل"],
  ["/courses", "الدورات"],
  ["/news", "الأخبار"],
  ["/competitions", "المسابقات"],
  ["/equipment", "العتاد"],
  ["/channels", "القنوات"],
  ["/professionals", "المحترفون"],
  ["/trainers", "المدربون"],
  ["/stores", "المتاجر"],
  ["/theses", "المذكرات"],
  ["/about", "من نحن"],
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Content fields hold rich text from the editor; strip it back to prose. */
function toPlainText(value, maxLen = 200) {
  const text = String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

/**
 * The body of a detail page, kept as paragraphs.
 *
 * The old version truncated everything to 200 characters, which is right for
 * a social card and useless as a page: a job ad reduced to its first sentence
 * is exactly the thin content that should not be served to a search engine.
 */
function toParagraphs(value, maxLen = 8000) {
  const blocks = String(value ?? "")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const out = [];
  let used = 0;
  for (const block of blocks) {
    if (used + block.length > maxLen) break;
    out.push(block);
    used += block.length;
  }
  return out;
}

function readField(fields, name) {
  const field = fields?.[name];
  if (!field) return undefined;
  return field.stringValue ?? field.integerValue ?? field.doubleValue ?? undefined;
}

function firestoreBase(projectId) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

async function fetchDoc(projectId, apiKey, collection, id) {
  const url = `${firestoreBase(projectId)}/${collection}/${encodeURIComponent(id)}?key=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) return null;
  return (await res.json()).fields ?? null;
}

async function fetchCollection(projectId, apiKey, collection, pageSize = 60) {
  const url = `${firestoreBase(projectId)}/${collection}?pageSize=${pageSize}&key=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return [];
  const docs = (await res.json()).documents ?? [];
  // Pending and rejected submissions are not on the site, so they are not here.
  return docs.filter((d) => {
    const status = d.fields?.status?.stringValue;
    return !status || status === "approved";
  });
}

/**
 * The rules reject an unfiltered list of /users, because it could return a
 * pending profile. A query filtered to approved ones is provably safe.
 */
async function fetchApprovedUsers(projectId, apiKey) {
  const res = await fetch(`${firestoreBase(projectId)}:runQuery?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "users" }],
        where: {
          fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "approved" } },
        },
        limit: 200,
      },
    }),
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return [];
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).map((r) => r.document).filter(Boolean);
}

function docId(doc) {
  return doc.name.split("/").pop();
}

/** Structured data for a detail page, mirroring what the SPA emits. */
function buildSchema(kind, { title, description, url, image, subtitle, fields }) {
  const base = { "@context": "https://schema.org", "@type": kind, url };
  const iso = (value) => {
    if (!value) return undefined;
    const d = new Date(Number(value) || value);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  };
  const created = iso(readField(fields, "createdAt"));

  const shapes = {
    JobPosting: {
      title,
      description,
      datePosted: created,
      hiringOrganization: subtitle ? { "@type": "Organization", name: subtitle } : PUBLISHER,
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: readField(fields, "location") || undefined,
          addressCountry: "DZ",
        },
      },
      identifier: { "@type": "PropertyValue", name: "sanad", value: url.split("/").pop() },
    },
    NewsArticle: {
      headline: toPlainText(title, 110),
      description,
      datePublished: iso(readField(fields, "date")) ?? created,
      articleSection: subtitle,
      author: PUBLISHER,
      publisher: PUBLISHER,
      inLanguage: "ar",
    },
    Course: {
      name: title,
      description,
      provider: subtitle ? { "@type": "Organization", name: subtitle } : PUBLISHER,
      inLanguage: "ar",
    },
    Event: {
      name: title,
      description,
      startDate: iso(readField(fields, "startDate")),
      endDate: iso(readField(fields, "endDate")),
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: { "@type": "VirtualLocation", url },
      organizer: subtitle ? { "@type": "Organization", name: subtitle } : PUBLISHER,
    },
    ScholarlyArticle: {
      headline: toPlainText(title, 110),
      name: title,
      abstract: description,
      author: subtitle ? { "@type": "Person", name: subtitle } : undefined,
      publisher: PUBLISHER,
      inLanguage: "ar",
    },
    Product: {
      name: title,
      description,
      offers: {
        "@type": "Offer",
        price: readField(fields, "price"),
        priceCurrency: "DZD",
        availability: "https://schema.org/InStock",
        url,
      },
    },
    Person: {
      name: title,
      description,
      jobTitle: subtitle,
      address: readField(fields, "location")
        ? { "@type": "PostalAddress", addressLocality: readField(fields, "location"), addressCountry: "DZ" }
        : undefined,
    },
    // A channel is an organisation that broadcasts, and the frequency and
    // address are the whole point of its entry — so they belong in the
    // markup, not only in the prose.
    BroadcastService: {
      "@type":
        readField(fields, "type") === "radio"
          ? "RadioStation"
          : readField(fields, "type") === "tv"
          ? "TelevisionStation"
          : "Organization",
      name: title,
      description,
      broadcastFrequency: readField(fields, "frequency"),
      areaServed: { "@type": "Country", name: "الجزائر" },
      address: readField(fields, "address")
        ? { "@type": "PostalAddress", streetAddress: readField(fields, "address"), addressCountry: "DZ" }
        : undefined,
      telephone: readField(fields, "phone"),
      email: readField(fields, "email"),
      sameAs: ["website", "facebook", "youtube", "instagram", "twitter"]
        .map((k) => readField(fields, k))
        .filter((v) => v && String(v).startsWith("http")),
      inLanguage: "ar",
    },
  };

  const shape = shapes[kind];
  if (!shape) return null;
  // A shape may choose a narrower @type than the key it was looked up by.
  if (shape["@type"]) base["@type"] = shape["@type"];
  if (image && image !== DEFAULT_IMAGE) shape.image = image;

  // Google warns about properties that are present but empty.
  const cleaned = Object.fromEntries(
    Object.entries({ ...base, ...shape }).filter(
      ([, v]) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0)
    )
  );
  return cleaned;
}

function breadcrumbs(trail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "الرئيسية", path: "/" }, ...trail].map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: SITE_ORIGIN + c.path,
    })),
  };
}

function navHtml() {
  return `<nav><ul>${NAV.map(
    ([path, label]) => `<li><a href="${escapeHtml(SITE_ORIGIN + path)}">${escapeHtml(label)}</a></li>`
  ).join("")}</ul></nav>`;
}

function render({ title, description, image, url, type, bodyHtml, schemas }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const ld = (schemas || [])
    .filter(Boolean)
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, "\\u003c")}</script>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${safeTitle}</title>
<meta name="description" content="${safeDesc}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${escapeHtml(url)}" />
<meta property="og:type" content="${escapeHtml(type)}" />
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDesc}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:url" content="${escapeHtml(url)}" />
<meta property="og:locale" content="ar_DZ" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDesc}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
${ld}
</head>
<body>
<header><a href="${SITE_ORIGIN}/">${escapeHtml(SITE_NAME)}</a></header>
${navHtml()}
<main>
${bodyHtml}
</main>
</body>
</html>`;
}

/**
 * Other entries of the same kind, as links.
 *
 * This is what turns a pile of isolated pages into a site: a reader gets
 * somewhere to go next, and a crawler that reaches any one page can walk to
 * the rest without going back to a listing.
 */
async function relatedHtml(projectId, apiKey, section, fields, selfId) {
  const spec = RELATED[section];
  if (!spec) return "";

  const docs = await fetchCollection(projectId, apiKey, ROUTES[section].collection, 80);
  const mine = spec.field ? readField(fields, spec.field) : null;

  const items = docs
    .filter((d) => docId(d) !== selfId)
    .filter((d) => (mine ? readField(d.fields, spec.field) === mine : true))
    .slice(0, 8)
    .map((d) => {
      const name = readField(d.fields, ROUTES[section].title);
      if (!name) return null;
      return `<li><a href="${escapeHtml(`${SITE_ORIGIN}/${spec.path}/${docId(d)}`)}">${escapeHtml(
        toPlainText(name, 120)
      )}</a></li>`;
    })
    .filter(Boolean);

  if (items.length === 0) return "";
  return `<section><h2>${escapeHtml(spec.label)}</h2><ul>${items.join("")}</ul></section>`;
}

/** The entry's own links, shown rather than only declared in sameAs. */
function outboundHtml(fields) {
  const links = [
    ["الموقع الإلكتروني", "website"],
    ["فيسبوك", "facebook"],
    ["يوتيوب", "youtube"],
    ["إنستغرام", "instagram"],
    ["إكس (تويتر)", "twitter"],
  ]
    .map(([label, field]) => [label, readField(fields, field)])
    .filter(([, href]) => href && String(href).startsWith("http"));

  if (links.length === 0) return "";
  return `<section><h2>روابط</h2><ul>${links
    .map(
      ([label, href]) =>
        `<li><a href="${escapeHtml(href)}" rel="nofollow noopener">${escapeHtml(label)}</a></li>`
    )
    .join("")}</ul></section>`;
}

/** A listing page's items, as real links a crawler can follow. */
function listHtml(items) {
  if (items.length === 0) return "";
  return `<ul>${items
    .map(
      (item) =>
        `<li><a href="${escapeHtml(SITE_ORIGIN + item.path)}"><h2>${escapeHtml(item.title)}</h2></a>` +
        (item.subtitle ? `<p>${escapeHtml(item.subtitle)}</p>` : "") +
        (item.description ? `<p>${escapeHtml(item.description)}</p>` : "") +
        `</li>`
    )
    .join("")}</ul>`;
}

export default async function handler(req, res) {
  const rawPath = (req.query?.path || req.url || "/").split("?")[0];
  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const url = SITE_ORIGIN + path;

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY;

  let meta = STATIC_PAGES[path] ?? { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
  let image = DEFAULT_IMAGE;
  let type = "website";
  let bodyHtml = "";
  const schemas = [];

  const segments = path.split("/").filter(Boolean);
  const route = segments.length === 2 ? ROUTES[segments[0]] : null;

  try {
    if (route && projectId && apiKey) {
      // ── A single item ──────────────────────────────────────────
      const fields = await fetchDoc(projectId, apiKey, route.collection, segments[1]);
      const title = fields ? readField(fields, route.title) : undefined;

      if (title) {
        const subtitle = route.subtitle ? readField(fields, route.subtitle) : undefined;
        const raw = readField(fields, route.description);
        const docImage = readField(fields, route.image ?? "image");
        const heading = toPlainText(title, 160);
        // A channel carries no prose of its own, so its text is composed from
        // its fields; everything else has a real body to show.
        const composed = route.describe ? route.describe(fields, heading) : null;
        const paragraphs = toParagraphs(composed ?? raw);

        const headline = TITLES[segments[0]]
          ? TITLES[segments[0]](fields, heading)
          : `${toPlainText(title, 90)}${subtitle ? ` — ${toPlainText(subtitle, 50)}` : ""}`;
        meta = {
          title: `${toPlainText(headline, 110)} | ${SITE_NAME}`,
          description: toPlainText(composed ?? raw, 300) || DEFAULT_DESCRIPTION,
        };
        type = "article";
        if (docImage && String(docImage).startsWith("http")) image = String(docImage);

        const facts = (route.facts ?? [])
          .map(([label, field]) => {
            const raw = readField(fields, field);
            if (raw == null || raw === "") return null;
            // Some fields hold a code ("tv", "used"); show the word instead.
            const mapped = FACT_LABELS[field]?.[raw] ?? raw;
            return [label, String(mapped)];
          })
          .filter(Boolean);

        bodyHtml =
          `<article>` +
          `<h1>${escapeHtml(heading)}</h1>` +
          (facts.length
            ? `<dl>${facts
                .map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(toPlainText(v, 120))}</dd>`)
                .join("")}</dl>`
            : "") +
          (paragraphs.length
            ? paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")
            : `<p>${escapeHtml(meta.description)}</p>`) +
          `</article>` +
          outboundHtml(fields) +
          (await relatedHtml(projectId, apiKey, segments[0], fields, segments[1]).catch(() => ""));

        if (route.schema) {
          schemas.push(
            buildSchema(route.schema, {
              title: heading,
              description: meta.description,
              url,
              image,
              subtitle: subtitle ? toPlainText(subtitle, 120) : undefined,
              fields,
            })
          );
        }
        const section = STATIC_PAGES[`/${segments[0]}`];
        if (section) {
          schemas.push(
            breadcrumbs([
              { name: section.title, path: `/${segments[0]}` },
              { name: heading, path },
            ])
          );
        }
      }
    } else if (LISTINGS[path] && projectId && apiKey) {
      // ── A listing of content ───────────────────────────────────
      const spec = LISTINGS[path];
      const docs = await fetchCollection(projectId, apiKey, spec.collection);
      const items = docs
        .map((d) => {
          const title = readField(d.fields, spec.title);
          if (!title) return null;
          return {
            path: `/${spec.path}/${docId(d)}`,
            title: toPlainText(title, 160),
            subtitle: spec.subtitle ? toPlainText(readField(d.fields, spec.subtitle), 80) : "",
            description: toPlainText(readField(d.fields, spec.description), 180),
          };
        })
        .filter(Boolean);

      bodyHtml = `<h1>${escapeHtml(meta.title)}</h1><p>${escapeHtml(meta.description)}</p>${listHtml(items)}`;
      schemas.push(breadcrumbs([{ name: meta.title, path }]));
    } else if (USER_LISTINGS[path] && projectId && apiKey) {
      // ── A listing of people ────────────────────────────────────
      const spec = USER_LISTINGS[path];
      const docs = await fetchApprovedUsers(projectId, apiKey);
      const items = docs
        .map((d) => {
          const userType = readField(d.fields, "type");
          if (spec.only && !spec.only.includes(userType)) return null;
          if (spec.exclude && spec.exclude.includes(userType)) return null;
          const name = readField(d.fields, "name");
          if (!name) return null;
          const username = readField(d.fields, "username");
          const id = spec.path === "stores" ? username || docId(d) : docId(d);
          return {
            path: `/${spec.path}/${id}`,
            title: toPlainText(name, 120),
            subtitle: toPlainText(readField(d.fields, "specialty"), 80),
            description: toPlainText(readField(d.fields, "bio"), 180),
          };
        })
        .filter(Boolean);

      bodyHtml = `<h1>${escapeHtml(meta.title)}</h1><p>${escapeHtml(meta.description)}</p>${listHtml(items)}`;
      schemas.push(breadcrumbs([{ name: meta.title, path }]));
    }
  } catch {
    // A slow or failing lookup must never break the crawler's request — the
    // page below still carries its title, description and the site nav.
  }

  if (!bodyHtml) {
    bodyHtml = `<h1>${escapeHtml(meta.title)}</h1><p>${escapeHtml(meta.description)}</p>`;
    if (path === "/") {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_ORIGIN,
        description: DEFAULT_DESCRIPTION,
        inLanguage: "ar",
        publisher: PUBLISHER,
      });
    }
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");
  return res.status(200).send(render({ ...meta, image, url, type, bodyHtml, schemas }));
}
