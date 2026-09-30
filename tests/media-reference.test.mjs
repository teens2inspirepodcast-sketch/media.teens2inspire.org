import assert from "node:assert/strict";
import test from "node:test";
import { getLegacyMediaApiPath, getLegacyMediaObjectPath, getLegacyMediaSourceUrl, isSafeMediaObjectPath } from "../lib/media-reference.ts";

const supabaseUrl = "https://project-example.supabase.co";

test("legacy same-project public media URLs resolve to the protected media API", () => {
  const source = `${supabaseUrl}/storage/v1/object/public/media/podcast/1787896923587-dl__1_.mp3`;
  assert.equal(getLegacyMediaObjectPath(source, supabaseUrl), "podcast/1787896923587-dl__1_.mp3");
  assert.equal(getLegacyMediaApiPath(source, supabaseUrl), "/api/media/storage/media/podcast/1787896923587-dl__1_.mp3");
  assert.equal(getLegacyMediaSourceUrl("podcast/1787896923587-dl__1_.mp3", supabaseUrl), source);
});

test("legacy media resolver rejects foreign origins, other buckets, and URL credentials", () => {
  assert.equal(getLegacyMediaObjectPath("https://attacker.example/storage/v1/object/public/media/podcast/file.mp3", supabaseUrl), null);
  assert.equal(getLegacyMediaObjectPath(`${supabaseUrl}/storage/v1/object/public/artwork/podcast/file.mp3`, supabaseUrl), null);
  assert.equal(getLegacyMediaObjectPath(`${supabaseUrl}/storage/v1/object/public/media/podcast/file.mp3?token=secret`, supabaseUrl), null);
  assert.equal(getLegacyMediaObjectPath(`${supabaseUrl}/storage/v1/object/public/media/podcast/file.mp3#fragment`, supabaseUrl), null);
});

test("legacy media resolver rejects traversal, encoded separators, and unsafe route paths", () => {
  assert.equal(getLegacyMediaObjectPath(`${supabaseUrl}/storage/v1/object/public/media/%2e%2e/secret.mp3`, supabaseUrl), null);
  assert.equal(getLegacyMediaObjectPath(`${supabaseUrl}/storage/v1/object/public/media/podcast%2Fsecret.mp3`, supabaseUrl), null);
  assert.equal(isSafeMediaObjectPath("podcast/../secret.mp3"), false);
  assert.equal(isSafeMediaObjectPath("podcast/%2e%2e/secret.mp3"), false);
  assert.equal(getLegacyMediaSourceUrl("podcast/../secret.mp3", supabaseUrl), null);
});

test("valid filenames are encoded one segment at a time", () => {
  const source = `${supabaseUrl}/storage/v1/object/public/media/podcast/episode%20one.mp3`;
  assert.equal(getLegacyMediaApiPath(source, supabaseUrl), "/api/media/storage/media/podcast/episode%20one.mp3");
});
