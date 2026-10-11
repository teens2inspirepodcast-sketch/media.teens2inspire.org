import AppFrame from "@/components/app-frame";
import CatalogGrid from "@/app/library/catalog-grid";
import Link from "next/link";
export default function Page() { return <AppFrame title="Library" active="/library"><section className="quick-section"><div className="section-title"><div><div className="mini-label">YOUR SPACE / LIBRARY</div><h1 style={{fontFamily:"'Playfair Display',serif",fontWeight:500,fontSize:34,margin:"8px 0"}}>Library</h1><p style={{color:"#857b76",fontSize:13,lineHeight:1.8,maxWidth:650}}>Browse real published content from the Teens2Inspire catalog. Member-only playback is separately checked by the server.</p></div><Link href="/membership" className="app-btn app-btn-outline">Membership</Link></div></section><CatalogGrid /></AppFrame>; }
