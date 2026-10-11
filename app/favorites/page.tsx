import AppFrame from "@/components/app-frame";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
export const dynamic="force-dynamic";
export default async function Favorites(){const {user}=await currentUser();return <AppFrame title="Favorites" active="/favorites"><section className="quick-section"><div className="mini-label">YOUR SPACE / SAVED</div><h1 style={{fontFamily:"'Playfair Display',serif",fontWeight:500,fontSize:34}}>Your favorites.</h1>{!user?<div className="catalog-message">Sign in to keep track of the content you want to revisit. <Link href="/login?next=%2Ffavorites">Sign in</Link></div>:<div className="catalog-message">Your saved collection will appear here as you save items. Browse the live library to find something to keep close. <Link href="/library">Browse library</Link></div>}</section></AppFrame>}
