/**
 * Turns a link someone typed into one that is safe to put in an `href`.
 *
 * Members type their own links — a portfolio piece, an Instagram page — and
 * every visitor is then offered them to click. React renders whatever string
 * it is given, so `javascript:…` in that field would run on the visitor's
 * side. Only web addresses come out of here; anything else comes out as
 * `undefined`, and the caller shows no link at all.
 *
 * A bare `instagram.com/name` is what people actually type, so it is
 * completed rather than thrown away.
 */
export function safeUrl(input: string | null | undefined): string | undefined {
  if (typeof input !== "string") return undefined;
  // Control characters and whitespace are ignored by browsers when they read
  // a scheme ("java\nscript:" still runs), so they go before anything is read.
  // eslint-disable-next-line no-control-regex
  const value = input.replace(/[\u0000- \u007f]/g, "");
  if (!value) return undefined;

  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  // Any other scheme — javascript:, data:, vbscript:, file: — is refused.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[^/:]+:\d/.test(value)) return undefined;
  // What is left must at least look like a host: "example.com/…".
  if (/^[^/\s.]+(\.[^/\s.]+)+([/?#:].*)?$/.test(value)) return `https://${value}`;
  return undefined;
}
