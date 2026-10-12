import { redirect } from "next/navigation";

/**
 * Explicit root route for media.teens2inspire.org.
 * Sends visitors into the app; unauthenticated visitors are redirected
 * to /login by the existing requireUser guard in the app layout.
 */
export default function HomePage() {
  redirect("/app");
}
