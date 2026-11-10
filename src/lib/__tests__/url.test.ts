import { describe, it, expect } from "vitest";
import { safeUrl } from "../url";

describe("safeUrl", () => {
  it("keeps ordinary web addresses as they are", () => {
    expect(safeUrl("https://example.com/a?b=1")).toBe("https://example.com/a?b=1");
    expect(safeUrl("http://example.com")).toBe("http://example.com");
    expect(safeUrl("  https://example.com  ")).toBe("https://example.com");
  });

  it("completes the bare address people actually type", () => {
    expect(safeUrl("instagram.com/sanad")).toBe("https://instagram.com/sanad");
    expect(safeUrl("www.example.com")).toBe("https://www.example.com");
    expect(safeUrl("//example.com/x")).toBe("https://example.com/x");
    expect(safeUrl("example.com:8080/x")).toBe("https://example.com:8080/x");
  });

  it("refuses anything that would run instead of navigate", () => {
    expect(safeUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeUrl("JaVaScRiPt:alert(1)")).toBeUndefined();
    expect(safeUrl(" java\nscript:alert(1)")).toBeUndefined();
    expect(safeUrl("\tjavascript:alert(1)")).toBeUndefined();
    expect(safeUrl("data:text/html,<script>alert(1)</script>")).toBeUndefined();
    expect(safeUrl("vbscript:msgbox(1)")).toBeUndefined();
    expect(safeUrl("file:///etc/passwd")).toBeUndefined();
  });

  it("refuses what is not an address at all", () => {
    expect(safeUrl("")).toBeUndefined();
    expect(safeUrl(null)).toBeUndefined();
    expect(safeUrl(undefined)).toBeUndefined();
    expect(safeUrl("حسابي على انستغرام")).toBeUndefined();
    expect(safeUrl("/relative/path")).toBeUndefined();
  });
});
