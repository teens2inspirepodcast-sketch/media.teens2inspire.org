"use client";
import {useState} from "react";
import {createBrowserClient} from "@supabase/ssr";
import Link from "next/link";
export default function Signup(){
 const [name,setName]=useState("");const [email,setEmail]=useState("");const [password,setPassword]=useState("");
 const [ageConfirmed,setAgeConfirmed]=useState(false);const [acceptedTerms,setAcceptedTerms]=useState(false);const [newsletterOptIn,setNewsletterOptIn]=useState(false);
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setMessage("");if(!ageConfirmed||!acceptedTerms){setMessage("Confirm that you are 13 or older and accept the Terms to create an account.");return;}
 setBusy(true);const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key){setMessage("Account creation is not configured. Add the Supabase URL and public key in the deployment environment.");setBusy(false);return;}
 const params=new URLSearchParams(window.location.search);const requested=params.get("plan");const plan=requested==="family"||requested==="school"||requested==="personal"?requested:"personal";
 try{const client=createBrowserClient(url,key);const {error}=await client.auth.signUp({email,password,options:{data:{first_name:name,display_name:name,age_group:"13plus",accepted_terms_at:new Date().toISOString(),membership_tier:plan,membership_plan:plan,newsletter_opt_in:newsletterOptIn},emailRedirectTo:`${window.location.origin}/auth/callback?next=/`}});if(error)throw error;setMessage("Check your email for the confirmation link, then sign in. A new account does not unlock paid media until membership is verified.");}
 catch(err){setMessage(err instanceof Error?err.message:"Could not create the account.");}finally{setBusy(false)}}
 return <main className="simple-screen"><section className="simple-panel"><div className="mini-label">YOUR NEXT CHAPTER</div><h1>Create your space.</h1><p>Start with an account. Protected member content still requires an active membership or valid school entitlement.</p>
 <form onSubmit={submit} style={{display:"grid",gap:12,margin:"24px 0"}}>
 <label style={{fontSize:11}}>First name<input required autoComplete="given-name" maxLength={60} value={name} onChange={e=>setName(e.target.value)} style={{display:"block",width:"100%",padding:13,marginTop:6,border:"1px solid #e5ddd4",background:"#fffdf9"}}/></label>
 <label style={{fontSize:11}}>Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} style={{display:"block",width:"100%",padding:13,marginTop:6,border:"1px solid #e5ddd4",background:"#fffdf9"}}/></label>
 <label style={{fontSize:11}}>Password<input required type="password" minLength={10} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} style={{display:"block",width:"100%",padding:13,marginTop:6,border:"1px solid #e5ddd4",background:"#fffdf9"}}/><span style={{display:"block",fontSize:9,color:"#8c827c",marginTop:5}}>Use at least 10 characters.</span></label>
 <label style={{display:"flex",alignItems:"flex-start",gap:9,fontSize:11,lineHeight:1.6}}><input required type="checkbox" checked={ageConfirmed} onChange={e=>setAgeConfirmed(e.target.checked)}/>I confirm that I am 13 years old or older.</label>
 <label style={{display:"flex",alignItems:"flex-start",gap:9,fontSize:11,lineHeight:1.6}}><input required type="checkbox" checked={acceptedTerms} onChange={e=>setAcceptedTerms(e.target.checked)}/>I have read and accept the <Link href="/terms">Terms of Use</Link> and <Link href="/privacy">Privacy notice</Link>.</label>
 <label style={{display:"flex",alignItems:"flex-start",gap:9,fontSize:11,lineHeight:1.6}}><input type="checkbox" checked={newsletterOptIn} onChange={e=>setNewsletterOptIn(e.target.checked)}/>Email me Teens2Inspire news and updates. This is optional.</label>
 <button className="app-btn app-btn-dark" disabled={busy} style={{border:0,justifyContent:"center",marginTop:6}}>{busy?"Creating account…":"Create account"}</button></form>
 {message&&<p role="status" aria-live="polite">{message}</p>}<p>Already have an account? <Link href="/login">Sign in</Link></p><Link href="/">← Back to library home</Link></section></main>
}
