"use client";
import { useEffect } from "react";
export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js").catch(() => { /* App remains usable if offline support is unavailable. */ });
    }
  }, []);
  return null;
}
