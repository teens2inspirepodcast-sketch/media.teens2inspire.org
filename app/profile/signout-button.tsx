"use client";
import {createBrowserClient} from "@supabase/ssr";
export default function SignOutButton(){return <button className="app-btn app-btn-outline" onClick={async()=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(url&&key){const client=createBrowserClient(url,key);await client.auth.signOut()}window.location.href="/login"}}>Sign out</button>}
