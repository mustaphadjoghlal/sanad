/**
 * Serves social crawlers a real HTML document with per-page Open Graph tags.
 *
 * The site is a client-rendered SPA, so Facebook, WhatsApp, Twitter, LinkedIn
 * and Telegram — none of which run JavaScript — used to read index.html for
 * every URL and show the same generic card for a job, an article and a
 * profile alike. `vercel.json` routes crawler user-agents here; real browsers
 * never touch this function and still get the SPA.
 */

const SITE_ORIGIN = "https://sanadz.media";
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og-image.png`;
const SITE_NAME = "منصة سند الإعلامية";
const DEFAULT_TITLE = "منصة سند الإعلامية | المنصة الإعلامية الجزائرية الشاملة";
const DEFAULT_DESCRIPTION =
  "منصة سند الإعلامية — المنصة الجزائرية الإعلامية الشاملة. دورات تدريبية، فرص عمل، معدات إعلامية، مسابقات، منشطون، ودليل القنوات الجزائرية في مكان واحد.";

// route prefix -> { collection, title field, description field, image field }
const ROUTES = {
  jobs: { collection: "jobs", title: "title", description: "description", subtitle: "company" },
  courses: { collection: "courses", title: "title", description: "description", subtitle: "instructor" },
  competitions: { collection: "competitions", title: "name", description: "description", subtitle: "organizer" },
  equipment: { collection: "equipment", title: "name", description: "description", subtitle: "seller" },
  news: { collection: "news", title: "title", description: "body", subtitle: "category" },
  theses: { collection: "theses", title: "title", description: "abstract", subtitle: "author" },
  products: { collection: "products", title: "name", description: "description" },
  trainers: { collection: "users", title: "name", description: "bio", subtitle: "specialty", image: "photo" },
  profile: { collection: "users", title: "name", description: "bio", subtitle: "specialty", image: "photo" },
  channels: { collection: "channels", title: "name", description: "category" },
};

// Static pages that at least deserve their own title.
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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Content fields may hold rich text from the editor; cards want plain text. */
function toPlainText(value, maxLen = 200) {
  const text = String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

function readField(fields, name) {
  const field = fields?.[name];
  if (!field) return undefined;
  return field.stringValue ?? field.integerValue ?? field.doubleValue ?? undefined;
}

async function fetchDoc(projectId, apiKey, collection, id) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${encodeURIComponent(id)}?key=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) return null;
  const data = await res.json();
  return data.fields ?? null;
}

function render({ title, description, image, url, type }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeUrl = escapeHtml(url);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${safeTitle}</title>
<meta name="description" content="${safeDesc}" />
<link rel="canonical" href="${safeUrl}" />
<meta property="og:type" content="${escapeHtml(type)}" />
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDesc}" />
<meta property="og:image" content="${safeImage}" />
<meta property="og:url" content="${safeUrl}" />
<meta property="og:locale" content="ar_DZ" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDesc}" />
<meta name="twitter:image" content="${safeImage}" />
</head>
<body>
<h1>${safeTitle}</h1>
<p>${safeDesc}</p>
<p><a href="${safeUrl}">${escapeHtml(SITE_NAME)}</a></p>
</body>
</html>`;
}

export default async function handler(req, res) {
  const rawPath = (req.query?.path || req.url || "/").split("?")[0];
  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const url = SITE_ORIGIN + path;

  let meta = STATIC_PAGES[path] ?? { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
  let image = DEFAULT_IMAGE;
  let type = "website";

  const segments = path.split("/").filter(Boolean);
  const route = segments.length === 2 ? ROUTES[segments[0]] : null;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY;

  if (route && projectId && apiKey) {
    try {
      const fields = await fetchDoc(projectId, apiKey, route.collection, segments[1]);
      if (fields) {
        const title = readField(fields, route.title);
        const subtitle = route.subtitle ? readField(fields, route.subtitle) : undefined;
        const description = readField(fields, route.description);
        const docImage = readField(fields, route.image ?? "image");

        if (title) {
          meta = {
            title: `${toPlainText(title, 90)}${subtitle ? ` — ${toPlainText(subtitle, 50)}` : ""} | ${SITE_NAME}`,
            description: toPlainText(description) || DEFAULT_DESCRIPTION,
          };
          type = "article";
          if (docImage && String(docImage).startsWith("http")) image = String(docImage);
        }
      }
    } catch {
      // A slow or failing lookup must never break the crawler's request —
      // fall through to the site-wide card.
    }
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");
  return res.status(200).send(render({ ...meta, image, url, type }));
}
