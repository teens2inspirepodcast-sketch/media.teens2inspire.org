"use client";

import { useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type Action = (formData: FormData) => Promise<void>;
type UploadStage = "session" | "authorization" | "transfer" | "artwork" | "captions" | "save";

const MIMES: Record<string, string> = {
  mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime", webm: "video/webm", mkv: "video/x-matroska",
  mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", wav: "audio/wav", ogg: "audio/ogg", flac: "audio/flac",
  pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
  avif: "image/avif", heic: "image/heic", heif: "image/heif", txt: "text/plain", csv: "text/csv",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
const ALLOWED_MIMES = new Set([...Object.values(MIMES), "audio/x-wav", "audio/webm"]);
const ARTWORK_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const MAX_MEDIA_BYTES = 2_000_000_000;
const MAX_ART_BYTES = 10 * 1024 * 1024;

function mimeOf(file: File): string {
  const declared = (file.type || "").toLowerCase().split(";")[0].trim();
  if (ALLOWED_MIMES.has(declared)) return declared;
  const extension = (file.name.split(".").pop() || "").toLowerCase();
  const inferred = MIMES[extension];
  if (!inferred) throw new Error(`Unsupported file format: ${file.name}. Choose a common MP4, MOV, MP3, M4A, PDF or image.`);
  return inferred;
}

function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /load failed|failed to fetch|networkerror|network request failed|internet connection|timed out|upload connection interrupted|connection dropped/i.test(message);
}
function friendlyError(stage: UploadStage, error: unknown): string {
  const raw = error instanceof Error ? error.message : "An unknown error occurred.";
  if (/refresh[_ -]?token|jwt|session|unauthorized|sign.?in|HTTP 401|HTTP 403|not authenticated/i.test(raw) && stage !== "transfer") {
    return "Your administrator session has expired or cannot be verified. Sign out, sign back in, then try again.";
  }
  if (isNetworkError(error)) {
    if (stage === "transfer") return "The connection to media storage stopped during the file transfer. Keep the browser tab open, use stable Wi-Fi, and try again. For large iPhone videos, try uploading from a laptop. If it still fails, note the file size and the percentage shown.";
    if (stage === "save") return "The files uploaded, but the website lost its connection while saving the content record. Check Content Studio before retrying so you don't create a duplicate. If it is missing, retry Save using the same selected files.";
    return `The upload could not reach the service during ${stage}. Check your connection, refresh the admin page, and try again.`;
  }
  return raw;
}

function uploadWithProgress(url: string, file: File, contentType: string, onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url, true);
    request.timeout = 20 * 60 * 1000;
    request.setRequestHeader("Content-Type", contentType);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) { onProgress(100); resolve(); }
      else reject(new Error(`Media storage refused the file (HTTP ${request.status || "unknown"}). Check that your file type and size are supported.`));
    };
    request.onerror = () => reject(new Error("Upload connection interrupted (network error or browser blocked the storage request)."));
    request.ontimeout = () => reject(new Error("Upload timed out before the file reached storage."));
    request.onabort = () => reject(new Error("Upload connection interrupted because the transfer was cancelled."));
    try { request.send(file); } catch (error) { reject(error); }
  });
}

