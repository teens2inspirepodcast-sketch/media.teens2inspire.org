import Link from "next/link";
import Image from "next/image";
import { AuthForm } from "@/components/auth-form";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const message = params.error === "verification" ? "That verification link could not be completed. Try signing in or request a new verification email." : "";
  return <main className="media-auth-page"><Link className="media-auth-logo" href="/" aria-label="Teens2Inspire home"><Image src="/teens2inspire-logo.png" alt="Teens2Inspire — a media platform for Jewish teen girls" width={520} height={130} priority/></Link><section className="media-auth-panel"><span className="app-overline">WELCOME BACK</span><h1>Good to have you back.</h1><p>Sign in to pick up where you left off.</p><AuthForm mode="login" initialMessage={message}/><div className="media-auth-foot"><Link href="https://teens2inspire.org">Back to Teens2Inspire.org</Link></div></section></main>;
}
