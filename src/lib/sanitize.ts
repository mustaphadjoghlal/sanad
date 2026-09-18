import DOMPurify from "dompurify";

/**
 * Sanitises rich text before it is injected with dangerouslySetInnerHTML.
 *
 * Job descriptions come out of the admin's Quill editor and were rendered raw.
 * Even though only the admin can write them, that made a single compromised or
 * careless admin session enough to persist script into every visitor's page,
 * and it left no defence if a write path is ever widened.
 */
const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "a", "span", "div",
];

const ALLOWED_ATTR = ["href", "target", "rel", "dir", "class"];

export function sanitizeHtml(html: string | undefined | null): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|#|\/)/i,
  });
}

// Force every surviving link to open safely, without leaking the referrer or
// handing the opened page a reference back to this window.
if (typeof window !== "undefined") {
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A" && node.hasAttribute("href")) {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer nofollow");
    }
  });
}
