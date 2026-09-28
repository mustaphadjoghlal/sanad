import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// @ts-expect-error — the prerenderer is plain JS served by a Vercel function.
import prerender from "../../../api/prerender.js";
// @ts-expect-error — same.
import sitemap from "../../../api/sitemap.js";

/**
 * What a crawler is handed for an image search.
 *
 * Google Images indexes <img> found in the HTML, with its alt text. The
 * prerendered pages had none at all — only an og:image, which is a social
 * card and not an indexing signal — so no picture on the site could appear
 * in an image search. And a member's photograph must stay out of one: they
 * uploaded it for a professional directory, not to be findable by face.
 */

const PHOTO = "https://firebasestorage.googleapis.com/v0/b/x/o/photo.jpg";

const str = (stringValue: string) => ({ stringValue });

const DOCS: Record<string, Record<string, unknown>> = {
  "news/n1": {
    title: str("انطلاق قناة جديدة"),
    body: str("نص الخبر الكامل هنا."),
    category: str("قنوات"),
    image: str(PHOTO),
    imageAlt: str("استوديو القناة الجديدة في الجزائر العاصمة"),
  },
  "equipment/e1": {
    name: str("كاميرا سوني FX3"),
    description: str("كاميرا مستعملة بحالة ممتازة."),
    seller: str("متجر النور"),
    condition: str("used"),
    image: str(PHOTO),
  },
  "works/w1": {
    title: str("تقرير عن مهرجان الفيلم"),
    description: str("عمل صحفي مصوّر."),
    ownerName: str("أمين"),
    type: str("video"),
    cover: str(PHOTO),
    views: { integerValue: "120" },
    likes: { integerValue: "9" },
  },
  "users/u1": {
    name: str("سارة بن علي"),
    bio: str("صحفية متخصصة في الشأن المحلي."),
    specialty: str("صحافة"),
    photo: str(PHOTO),
    status: str("approved"),
  },
};

function mockFirestore() {
  vi.stubGlobal("fetch", async (url: string) => {
    const match = url.match(/documents\/([^/]+)\/([^?]+)/);
    const key = match ? `${match[1]}/${match[2]}` : "";
    const fields = DOCS[key];
    if (fields) return { ok: true, json: async () => ({ fields }) };

    // A collection listing: everything of that kind.
    const listing = url.match(/documents\/([^/?]+)\?/);
    if (listing) {
      const prefix = `${listing[1]}/`;
      return {
        ok: true,
        json: async () => ({
          documents: Object.entries(DOCS)
            .filter(([k]) => k.startsWith(prefix))
            .map(([k, fields]) => ({ name: `projects/p/databases/(default)/documents/${k}`, fields })),
        }),
      };
    }
    // The filtered users query used by listings and the sitemap.
    return {
      ok: true,
      json: async () => [
        { document: { name: "projects/p/databases/(default)/documents/users/u1", fields: DOCS["users/u1"] } },
      ],
    };
  });
}

async function serve(handler: unknown, path: string): Promise<string> {
  let body = "";
  const res = {
    setHeader: () => res,
    status: () => res,
    send: (value: string) => { body = value; return res; },
  };
  await (handler as (req: unknown, res: unknown) => Promise<unknown>)({ query: { path } }, res);
  return body;
}

beforeEach(() => {
  process.env.VITE_FIREBASE_PROJECT_ID = "p";
  process.env.VITE_FIREBASE_API_KEY = "k";
  mockFirestore();
});
afterEach(() => vi.unstubAllGlobals());

describe("the page a crawler is given", () => {
  it("shows a news photo, with the alt text the editor wrote", async () => {
    const html = await serve(prerender, "/news/n1");
    expect(html).toContain(`<img src="${PHOTO}"`);
    expect(html).toContain('alt="استوديو القناة الجديدة في الجزائر العاصمة"');
  });

  it("falls back to the headline when no alt text was written", async () => {
    const html = await serve(prerender, "/equipment/e1");
    expect(html).toContain(`<img src="${PHOTO}"`);
    expect(html).toMatch(/alt="[^"]*كاميرا سوني FX3[^"]*"/);
  });

  it("shows a gallery work's cover, and says what kind of work it is", async () => {
    const html = await serve(prerender, "/works/w1");
    expect(html).toContain(`<img src="${PHOTO}"`);
    expect(html).toContain("فيديو"); // not the raw "video"
    expect(html).toContain('"@type":"CreativeWork"');
  });

  it("leaves a member's photograph out of the page", async () => {
    const html = await serve(prerender, "/profile/u1");
    expect(html).not.toContain("<img");
    // It still carries the page, and the social card may use the photo.
    expect(html).toContain("سارة بن علي");
  });

  it("puts a thumbnail beside each entry on a listing", async () => {
    const html = await serve(prerender, "/news");
    expect(html).toContain(`<img src="${PHOTO}"`);
  });

  it("leaves photographs off the listing of people", async () => {
    const html = await serve(prerender, "/professionals");
    expect(html).not.toContain("<img");
  });

  it("never emits an img without alt text", async () => {
    for (const path of ["/news/n1", "/equipment/e1", "/works/w1", "/news", "/works"]) {
      const html = await serve(prerender, path);
      for (const tag of html.match(/<img [^>]*>/g) ?? []) {
        expect(tag, `${path}: ${tag}`).toMatch(/alt="[^"]+"/);
      }
    }
  });
});

describe("the sitemap", () => {
  it("declares the image namespace and points at the pictures", async () => {
    const xml = await serve(sitemap, "/sitemap.xml");
    expect(xml).toContain("sitemap-image/1.1");
    expect(xml).toContain(`<image:image><image:loc>${PHOTO}</image:loc></image:image>`);
  });

  it("lists the gallery", async () => {
    const xml = await serve(sitemap, "/sitemap.xml");
    expect(xml).toContain("https://sanadz.media/works");
  });

  it("lists a member's page without their photograph", async () => {
    const xml = await serve(sitemap, "/sitemap.xml");
    const profile = xml.split("<url>").find((block) => block.includes("/profile/u1")) ?? "";
    expect(profile).not.toContain("image:loc");
  });
});
