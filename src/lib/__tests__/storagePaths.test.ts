import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";

/**
 * The storage rules only cover a file sitting inside a folder named after its
 * owner — `profile-photos/{uid}/{fileName}`. A helper that uploaded to
 * `profile-photos/{uid}` instead landed on a path no rule matches, so every
 * profile photo was refused with Storage's opaque "does not have permission".
 * Nothing caught it, because the path is built inside the helper and never
 * looked at again.
 *
 * So look at it here: each uploader must produce a path the published rules
 * actually match.
 */

const paths: string[] = [];

vi.mock("../firebase", () => ({ app: {} }));
vi.mock("firebase/storage", () => ({
  getStorage: () => ({}),
  ref: (_storage: unknown, path: string) => {
    paths.push(path);
    return { fullPath: path };
  },
  getDownloadURL: async () => "https://example.test/file",
  uploadBytesResumable: () => ({
    snapshot: { ref: {} },
    on: (
      _event: string,
      _next: (s: unknown) => void,
      _error: (e: unknown) => void,
      complete: () => void
    ) => complete(),
  }),
}));

const { uploadImage, uploadProfilePhoto, uploadAudioSample, uploadWorkImage } = await import("../storage");

const fakeFile = (name: string, type: string) =>
  new File([new Uint8Array([1, 2, 3])], name, { type });

const RULES = readFileSync("storage.rules", "utf8");

/** The folders the rules guard per owner, each with a file name of its own. */
function rulesCover(path: string): boolean {
  const prefix = path.split("/")[0];
  return new RegExp(
    `match /${prefix}/\\{uid\\}/\\{fileName\\}`
  ).test(RULES) && path.split("/").length === 3;
}

beforeEach(() => { paths.length = 0; });

describe("upload paths match the storage rules", () => {
  it("puts a profile photo inside the owner's folder, with a file name", async () => {
    await uploadProfilePhoto("uid123", fakeFile("selfie.jpg", "image/jpeg"));
    expect(paths).toHaveLength(1);
    expect(paths[0]).toMatch(/^profile-photos\/uid123\/\d+_selfie\.jpg$/);
    expect(rulesCover(paths[0])).toBe(true);
  });

  it("puts an audio sample inside the owner's folder", async () => {
    await uploadAudioSample("uid123", fakeFile("demo.mp3", "audio/mpeg"));
    expect(paths[0]).toMatch(/^audio-samples\/uid123\/\d+_demo\.mp3$/);
    expect(rulesCover(paths[0])).toBe(true);
  });

  it("puts both gallery images inside the owner's folder", async () => {
    await uploadWorkImage("uid123", fakeFile("cover.png", "image/png"));
    expect(paths).toHaveLength(2);
    for (const path of paths) {
      expect(path).toMatch(/^works\/uid123\/\d+_(full|cover)\.(jpg|png)$/);
      expect(rulesCover(path)).toBe(true);
    }
  });

  it("appends a file name to whatever folder it is handed", async () => {
    await uploadImage("works/uid123", fakeFile("a.jpg", "image/jpeg"));
    expect(paths[0]).toMatch(/^works\/uid123\/\d+_a\.jpg$/);
  });

  it("would have caught the folder-only path the rules refuse", () => {
    expect(rulesCover("profile-photos/uid123")).toBe(false);
  });
});
