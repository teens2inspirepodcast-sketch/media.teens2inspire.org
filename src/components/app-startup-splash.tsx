"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

/** Keeps the branded entry screen visible for ten seconds on the initial app load only. */
export function AppStartupSplash() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 10_000);
    return () => window.clearTimeout(timeout);
  }, []);
  if (!visible) return null;
  return (
    <div className="app-startup-splash" role="status" aria-live="polite" aria-label="Loading Teens2Inspire">
      <div className="app-startup-splash-card">
        <Image src="/teens2inspire-logo.png" alt="Teens2Inspire" width={520} height={130} priority />
        <p>A little inspiration, loading…</p>
        <div className="app-startup-splash-track" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
}
