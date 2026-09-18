import { describe, it, expect } from "vitest";
import { jobPosting, newsArticle, courseSchema, competitionEvent, productSchema, personSchema, breadcrumbs } from "../structuredData";
import type { Job, NewsItem, Course, Competition, Product, UserProfile } from "../types";

const job = (over: Partial<Job> = {}): Job => ({
  id: "j1",
  title: "مصوّر صحفي",
  company: "قناة الشروق",
  location: "الجزائر, وهران",
  jobType: "تصوير",
  employmentType: "fulltime",
  description: "<p>نبحث عن <strong>مصوّر</strong> صحفي.</p>",
  contact: "hr@example.com",
  createdAt: 1789000000000,
  ...over,
});

describe("jobPosting", () => {
  /**
   * Google Jobs rejects a posting missing any of these, and a rejected
   * posting simply never appears — silently.
   */
  it("carries every property Google requires", () => {
    const d = jobPosting(job());
    for (const key of ["@context", "@type", "title", "description", "datePosted", "hiringOrganization", "jobLocation"]) {
      expect(d[key], `missing ${key}`).toBeTruthy();
    }
    expect(d["@type"]).toBe("JobPosting");
  });

  it("keeps the description as HTML, which Google prefers", () => {
    expect(jobPosting(job()).description).toContain("<strong>");
  });

  it("splits the wilaya list into separate places", () => {
    const loc = jobPosting(job()).jobLocation as Array<{ address: Record<string, string> }>;
    expect(loc).toHaveLength(2);
    expect(loc.map((l) => l.address.addressLocality)).toEqual(["الجزائر", "وهران"]);
    expect(loc[0].address.addressCountry).toBe("DZ");
  });

  it("marks a remote role as TELECOMMUTE with a country requirement", () => {
    const d = jobPosting(job({ location: "عن بعد" }));
    expect(d.jobLocationType).toBe("TELECOMMUTE");
    expect(d.applicantLocationRequirements).toBeTruthy();
    // Google still wants jobLocation present alongside it.
    expect(d.jobLocation).toBeTruthy();
  });

  it("does not treat 'كل الجزائر' as a city", () => {
    const loc = jobPosting(job({ location: "كل الجزائر" })).jobLocation as Array<{ address: Record<string, string> }>;
    expect(loc).toHaveLength(1);
    expect(loc[0].address.addressLocality).toBeUndefined();
    expect(loc[0].address.addressCountry).toBe("DZ");
  });

  it("maps employment types to schema.org values", () => {
    expect(jobPosting(job({ employmentType: "parttime" })).employmentType).toBe("PART_TIME");
    expect(jobPosting(job({ employmentType: "internship" })).employmentType).toBe("INTERN");
  });

  it("emits validThrough only when a deadline was set", () => {
    expect(jobPosting(job()).validThrough).toBeUndefined();
    expect(jobPosting(job({ deadline: "2026-12-31" })).validThrough).toMatch(/^2026-12-31/);
  });

  it("omits empty properties rather than emitting blanks", () => {
    const d = jobPosting(job({ image: "", jobType: "" }));
    expect("image" in d).toBe(false);
    expect("industry" in d).toBe(false);
  });

  it("produces valid JSON", () => {
    expect(() => JSON.parse(JSON.stringify(jobPosting(job())))).not.toThrow();
  });
});

describe("newsArticle", () => {
  const item: NewsItem = {
    id: "n1", title: "خبر", body: "<p>نص الخبر</p>", date: "2026-09-01",
    category: "عام", createdAt: 1789000000000,
  };

  it("strips markup out of the text fields", () => {
    const d = newsArticle(item);
    expect(d.articleBody).toBe("نص الخبر");
    expect(String(d.headline)).not.toContain("<");
  });

  it("prefers the editorial date over the created timestamp", () => {
    expect(String(newsArticle(item).datePublished)).toMatch(/^2026-09-01/);
  });

  it("keeps the headline within Google's limit", () => {
    const long = newsArticle({ ...item, title: "ع".repeat(300) });
    expect(String(long.headline).length).toBeLessThanOrEqual(110);
  });
});

describe("courseSchema", () => {
  const c: Course = {
    id: "c1", title: "دورة", type: "free", duration: "3 أيام",
    description: "وصف", instructor: "مدرب", createdAt: 1,
  };
  it("prices a free course at zero rather than omitting the offer", () => {
    const offer = courseSchema(c).offers as Record<string, unknown>;
    expect(offer.price).toBe(0);
    expect(offer.priceCurrency).toBe("DZD");
  });
});

describe("competitionEvent", () => {
  const c: Competition = {
    id: "e1", name: "مسابقة", type: "national", startDate: "2026-10-01",
    endDate: "2026-10-30", description: "وصف", organizer: "جهة", createdAt: 1,
  };
  it("emits the dates schema.org expects", () => {
    const d = competitionEvent(c);
    expect(String(d.startDate)).toMatch(/^2026-10-01/);
    expect(String(d.endDate)).toMatch(/^2026-10-30/);
    expect(d.eventStatus).toBe("https://schema.org/EventScheduled");
  });
});

describe("productSchema", () => {
  const p: Product = {
    id: "p1", storeId: "s1", name: "كاميرا", description: "وصف",
    price: 50000, category: "كاميرات", quantity: 2, createdAt: 1, status: "active",
  };
  it("reports stock from quantity and status", () => {
    expect((productSchema(p).offers as Record<string, string>).availability).toContain("InStock");
    expect((productSchema({ ...p, quantity: 0 }).offers as Record<string, string>).availability).toContain("OutOfStock");
    expect((productSchema({ ...p, status: "archived" }).offers as Record<string, string>).availability).toContain("OutOfStock");
  });
});

describe("personSchema", () => {
  const u: UserProfile = {
    id: "u1", email: "a@b.c", name: "أمينة", type: "journalist", bio: "نبذة",
    status: "approved", featured: false, createdAt: 1, specialty: "مونتاج",
    location: "قسنطينة", socialLinks: { facebook: "https://fb.com/x" },
  };
  it("maps the profile onto Person", () => {
    const d = personSchema(u, "/profile/u1");
    expect(d["@type"]).toBe("Person");
    expect(d.jobTitle).toBe("مونتاج");
    expect(d.sameAs).toEqual(["https://fb.com/x"]);
    expect(d.url).toBe("https://sanadz.media/profile/u1");
  });

  it("omits sameAs when there are no links", () => {
    expect("sameAs" in personSchema({ ...u, socialLinks: undefined }, "/profile/u1")).toBe(false);
  });
});

describe("breadcrumbs", () => {
  it("always starts at the home page and numbers positions from 1", () => {
    const d = breadcrumbs([{ name: "فرص العمل", path: "/jobs" }, { name: "مصوّر", path: "/jobs/j1" }]);
    const items = d.itemListElement as Array<{ position: number; name: string; item: string }>;
    expect(items).toHaveLength(3);
    expect(items[0].name).toBe("الرئيسية");
    expect(items.map((i) => i.position)).toEqual([1, 2, 3]);
    expect(items[2].item).toBe("https://sanadz.media/jobs/j1");
  });
});
