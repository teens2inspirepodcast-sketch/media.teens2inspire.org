import Link from "next/link";
import Image from "next/image";
import { AuthForm } from "@/components/auth-form";
export default function SignupPage() {
  return <main className="media-auth-page"><Link className="media-auth-logo" href="/" aria-label="Teens2Inspire home"><Image src="/teens2inspire-logo.png" alt="Teens2Inspire — a media platform for Jewish teen girls" width={520} height={130} priority/></Link><section className="media-auth-panel"><span className="app-overline">MAKE YOURSELF AT HOME</span><h1>Start your next chapter.</h1><p>Create an account to explore the Teens2Inspire media library.</p><AuthForm mode="signup"/><div className="media-auth-foot"><Link href="https://teens2inspire.org/membership">Membership options</Link><Link href="https://teens2inspire.org">Back to the main website</Link></div></section></main>;
}
