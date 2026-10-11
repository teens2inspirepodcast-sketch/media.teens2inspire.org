import Link from "next/link";
import { Home, Headphones, Play, Bookmark, UserRound, Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function MediaNav() {
  const user = await getCurrentUser();
  return (<>
    <header className="topbar">
      <div className="shell nav">
        <Link href="/" aria-label="Teens2Inspire home"><img className="logo" src="/teens2inspire-logo.png" alt="Teens2Inspire" /></Link>
        <nav className="links" aria-label="Main navigation">
          <Link href="/listen">Listen</Link><Link href="/watch">Watch</Link><Link href="/read">Read</Link><Link href="/resources">Resources</Link><Link href="/picks">Picks</Link><Link href="/events">Events</Link>
        </nav>
        <div className="spacer" />
        <form action="/search" className="nav-search"><Search size={16} aria-hidden="true"/><input className="search" name="q" aria-label="Search Teens2Inspire" placeholder="Search Teens2Inspire" /></form>
        {user ? <Link className="profile" href="/account" aria-label="Your account">{(user.email?.[0] || "G").toUpperCase()}</Link> : <Link className="btn nav-signin" href="/login">Sign in</Link>}
      </div>
    </header>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <Link href="/"><Home size={22} strokeWidth={1.8}/><span>Home</span></Link>
      <Link href="/search"><Search size={22} strokeWidth={1.8}/><span>Search</span></Link>
      <Link href="/listen"><Headphones size={22} strokeWidth={1.8}/><span>Listen</span></Link>
      <Link href="/watch"><Play size={22} strokeWidth={1.8}/><span>Watch</span></Link>
      <Link href="/saved"><Bookmark size={22} strokeWidth={1.8}/><span>Library</span></Link>
      <Link href={user ? "/account" : "/login"}><UserRound size={22} strokeWidth={1.8}/><span>{user ? "Profile" : "Sign in"}</span></Link>
    </nav>
  </>);
}
