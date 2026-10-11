"use client";
import Image from "next/image";
import { useState } from "react";
import { AudioLines, BookOpen, CalendarDays, ChevronRight, Compass, Heart, Menu, Search, ShieldCheck, Sparkles, Video, X } from "lucide-react";

const nav = [
  {label:"Home", href:"/", icon:Sparkles},
  {label:"Listen", href:"/listen", icon:AudioLines},
  {label:"Watch", href:"/watch", icon:Video},
  {label:"Read", href:"/read", icon:BookOpen},
  {label:"Resources", href:"/resources", icon:Compass},
  {label:"Events", href:"/events", icon:CalendarDays},
  {label:"Favorites", href:"/favorites", icon:Heart},
];

export default function AppFrame({children,title="Your space",active=""}:{children:React.ReactNode;title?:string;active?:string}) {
  const [menu,setMenu] = useState(false);
  const [search,setSearch] = useState("");
  return <main className="app-shell">
    <aside className={`sidebar ${menu?"sidebar-open":""}`}>
      <a className="app-brand" href="/"><Image src="/teens2inspire-logo.png" alt="Teens2Inspire" width={150} height={54}/></a>
      <div className="side-caption">YOUR INSPIRATION SPACE</div>
      <nav className="side-nav">{nav.map(item=>{const Icon=item.icon;return <a key={item.href} className={active===item.href?"side-active":""} href={item.href} onClick={()=>setMenu(false)}><Icon size={17}/>{item.label}</a>})}</nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note"><span className="note-star">✳</span><p>A little reminder:<br/><b>You are always becoming.</b></p></div>
        <a className="profile-link" href="/profile"><span>My profile</span><ChevronRight size={15}/></a>
        <a className="admin-shortcut" href="/admin"><ShieldCheck size={15}/> Admin Studio</a>
      </div>
    </aside>
    <div className="app-main">
      <header className="app-topbar">
        <button className="mobile-toggle" onClick={()=>setMenu(!menu)} aria-label={menu?"Close menu":"Open menu"}>{menu?<X/>:<Menu/>}</button>
        <div className="breadcrumb">YOUR SPACE <span>/</span> {title.toUpperCase()}</div>
        <div className="top-actions">
          <label className="search-box"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search the library" aria-label="Search the library" onKeyDown={e=>{if(e.key==="Enter")window.location.href=`/library?q=${encodeURIComponent(search)}`}}/></label>
          <a href="/membership" className="membership-pill">Membership</a><a href="/profile" className="avatar" aria-label="My profile">T</a>
        </div>
      </header>
      <div className="app-content">{children}</div>
      <footer className="app-footer"><span>© 2025 Teens2Inspire</span><span>Made with intention for Jewish teen girls.</span><div><a href="/help">Help</a><a href="/privacy">Privacy</a></div></footer>
    </div>
  </main>;
}
