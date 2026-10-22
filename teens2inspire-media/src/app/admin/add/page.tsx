import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ArrowLeft, Headphones, Video, FileText, FileDown, BookOpen, CalendarDays, Sparkles, PanelsTopLeft } from "lucide-react";
const types = [
 {title:"Podcast",description:"Audio episode, cover art, episode details, and optional player link.",type:"podcast",icon:Headphones,accent:"rose"},
 {title:"Video",description:"Video file, cover artwork, description, and preview details.",type:"video",icon:Video,accent:"plum"},
 {title:"Article",description:"A reading experience with a title, image, and written content.",type:"article",icon:FileText,accent:"gold"},
 {title:"Printable",description:"A downloadable PDF or worksheet. No video player fields.",type:"printable",icon:FileDown,accent:"blue"},
 {title:"Resource",description:"Guides, planners, worksheets, and other downloadable resources.",type:"resource",icon:BookOpen,accent:"rose"},
 {title:"Event",description:"Event flyer, date, location, details, and registration options.",type:"event",icon:CalendarDays,accent:"plum"},
 {title:"Original series",description:"A Teens2Inspire series or recurring editorial feature.",type:"original",icon:Sparkles,accent:"gold"},
 {title:"Create a section",description:"Add a new homepage shelf or curated collection.",type:"section",icon:PanelsTopLeft,accent:"blue"},
];
export default async function AddContent(){await requireAdmin();return <div className="studio-add-page"><Link href="/admin" className="studio-back-link"><ArrowLeft size={16}/> Dashboard</Link><div className="studio-welcome compact"><div><span className="studio-eyebrow">CONTENT STUDIO</span><h1>What are we creating?</h1><p>Choose a format to open its own tailored editor.</p></div></div><div className="studio-type-grid">{types.map(({title,description,type,icon:Icon,accent})=><Link className={`studio-type-card ${accent}`} href={type==="section"?"/admin/sections":type==="event"?"/admin/events":`/admin/content/new?type=${type}`} key={type}><span className="studio-action-icon"><Icon size={23}/></span><strong>{title}</strong><p>{description}</p><span className="studio-type-cta">Create {title.toLowerCase()} <span>→</span></span></Link>)}</div></div>}
