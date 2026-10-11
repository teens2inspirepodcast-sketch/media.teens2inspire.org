import AppFrame from "@/components/app-frame";
import CatalogGrid from "@/app/library/catalog-grid";
import Link from "next/link";
export default function Page() { return <AppFrame title="Watch" active="/watch"><section className="quick-section"><div className="section-title"><div><div className="mini-label">YOUR SPACE / WATCH</div><h1 style={{fontFamily:"'Playfair Display',serif",fontWeight:500,fontSize:34,margin:"8px 0"}}>Watch</h1><p style={{color:"#857b76",fontSize:13,lineHeight:1.8,maxWidth:650}}>Videos and interviews from the real Teens2Inspire library.</p></div><Link href="/membership" className="app-btn app-btn-outline">Membership</Link></div></section><CatalogGrid type="video"/></AppFrame>; }
