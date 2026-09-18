import { useEffect } from "react";
import type { Job, NewsItem, Course, Competition, Thesis, Product, UserProfile } from "./types";

const SITE = "https://sanadz.media";
const PUBLISHER = {
  "@type": "Organization",
  name: "منصة سند الإعلامية",
  url: SITE,
  logo: { "@type": "ImageObject", url: `${SITE}/icon-512.png` },
};

type Json = Record<string, unknown>;

/** Rich text from the editor; JSON-LD wants a plain string for most fields. */
function plain(value: string | undefined | null, maxLen = 5000): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function iso(ms: number | undefined): string | undefined {
  if (!ms) return undefined;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** "2026-03-15" from the admin's date input -> an ISO instant. */
function isoFromDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** Drops empty values — Google warns about present-but-empty properties. */
function clean(obj: Json): Json {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => {
      if (v == null || v === "") return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    })
  );
}

const EMPLOYMENT_TYPE: Record<string, string> = {
  fulltime: "FULL_TIME",
  parttime: "PART_TIME",
  internship: "INTERN",
  internship_paid: "INTERN",
};

/**
 * Google Jobs only surfaces vacancies carrying JobPosting markup, so without
 * this the platform's listings cannot appear there at all.
 *
 * `location` is a comma-separated list the admin picks from the wilaya
 * toggles, and may be "عن بعد" (remote) or "كل الجزائر" (nationwide).
 */
export function jobPosting(job: Job): Json {
  const places = (job.location || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const remote = places.includes("عن بعد");
  const wilayas = places.filter((p) => p !== "عن بعد" && p !== "كل الجزائر");

  const jobLocation = wilayas.length
    ? wilayas.map((w) => ({
        "@type": "Place",
        address: { "@type": "PostalAddress", addressLocality: w, addressCountry: "DZ" },
      }))
    : [{ "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "DZ" } }];

  return clean({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: plain(job.title, 200),
    description: job.description || plain(job.title),
    datePosted: iso(job.createdAt),
    validThrough: isoFromDate(job.deadline),
    employmentType: job.employmentType ? EMPLOYMENT_TYPE[job.employmentType] : undefined,
    hiringOrganization: job.company
      ? { "@type": "Organization", name: job.company }
      : PUBLISHER,
    jobLocation,
    // Google requires this alongside jobLocation for a remote role.
    jobLocationType: remote ? "TELECOMMUTE" : undefined,
    applicantLocationRequirements: remote
      ? { "@type": "Country", name: "الجزائر" }
      : undefined,
    industry: job.jobType || undefined,
    image: job.image || undefined,
    url: `${SITE}/jobs/${job.id}`,
    identifier: { "@type": "PropertyValue", name: "sanad", value: job.id },
  });
}

export function newsArticle(item: NewsItem): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: plain(item.title, 110), // Google truncates beyond ~110
    description: plain(item.body, 250),
    articleBody: plain(item.body),
    image: item.image ? [item.image] : undefined,
    datePublished: isoFromDate(item.date) ?? iso(item.createdAt),
    dateModified: iso(item.createdAt),
    articleSection: item.category,
    author: PUBLISHER,
    publisher: PUBLISHER,
    inLanguage: "ar",
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/news/${item.id}` },
  });
}

export function courseSchema(course: Course): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "Course",
    name: plain(course.title, 200),
    description: plain(course.description, 500),
    image: course.image || undefined,
    provider: course.instructor
      ? { "@type": "Organization", name: course.instructor }
      : PUBLISHER,
    inLanguage: "ar",
    url: `${SITE}/courses/${course.id}`,
    offers: clean({
      "@type": "Offer",
      price: course.type === "free" ? 0 : course.price,
      priceCurrency: "DZD",
      category: course.type === "free" ? "Free" : "Paid",
      availability: "https://schema.org/InStock",
    }),
  });
}

export function competitionEvent(c: Competition): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "Event",
    name: plain(c.name, 200),
    description: plain(c.description, 500),
    image: c.image || undefined,
    startDate: isoFromDate(c.startDate),
    endDate: isoFromDate(c.endDate),
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "VirtualLocation", url: c.link || `${SITE}/competitions/${c.id}` },
    organizer: c.organizer ? { "@type": "Organization", name: c.organizer } : PUBLISHER,
    url: `${SITE}/competitions/${c.id}`,
  });
}

export function thesisSchema(t: Thesis): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: plain(t.title, 110),
    name: plain(t.title, 200),
    abstract: plain(t.abstract, 1000),
    author: t.author ? { "@type": "Person", name: t.author } : undefined,
    datePublished: t.year ? String(t.year) : undefined,
    publisher: t.university ? { "@type": "Organization", name: t.university } : PUBLISHER,
    keywords: t.keywords?.length ? t.keywords.join(", ") : undefined,
    inLanguage: "ar",
    url: `${SITE}/theses/${t.id}`,
  });
}

export function productSchema(p: Product, storeName?: string): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "Product",
    name: plain(p.name, 200),
    description: plain(p.description, 500),
    image: p.image ? [p.image] : undefined,
    category: p.category,
    offers: clean({
      "@type": "Offer",
      price: p.price,
      priceCurrency: "DZD",
      availability:
        p.status === "active" && p.quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: storeName ? { "@type": "Organization", name: storeName } : PUBLISHER,
      url: `${SITE}/products/${p.id}`,
    }),
  });
}

export function personSchema(profile: UserProfile, path: string): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "Person",
    name: plain(profile.name, 120),
    description: plain(profile.bio, 500),
    image: profile.photo || undefined,
    jobTitle: profile.specialty || undefined,
    address: profile.location
      ? { "@type": "PostalAddress", addressLocality: profile.location, addressCountry: "DZ" }
      : undefined,
    worksFor: profile.organization ? { "@type": "Organization", name: profile.organization } : undefined,
    sameAs: profile.socialLinks
      ? Object.values(profile.socialLinks).filter(Boolean)
      : undefined,
    url: `${SITE}${path}`,
  });
}

/** A trail from the home page, so search results show the section. */
export function breadcrumbs(trail: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "الرئيسية", path: "/" }, ...trail].map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE}${c.path}`,
    })),
  };
}

const TAG_ID = "sanad-structured-data";

/**
 * Injects the page's JSON-LD and removes it on navigation.
 *
 * Search engines render the page before reading structured data, so emitting
 * it from the client is enough for them. Social crawlers do not run
 * JavaScript, but they read Open Graph tags rather than JSON-LD, and those
 * are served by `api/prerender.js`.
 */
export function useStructuredData(data: Json | Json[] | null | undefined) {
  // Callers build a fresh object every render, so the serialised form is the
  // dependency — otherwise the tag would be torn down and re-added on every
  // single render.
  const json = data
    ? JSON.stringify(Array.isArray(data) && data.length === 1 ? data[0] : data)
    : null;

  useEffect(() => {
    if (!json) return;
    const tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.id = TAG_ID;
    tag.textContent = json;
    document.head.appendChild(tag);
    return () => { tag.remove(); };
  }, [json]);
}