/** Saves files first, then submits metadata to the existing authenticated Server Action. */
export function AdminUploadForm({ action, className, children }: { action: Action; className?: string; children: ReactNode }) {
  const formRef = useRef<HTMLFormElement>(null);
  const savingRef = useRef(false);
  const cachedFilesRef = useRef(new WeakMap<File, string>());
  const [busy, setBusy] = useState(false);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const stageRef = useRef<UploadStage>("session");
  function markStage(next: UploadStage) { stageRef.current = next; }
  const [percent, setPercent] = useState<number | null>(null);

  async function signMediaUpload(file: File, contentType: string): Promise<{ uploadUrl: string; key: string }> {
    const response = await fetch("/api/admin/media/upload-url", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType, size: file.size }),
      cache: "no-store",
    });
    const result: { uploadUrl?: unknown; key?: unknown; error?: unknown } = await response.json().catch(() => ({}));
    if (!response.ok || typeof result.uploadUrl !== "string" || typeof result.key !== "string") {
      throw new Error(typeof result.error === "string" ? result.error : `Could not authorize upload (HTTP ${response.status}).`);
    }
    return { uploadUrl: result.uploadUrl, key: result.key };
  }

  async function multipartRequest(body: Record<string, unknown>): Promise<Record<string, any>> {
    const response = await fetch("/api/admin/media/upload-url", { method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `R2 upload service returned HTTP ${response.status}.`);
    return data;
  }

  async function uploadMedia(file: File, label: string): Promise<string> {
    if (file.size === 0) throw new Error("This file is empty (0 bytes). Select a file that contains media.");
    if (file.size > MAX_MEDIA_BYTES) throw new Error(`This file is ${(file.size / 1_000_000).toFixed(1)} MB. The current secure R2 multipart upload supports files up to 2,000 MB. Compress or split this file before uploading.`);
    const contentType = mimeOf(file);
    if (file.size > 80 * 1024 * 1024) {
      markStage("authorization");
      setProgress(`Preparing multipart upload for ${label}…`);
      const session = await multipartRequest({ action: "multipart-init", filename: file.name, contentType, size: file.size });
      if (typeof session.key !== "string" || typeof session.uploadId !== "string" || !Number.isInteger(session.partSize))
        throw new Error("R2 did not return a valid multipart session.");
      const { key, uploadId, partSize } = session;
      const total = Math.ceil(file.size / partSize);
      if (total < 1 || total > 10000) throw new Error("The multipart upload service returned an invalid part size.");
      const parts: Array<{ partNumber: number; etag: string }> = [];
      for (let i = 0; i < total; i += 1) {
        const partNumber = i + 1;
        const blob = file.slice(i * partSize, Math.min((i + 1) * partSize, file.size));
        let etag = "";
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            markStage("authorization");
            const signed = await multipartRequest({ action: "multipart-part", key, uploadId, partNumber });
            if (typeof signed.uploadUrl !== "string") throw new Error("R2 did not return a part URL.");
            markStage("transfer");
            setProgress(`${label}: uploading part ${partNumber} of ${total}${attempt ? ` (retry ${attempt})` : ""}…`);
            const response = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
            if (!response.ok) throw new Error(`R2 rejected part ${partNumber} (HTTP ${response.status}).`);
            etag = response.headers.get("ETag") || "";
            if (!etag) throw new Error("R2 did not expose ETag. Check the R2 bucket CORS ExposeHeaders setting.");
            break;
          } catch (error) {
            if (attempt === 2) throw error;
          }
        }
        parts.push({ partNumber, etag });
        setPercent(Math.round(((i + 1) / total) * 100));
      }
      markStage("authorization");
      setProgress(`Finalizing ${label}…`);
      const done = await multipartRequest({ action: "multipart-complete", key, uploadId, parts });
      if (!done.complete) throw new Error("R2 did not confirm completion.");
      setPercent(null);
      return key;
    }
    // Smaller files retain the existing signed single-PUT path.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      markStage("authorization");
      setProgress(attempt ? `Reconnecting to media storage for ${label}…` : `Preparing secure media upload for ${label}…`);
      const { uploadUrl, key } = await signMediaUpload(file, contentType);
      markStage("transfer");
      setPercent(0);
      setProgress(`${label}: uploading media to secure storage…`);
      try {
        await uploadWithProgress(uploadUrl, file, contentType, (value) => setPercent(value));
        setPercent(null);
        return key;
      } catch (cause) {
        setPercent(null);
        if (!isNetworkError(cause) || attempt === 1) throw cause;
      }
    }
    throw new Error("The media upload could not complete.");
  }

  async function uploadArtwork(file: File): Promise<string> {
    const contentType = mimeOf(file);
    if (!ARTWORK_MIMES.has(contentType)) throw new Error("Cover images must be JPG, PNG, WebP, GIF or AVIF. Convert HEIC to JPG before uploading.");
    if (file.size === 0) throw new Error("The selected image is empty.");
    if (file.size > MAX_ART_BYTES) throw new Error("Cover artwork exceeds the 10 MB Supabase storage limit. Choose a smaller image.");
    const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" } as Record<string, string>)[contentType];
    const supabase = createClient();
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const path = `branding/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("site-brand-assets")
        .upload(path, file, { contentType, upsert: false });
      if (!uploadError) return supabase.storage.from("site-brand-assets").getPublicUrl(path).data.publicUrl;
      if (!isNetworkError(uploadError) || attempt === 1) throw new Error(`Cover image upload failed: ${uploadError.message}`);
      setProgress("Connection interrupted while uploading cover artwork. Retrying once…");
    }
    throw new Error("Could not upload the cover image.");
  }

  async function uploadCaptions(file: File): Promise<string> {
    if (!/\.vtt$/i.test(file.name)) throw new Error("Captions must be a .vtt file.");
    if (file.size === 0) throw new Error("The selected caption file is empty.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Caption files must be 5 MB or smaller because they use a separate Supabase storage bucket.");
    const beginning = await file.slice(0, 128).text();
    if (!/^\uFEFF?WEBVTT(?:[ \t\r\n]|$)/.test(beginning)) throw new Error("Captions must begin with WEBVTT.");
    const supabase = createClient();
    const path = `captions/${crypto.randomUUID()}.vtt`;
    const normalized = new File([file], "captions.vtt", { type: "text/vtt" });
    const { error: uploadError } = await supabase.storage.from("media-captions")
      .upload(path, normalized, { contentType: "text/vtt", upsert: false });
    if (uploadError) throw new Error(`Captions upload failed: ${uploadError.message}`);
    return path;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;
    savingRef.current = true;
    setBusy(true);
    setError("");
    setPercent(null);
    markStage("session");
    setProgress("Checking your administrator session…");
    try {
      const selected = Array.from(form.querySelectorAll<HTMLInputElement>('input[data-save-upload="true"]'))
        .filter(input => Boolean(input.files?.[0]));
      if (selected.length) {
        const { data: { user }, error: sessionError } = await createClient().auth.getUser();
        if (sessionError || !user) throw new Error("Your sign-in session expired. Sign out and sign back in as administrator.");
      }
      for (const [index, picker] of selected.entries()) {
        const file = picker.files![0];
        const fieldName = picker.dataset.targetName;
        const field = Array.from(form.elements).find(input => input instanceof HTMLInputElement && input.name === fieldName) as HTMLInputElement | undefined;
        if (!field) throw new Error("The upload field is missing. Refresh this editor and try again.");
        const label = `File ${index + 1} of ${selected.length} (${file.name})`;
        let stored = cachedFilesRef.current.get(file);
        if (!stored) {
          if (picker.dataset.storage === "captions") {
            markStage("captions"); setProgress(`Uploading captions: ${label}`);
            stored = await uploadCaptions(file);
          } else if (picker.dataset.storage === "brand") {
            markStage("artwork"); setProgress(`Uploading cover artwork: ${label}`);
            stored = await uploadArtwork(file);
          } else {
            stored = await uploadMedia(file, label);
          }
          cachedFilesRef.current.set(file, stored);
        }
        field.value = stored;
      }
      const payload = new FormData(form);
      markStage("save");
      setProgress("Files uploaded. Saving the content record…");
      setPercent(null);
      startSaving(async () => {
        try { await action(payload); }
        catch (cause) { setError(friendlyError("save", cause)); setProgress(""); }
        finally { savingRef.current = false; setBusy(false); }
      });
    } catch (cause) {
      setError(friendlyError(stageRef.current, cause));
      setProgress(""); setPercent(null);
      savingRef.current = false;
      setBusy(false);
    }
  }

  return <form ref={formRef} onSubmit={handleSubmit} className={className} aria-busy={busy || saving}>
    {children}
    {(busy || saving) && <div className="notice" role="status" aria-live="polite">
      <p style={{ margin: 0 }}>{progress || "Saving…"}{percent !== null ? ` ${percent}%` : ""}</p>
      {percent !== null && <progress max={100} value={percent} style={{ display: "block", width: "100%", marginTop: 8 }} />}
      <small>Keep this tab open until saving finishes.</small>
    </div>}
    {error && <div className="notice" role="alert" style={{ whiteSpace: "pre-wrap", borderColor: "#d85781", color: "#702346", background: "#fff4f8", padding: 14, borderRadius: 10 }}>
      <strong>Upload not completed.</strong> {error}
    </div>}
  </form>;
}
