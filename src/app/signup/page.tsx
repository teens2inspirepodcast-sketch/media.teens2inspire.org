import { redirect } from "next/navigation";

const MARKETING_ORIGIN = process.env.NEXT_PUBLIC_MARKETING_URL || "https://teens2inspire.org";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const params = await searchParams;
  const allowedPlan = params.plan === "personal" || params.plan === "family" || params.plan === "school" ? params.plan : null;
  const destination = new URL("/signup", MARKETING_ORIGIN);
  if (allowedPlan) destination.searchParams.set("plan", allowedPlan);
  redirect(destination.toString());
}
