import { afterEach, describe, expect, it, vi } from "vitest";
import { siteOrigin } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("site origin configuration", () => {
  it("keeps the local default outside Vercel", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(siteOrigin()).toBe("http://localhost:3000");
  });

  it("uses Vercel's HTTPS deployment URL for previews when a local URL is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "teens2inspire-preview.vercel.app");
    expect(siteOrigin()).toBe("https://teens2inspire-preview.vercel.app");
  });

  it("requires a real HTTPS origin in Vercel production", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "teens2inspire.vercel.app");
    expect(() => siteOrigin()).toThrow(/public HTTPS origin/);
  });

  it("normalizes the configured production origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://teens2inspire.example/path");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(siteOrigin()).toBe("https://teens2inspire.example");
  });
});
