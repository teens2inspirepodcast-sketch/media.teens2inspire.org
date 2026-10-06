import Link from "next/link";
import { Brand } from "@/components/brand";

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="footer-main">
        <div className="footer-brand-block">
          <Brand />
          <p>A media and community platform created to inspire Jewish teen girls.</p>
        </div>
        <div className="footer-links">
          <div><span className="eyebrow">Explore</span><Link href="/events">Events</Link><Link href="/school">School</Link><Link href="/about">About</Link></div>
          <div><span className="eyebrow">Your account</span><Link href="/signup">Join</Link><Link href="/login">Log in</Link><Link href="/download">Get the app</Link></div>
          <div><span className="eyebrow">Information</span><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
        </div>
      </div>
      <div className="footer-bottom"><span>Copyright {new Date().getFullYear()} Teens2Inspire</span><span>Inspiring Jewish teen girls.</span></div>
    </footer>
  );
}
