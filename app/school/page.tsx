import AppFrame from "@/components/app-frame";
import Link from "next/link";
import RedeemForm from "./redeem-form";
import { currentUser } from "@/lib/auth";
export const dynamic="force-dynamic";
export default async function School(){const {user}=await currentUser();return <AppFrame title="School access"><section className="quick-section"><div className="mini-label">YOUR SPACE / SCHOOL ACCESS</div><h1 style={{fontFamily:"'Playfair Display',serif",fontWeight:500,fontSize:34}}>Access through your school.</h1><p style={{maxWidth:640,color:"#857b76",fontSize:13,lineHeight:1.8}}>If your school participates in Teens2Inspire, enter the access code it provided. A code is checked on the server and must be active and within its use limit.</p>{user?<RedeemForm/>:<div className="catalog-message">Sign in before redeeming a school code. <Link href="/login?next=%2Fschool">Sign in</Link></div>}</section></AppFrame>}
