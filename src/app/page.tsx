import { redirect } from "next/navigation";

/** Canonical entry point for the Teens2Inspire media app. */
export default function HomePage() {
  redirect("/dashboard");
}
