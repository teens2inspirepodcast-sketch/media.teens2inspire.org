import AppFrame from "@/components/app-frame";
import CatalogGrid from "@/app/library/catalog-grid";
import Link from "next/link";
export default function Page() { return <AppFrame title="Read" active="/read"><section className="quick-section"><div className="section-title"><div><div className="mini-label">YOUR SPACE / READ</div><h1 style={{fontFamily:"'Playfair Display',serif",fontWeight:500,fontSize:34,margin:"8px 0"}}>Read</h1><p style={{color:"#857b76",fontSize:13,lineHeight:1.8,maxWidth:650}}>Articles and written reflections available in the catalog.</p></div><Link href="/membership" className="app-btn app-btn-outline">Membership</Link></div></section><CatalogGrid type="article"/></AppFrame>; }
