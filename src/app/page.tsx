import Image from "next/image";

export const metadata = {
  title: "Teens2Inspire Media — Launching Soon",
  description: "A thoughtful media space for Jewish teen girls. The Teens2Inspire Media App is launching soon.",
};

export default function MediaLaunchPage() {
  return (
    <main className="launch-page">
      <div className="launch-glow launch-glow-one" aria-hidden="true" />
      <div className="launch-glow launch-glow-two" aria-hidden="true" />
      <header className="launch-header">
        <a href="https://media.teens2inspire.org" aria-label="Teens2Inspire Media home" className="launch-logo">
          <Image src="/teens2inspire-logo.png" alt="Teens2Inspire — Inspiring Jewish teen girls" width={360} height={120} priority />
        </a>
        <span className="launch-status"><span /> MEDIA APP LAUNCH</span>
      </header>
      <section className="launch-content">
        <p className="launch-eyebrow">YOUR NEXT FAVORITE CORNER OF THE INTERNET</p>
        <h1>Meaningful things to watch.<br /><em>Stories that stay with you.</em></h1>
        <p className="launch-bio">Teens2Inspire Media is a thoughtfully curated platform for Jewish teen girls, bringing together uplifting podcasts, videos, reading, printables, events, and inspiration in one place.</p>
        <div className="launch-countdown-card">
          <p className="launch-card-label">THE APP LAUNCHES IN</p>
          <iframe width="300" height="154" src="https://w2.countingdownto.com/7396542" title="Teens2Inspire Media App Launch countdown" frameBorder="0" loading="lazy" />
        </div>
        <p className="launch-note">We can’t wait to share it with you. See you at launch.</p>
        <nav className="launch-links" aria-label="Teens2Inspire links">
          <a href="https://www.instagram.com/teens2inspire/" target="_blank" rel="noreferrer">Follow along on Instagram <span aria-hidden="true">↗</span></a>
          <a href="https://teens2inspire.org">About Teens2Inspire <span aria-hidden="true">↗</span></a>
        </nav>
      </section>
      <footer className="launch-footer">© {new Date().getFullYear()} Teens2Inspire · Inspiring Jewish teen girls</footer>
    </main>
  );
}
