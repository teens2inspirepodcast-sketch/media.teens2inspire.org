import Image from "next/image";
import Link from "next/link";

export function Brand({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <Link className={`brand${light ? " brand-light" : ""}${compact ? " brand-compact" : ""}`} href="/" aria-label="Teens2Inspire home">
      {compact ? (
        <span className="brand-mark" aria-hidden="true">2</span>
      ) : (
        <Image src="/teens2inspire-logo.png" alt="Teens2Inspire" width={420} height={140} priority className="brand-logo" />
      )}
    </Link>
  );
}
