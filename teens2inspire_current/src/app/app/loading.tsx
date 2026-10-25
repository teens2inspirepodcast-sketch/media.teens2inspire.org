import Image from "next/image";

export default function AppLoading() {
  return (
    <main className="brand-loading-screen" role="status" aria-live="polite" aria-label="Loading Teens2Inspire">
      <div className="brand-loading-mark">
        <Image src="/icon-192.png" alt="" width={96} height={96} priority />
      </div>
      <span className="brand-loading-name">Teens2Inspire</span>
      <span className="brand-loading-caption">A little inspiration, loading…</span>
      <span className="brand-loading-track" aria-hidden="true"><span /></span>
    </main>
  );
}
