import { describe, expect, it } from "vitest";
import { isSafeR2Key } from "./r2-keys";

describe("Cloudflare R2 object keys", () => {
  it("accepts content, artwork, and user-scoped avatar keys", () => {
    expect(isSafeR2Key("podcasts/season-1/episode-04.mp3")).toBe(true);
    expect(isSafeR2Key("artwork/7b908-cover.webp")).toBe(true);
    expect(isSafeR2Key("avatars/8a3f-user/avatar.png")).toBe(true);
  });

  it("rejects traversal, absolute paths, URLs, backslashes, and control characters", () => {
    for (const key of ["../private.mp3", "podcasts/../private.mp3", "/artwork/cover.webp", "https://example.com/file", "artwork\\cover.png", "media/line\nbreak.mp3"]) {
      expect(isSafeR2Key(key)).toBe(false);
    }
  });
});
