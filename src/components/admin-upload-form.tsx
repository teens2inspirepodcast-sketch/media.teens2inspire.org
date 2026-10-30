"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type Action = (formData: FormData) => Promise<void>;

/** Files are uploaded on Save, before the existing secured Server Action is submitted. */
export function AdminUploadForm({ action, className, children }: { action: Action; className?: string; children: ReactNode }) {
  const formRef = useRef<HTMLFormElement>(null);
  const postingRef = useRef(false);
  const uploadedRef = useRef(false);
  const cacheRef = useRef(new WeakMap<File, string>());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  async function uploadR2(file: File, artwork: boolean): Promise<string> {
    const response = await fetch("/api/admin/media/upload-url", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size, artwork }),
    });
    const result = await response.json();
    if (!response.ok || !result.uploadUrl || !result.key) throw new Error(result.error || "Could not authorize R2 upload.");
    const uploaded = await fetch(result.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    if (!uploaded.ok) throw new Error("R2 rejected the upload. Check R2 bucket CORS and try again.");
    return artwork ? `/api/media/artwork/${String(result.key).replace(/^artwork\//, "")}` : String(result.key);
  }

  async function uploadBrandAsset(file: File): Promise<string> {
    if (!new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]).has(file.type)) throw new Error("Choose a JPG, PNG, WebP, GIF, AVIF image.");
    if (!file.size || file.size > 10 * 1024 * 1024) throw new Error("Brand images must be 10 MB or smaller.");
    const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" } as Record<string, string>)[file.type];
    const supabase = createClient();
    const path = `branding/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("site-brand-assets").upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);
    return supabase.storage.from("site-brand-assets").getPublicUrl(path).data.publicUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (uploadedRef.current) { uploadedRef.current = false; return; }
    event.preventDefault();
    if (postingRef.current) return;
    const form = formRef.current;
    if (!form) return;
    const selected = Array.from(form.querySelectorAll<HTMLInputElement>('input[data-save-upload="true"]')).filter(input => Boolean(input.files?.[0]));
    if (!selected.length) { uploadedRef.current = true; form.requestSubmit(); return; }
    postingRef.current = true;
    setBusy(true); setError("");
    try {
      for (let index = 0; index < selected.length; index += 1) {
        const picker = selected[index];
        const file = picker.files![0];
        const targetName = picker.dataset.targetName;
        const field = Array.from(form.elements).find(item => item instanceof HTMLInputElement && item.name === targetName) as HTMLInputElement | undefined;
        if (!field) throw new Error("The upload field is missing. Please refresh the page.");
        setProgress(`Uploading ${index + 1} of ${selected.length}: ${file.name}`);
        let urlOrKey = cacheRef.current.get(file);
        if (!urlOrKey) {
          urlOrKey = picker.dataset.storage === "brand" ? await uploadBrandAsset(file) : await uploadR2(file, picker.dataset.artwork === "true");
          cacheRef.current.set(file, urlOrKey);
        }
        field.value = urlOrKey;
      }
      setProgress("Upload complete. Saving your changes…");
      uploadedRef.current = true;
      form.requestSubmit();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The upload failed. Nothing was saved; please retry.");
      setProgress("");
    } finally { postingRef.current = false; setBusy(false); }
  }

  return <form ref={formRef} action={action} onSubmit={handleSubmit} className={className} aria-busy={busy}>
    {children}
    {busy && <p className="notice" role="status" aria-live="polite">{progress || "Preparing upload…"}</p>}
    {error && <p className="notice" role="alert">{error}</p>}
  </form>;
}
