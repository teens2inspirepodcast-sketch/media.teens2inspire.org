import AppFrame from "@/components/app-frame";
import CatalogGrid from "@/app/library/catalog-grid";
import Link from "next/link";
export default function Page() { return <AppFrame title="Resources" active="/resources"><section className="quick-section"><div className="section-title"><div><div className="mini-label">YOUR SPACE / RESOURCES</div><h1 style={{fontFamily:"'Playfair Display',serif",fontWeight:500,fontSize:34,margin:"8px 0"}}>Resources</h1><p style={{color:"#857b76",fontSize:13,lineHeight:1.8,maxWidth:650}}>Printables and resources published by the Teens2Inspire team.</p></div><Link href="/membership" className="app-btn app-btn-outline">Membership</Link></div></section><CatalogGrid type="resource"/></AppFrame>; }
