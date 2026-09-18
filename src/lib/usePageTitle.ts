import { useEffect } from "react";

const SITE_NAME = "سند | منصة إعلامية جزائرية";
const SITE_ORIGIN = "https://sanadz.media";
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og-image.png`;

export interface PageSeo {
  /** Social preview image — absolute URL, or a Storage URL from the content itself. */
  image?: string;
  /** Canonical path, defaulting to the current location. */
  path?: string;
  /** Keep the page out of search results (404s, private dashboards). */
  noindex?: boolean;
  /** "article" for a single piece of content, "website" otherwise. */
  type?: "website" | "article";
}

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Keeps the document title, description, canonical URL and the Open Graph /
 * Twitter tags in step with the current route.
 *
 * This is a single-page app, so the tags in index.html are the *only* ones a
 * crawler sees unless something rewrites them. Social crawlers do not run
 * JavaScript at all — they are served pre-rendered markup by `api/prerender.js`
 * — but search engines and in-app browsers do, and they read what this sets.
 */
export function usePageTitle(title: string, description?: string, seo: PageSeo = {}) {
  const { image, path, noindex, type = "website" } = seo;

  useEffect(() => {
    const prevTitle = document.title;
    const prevDesc = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content;
    const prevCanonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
    const prevRobots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content;

    const fullTitle = title ? `${title} - ${SITE_NAME}` : SITE_NAME;
    const url = SITE_ORIGIN + (path ?? window.location.pathname);
    const desc = description ?? prevDesc ?? "";
    const img = image || DEFAULT_IMAGE;

    document.title = fullTitle;
    if (desc) {
      setMeta('meta[name="description"]', "name", "description", desc);
      setMeta('meta[property="og:description"]', "property", "og:description", desc);
      setMeta('meta[name="twitter:description"]', "name", "twitter:description", desc);
    }
    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    setMeta('meta[property="og:type"]', "property", "og:type", type);
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    setMeta('meta[property="og:image"]', "property", "og:image", img);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", img);
    setMeta('meta[name="robots"]', "name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    setLink("canonical", url);

    return () => {
      document.title = prevTitle;
      if (prevDesc !== undefined) setMeta('meta[name="description"]', "name", "description", prevDesc);
      if (prevCanonical) setLink("canonical", prevCanonical);
      setMeta('meta[name="robots"]', "name", "robots", prevRobots ?? "index, follow");
    };
  }, [title, description, image, path, noindex, type]);
}
